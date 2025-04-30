import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a new repository
const createRepositorySchema = z.object({
  name: z.string().trim().min(1, 'Repository name is required'),
  description: z.string().trim().min(1, 'Repository description is required'),
  isPrivate: z.boolean().default(true),
});

// GET: Retrieve all repositories for a specific group
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.groupId;
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0;
    const name = searchParams.get('name') || undefined;

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this group
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.id);
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to view repositories for this group' },
        { status: 403 }
      );
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
            id: true,
            firstName: true,
            lastName: true,
            username: true,
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
      repositories,
      pagination: {
        total,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new repository for a group
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.groupId;

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create repositories
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.id);
    const isGroupLeader = group.leaderId === session.user.id;
    
    if (!isGroupMember && !isGroupLeader) {
      return NextResponse.json(
        { message: 'You do not have permission to create repositories for this group' },
        { status: 403 }
      );
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

    const { name, description, isPrivate } = validationResult.data;

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

    // Create the repository
    const repository = await db.repository.create({
      data: {
        name,
        description,
        isPrivate,
        groupId,
        ownerId: session.user.id, // Set the current user as the owner
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
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

    // Create a default main branch for the repository
    await db.branch.create({
      data: {
        name: 'main',
        repositoryId: repository.id,
        // You would need to create an initial commit and set it as the head
        // This is a simplified version - in a real app, you'd handle initial commit creation
        headCommitId: 'initial', // Mock ID - in real implementation you'd create a real commit
      },
    });

    return NextResponse.json(repository, { status: 201 });
  } catch (error) {
    console.error('Error creating repository:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}