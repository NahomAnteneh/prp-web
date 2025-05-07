import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a new repository
const createRepositorySchema = z.object({
  name: z.string().trim().min(1, 'Repository name is required').max(255, 'Repository name is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  visibility: z.enum(['public', 'private'], { message: 'Visibility must be public or private' }),
});

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

    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0;
    const name = searchParams.get('name') || undefined;

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Get all repositories for the group with filtering
    const repositories = await db.repository.findMany({
      where: {
        groupId,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
      include: {
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
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

    const total = await db.repository.count({
      where: {
        groupId,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
    });

    return NextResponse.json({
      repositories: repositories.map((repo) => ({
        ...repo,
        visibility: repo.isPrivate ? 'private' : 'public',
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
  try {
    const { groupId } = params;
    if (!groupId) {
      return NextResponse.json({ message: 'Group ID is required' }, { status: 400 });
    }

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createRepositorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, visibility } = validationResult.data;
    const isPrivate = visibility === 'private';

    // Check if a repository with the same name already exists in this group
    const existingRepository = await db.repository.findFirst({
      where: {
        groupId,
        name,
      },
    });

    if (existingRepository) {
      return NextResponse.json(
        { message: 'A repository with this name already exists in the group' },
        { status: 409 }
      );
    }

    // Create an initial commit
    const initialCommit = await db.commit.create({
      data: {
        id: `commit-${Date.now()}`, // Simplified; in production, use a proper hash
        message: 'Initial commit',
        timestamp: new Date(),
        repositoryId: '', // Will be updated after repository creation
        authorId: 'system', // Placeholder for system-generated commits
        parentCommitIDs: [],
      },
    });

    // Create the repository
    const repository = await db.repository.create({
      data: {
        name,
        description: description || '',
        isPrivate,
        groupId,
        ownerId: 'system', // Placeholder for system ownership
      },
      include: {
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update the initial commit with the repository ID
    await db.commit.update({
      where: { id: initialCommit.id },
      data: { repositoryId: repository.id },
    });

    // Create a default main branch
    await db.branch.create({
      data: {
        name: 'main',
        repositoryId: repository.id,
        headCommitId: initialCommit.id,
      },
    });

    return NextResponse.json(
      {
        ...repository,
        visibility: repository.isPrivate ? 'private' : 'public',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating repository:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}