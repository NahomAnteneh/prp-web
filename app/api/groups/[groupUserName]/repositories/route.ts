import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatTimeAgo } from '@/lib/utils';
import { z } from 'zod';

// Schema for creating a new repository
const createRepositorySchema = z
  .object({
    name: z.string().trim().min(1, 'Repository name is required').max(255, 'Repository name is too long'),
    description: z.string().trim().min(1, 'Description is required').max(1000, 'Description is too long'),
    isPrivate: z.enum(['public', 'private']).optional(),
    visibility: z.enum(['public', 'private']).optional(),
  })
  .refine((data) => data.isPrivate !== undefined || data.visibility !== undefined, {
    message: 'Either isPrivate or visibility must be provided',
    path: ['isPrivate', 'visibility'],
  })
  .transform((data) => ({
    name: data.name,
    description: data.description,
    isPrivate: (data.isPrivate ?? data.visibility) === 'private', // Transform to Boolean
  }));

// GET: Retrieve all repositories for a specific group
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string } }
) {
  try {
    const { groupUserName } = await params;
    if (!groupUserName) {
      return NextResponse.json({ message: 'Group username is required' }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0;
    const name = searchParams.get('name') || undefined;

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Get all repositories for the group with filtering
    const repositories = await db.repository.findMany({
      where: {
        groupUserName, // Using groupUserName
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
      include: {
        owner: {
          select: {
            name: true,
            leaderId: true,
          },
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            commits: true,
            branches: true,
            projects: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await db.repository.count({
      where: {
        groupUserName,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
    });

    // Format repositories for consistent response
    const formattedRepositories = repositories.map(repo => ({
      name: repo.name,
      description: repo.description,
      isPrivate: repo.isPrivate,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      lastActivity: formatTimeAgo(repo.updatedAt),
      ownerId: repo.ownerId,
      groupUserName: repo.groupUserName,
      group: {
        name: repo.owner.name,
        leaderId: repo.owner.leaderId,
      },
      projects: repo.projects.map(p => ({
        id: p.project.id,
        title: p.project.title,
      })),
      stats: {
        commits: repo._count.commits,
        branches: repo._count.branches,
        projects: repo._count.projects,
      },
    }));

    return NextResponse.json({
      repositories: formattedRepositories,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + repositories.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new repository for a group
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string } }
) {
  const session = await getServerSession(authOptions);

  let rawData: { name: string; description: string; isPrivate?: boolean } | undefined = undefined;
  try {
    // Handle params
    const resolvedParams = await Promise.resolve(params);
    const groupUserName = resolvedParams.groupUserName;

    // Validate groupUserName
    const groupUserNameSchema = z.string().min(1, 'Group username is required');
    const parsedGroupUserName = groupUserNameSchema.safeParse(groupUserName);
    if (!parsedGroupUserName.success) {
      return NextResponse.json(
        { message: 'Invalid group username format', errors: parsedGroupUserName.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
      select: {
        groupUserName: true,
        name: true,
        leaderId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Parse and validate input data
    try {
      rawData = await req.json();
      console.log('Request body:', rawData); // Temporary logging for debugging
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validationResult = createRepositorySchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid input',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description, isPrivate } = validationResult.data;

    // Create repository without initial commit in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check if a repository with this name already exists for this group
      const existingRepo = await tx.repository.findUnique({
        where: {
          name_groupUserName: {
            name,
            groupUserName,
          },
        },
      });

      if (existingRepo) {
        throw new Error(`A repository with the name "${name}" already exists for this group`);
      }

      // Create repository
      const repository = await tx.repository.create({
        data: {
          name,
          description,
          isPrivate, // Boolean value
          groupUserName,
          ownerId: session?.user.userId ?? 'unknown-author', // Use session user as owner
        },
        include: {
          owner: {
            select: {
              name: true,
              leaderId: true,
            },
          },
        },
      });

      return repository;
    });

    // Format response using consistent format
    const formattedRepository = {
      name: result.name,
      description: result.description,
      isPrivate: result.isPrivate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      lastActivity: formatTimeAgo(result.updatedAt),
      ownerId: result.ownerId,
      groupUserName: result.groupUserName,
      group: {
        name: group.name,
        leaderId: group.leaderId,
      },
      stats: {
        commits: 0, // No initial commit
        branches: 0, // No initial branch
        projects: 0,
      },
    };

    return NextResponse.json(
      {
        message: 'Repository created successfully',
        repository: formattedRepository,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating repository:', error);
    
    // Handle specific error for duplicate repository name
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { message: error.message },
        { status: 409 } // Conflict status code
      );
    }

    return NextResponse.json(
      { message: 'Failed to create repository' },
      { status: 500 }
    );
  }
}