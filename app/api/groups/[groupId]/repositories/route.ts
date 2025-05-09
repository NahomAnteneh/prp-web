import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

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
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ message: 'Group ID is required' }, { status: 400 });
    }

    const realGroupId = await prisma.group.findUnique({
      where: { groupUserName: groupId },
      select: { id: true },
    });

    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0;
    const name = searchParams.get('name') || undefined;

    // Verify that the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Get all repositories for the group with filtering
    const repositories = await prisma.repository.findMany({
      where: {
        groupId, // Correctly referencing the groupId
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            groupUserName: true,
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
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.repository.count({
      where: {
        groupId,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
    });

    return NextResponse.json({
      repositories: repositories.map((repo) => ({
        ...repo,
        isPrivate: repo.isPrivate ? 'private' : 'public',
      })),
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
  { params }: { params: { groupId: string } }
) {

  const session = await getServerSession(authOptions);

  let rawData: { name: string; description: string; isPrivate?: boolean } | undefined = undefined; // Updated type for rawData
  try {
    // Handle params
    const resolvedParams = await Promise.resolve(params);
    const groupId = resolvedParams.groupId;

    // Validate groupId
    const groupIdSchema = z.string().min(1, 'Group ID is required');
    const parsedGroupId = groupIdSchema.safeParse(groupId);
    if (!parsedGroupId.success) {
      return NextResponse.json(
        { message: 'Invalid group ID format', errors: parsedGroupId.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        groupUserName: true,
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

    // Create repository with initial commit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create repository
      const repository = await tx.repository.create({
        data: {
          name,
          description,
          isPrivate, // Boolean value
          groupId: group.id,
          ownerId: group.id, // Assuming the group ID is used as the owner ID
        },
        include: {
          owner: {
            select: {
              id: true,
              groupUserName: true,
            },
          },
        },
      });

      // Create initial commit
      const initialCommit = await tx.commit.create({
        data: {
          id: `commit-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          message: 'Initial commit',
          timestamp: new Date(),
          repositoryId: repository.id,
          parentCommitIDs: [],
          authorId: session?.user.userId ?? 'unknown-author', // Provide a fallback value for authorId
        },
      });

      // Create main branch
      await tx.branch.create({
        data: {
          name: 'main',
          repositoryId: repository.id,
          headCommitId: initialCommit.id,
        },
      });

      return repository;
    });

    // Format response
    const formattedRepository = {
      id: result.id,
      name: result.name,
      description: result.description,
      isPrivate: result.isPrivate ? 'private' : 'public',
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      owner: {
        id: result.owner.id,
        groupUserName: result.owner.groupUserName,
      },
    };

    return NextResponse.json(
      {
        message: 'Repository created successfully',
        ...formattedRepository,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating repository:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const repoName = rawData?.name || 'unknown';
        return NextResponse.json(
          { message: `A repository with the name "${repoName}" already exists for this group` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}