import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a new branch
const createBranchSchema = z.object({
  name: z.string().trim().min(1, 'Branch name is required'),
  sourceBranchName: z.string().optional(), // Optional source branch to fork from
});

// GET: Retrieve all branches for a repository
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, repositoryId } = params;
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name') || undefined;

    // Verify the group exists
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

    // Verify the repository exists and belongs to the group
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this group
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.id);
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to view branches for this repository' },
        { status: 403 }
      );
    }

    // Fetch branches with their head commits
    const branches = await db.branch.findMany({
      where: {
        repositoryId,
        ...(name && { name: { contains: name, mode: 'insensitive' } }),
      },
      include: {
        headCommit: {
          select: {
            id: true,
            message: true,
            timestamp: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new branch
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, repositoryId } = params;

    // Verify the group exists
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

    // Verify the repository exists and belongs to the group
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create branches
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.id);
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to create branches for this repository' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createBranchSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, sourceBranchName } = validationResult.data;

    // Check if branch name is already used in this repository
    const existingBranch = await db.branch.findFirst({
      where: {
        repositoryId,
        name,
      },
    });

    if (existingBranch) {
      return NextResponse.json(
        { message: 'A branch with this name already exists in the repository' },
        { status: 409 }
      );
    }

    // Find source branch to get head commit (default to 'main' if not specified)
    const sourceBranch = await db.branch.findFirst({
      where: {
        repositoryId,
        name: sourceBranchName || 'main',
      },
      include: {
        headCommit: true,
      },
    });

    if (!sourceBranch) {
      return NextResponse.json(
        { message: 'Source branch not found' },
        { status: 404 }
      );
    }

    // Create the new branch pointing to the same head commit as the source branch
    const branch = await db.branch.create({
      data: {
        name,
        repositoryId,
        headCommitId: sourceBranch.headCommitId,
      },
      include: {
        headCommit: {
          select: {
            id: true,
            message: true,
            timestamp: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}