import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

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
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Get all repositories for the group with filtering
    const repositories = await prisma.repository.findMany({
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

    const total = await prisma.repository.count({
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
    // Handle params
    const resolvedParams = await Promise.resolve(params);
    const groupId = resolvedParams.groupId;

    // Validate groupId
    const groupIdSchema = z.string().min(1, 'Group ID is required');
    const parsedGroupId = groupIdSchema.safeParse(groupId);
    if (!parsedGroupId.success) {
      return NextResponse.json(
        { message: 'Invalid group ID format' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists and user is a member or admin
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        leaderId: true,
        members: { select: { userId: true } },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    const isGroupMember = group.members.some((m) => m.userId === session.user.userId);
    const isGroupLeader = group.leaderId === session.user.userId;

    if (!isGroupMember) {
      return NextResponse.json(
        { message: 'You must be a member of this group to create a repository' },
        { status: 403 }
      );
    }

    if (!isGroupLeader) {
      return NextResponse.json(
        { message: 'Only the group leader can create repositories' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
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

    const { name, description, visibility } = validationResult.data;

    // Create repository with initial commit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create repository
      const repository = await tx.repository.create({
        data: {
          name,
          description: description || '',
          isPrivate: visibility === 'private',
          ownerId: session.user.userId,
          groupId: group.id,
        },
        include: {
          group: true,
          owner: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create initial commit
      const initialCommit = await tx.commit.create({
        data: {
          id: `commit-${Date.now()}`,
          message: 'Initial commit',
          timestamp: new Date(),
          repositoryId: repository.id,
          authorId: session.user.userId,
          parentCommitIDs: [],
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
      visibility: result.isPrivate ? 'private' : 'public',
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      group: {
        id: result.group?.id ?? '',
        name: result.group?.name ?? '',
      },
      owner: {
        userId: result.owner.userId,
        firstName: result.owner.firstName,
        lastName: result.owner.lastName,
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
        return NextResponse.json(
          { message: 'A repository with this name already exists for this group' },
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