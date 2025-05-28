import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating a new commit
const createCommitSchema = z.object({
  message: z.string().trim().min(1, 'Commit message is required'),
  branchName: z.string().trim().min(1, 'Branch name is required'),
  parentCommitIds: z.array(z.string()).optional().default([]),
  fileChanges: z.array(
    z.object({
      filePath: z.string().trim().min(1, 'File path is required'),
      changeType: z.enum(['ADDED', 'MODIFIED', 'DELETED']),
      fileContentHash: z.string().optional().nullable(),
      previousFileContentHash: z.string().optional().nullable(),
    })
  ).min(1, 'At least one file change is required'),
});

// GET: Retrieve all commits for a repository
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupUserName, repositoryId } = params;
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0;
    const branchName = searchParams.get('branch') || undefined;
    const message = searchParams.get('message') || undefined;
    const authorId = searchParams.get('authorId') || undefined;

    // Verify the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
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
        groupUserName,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this group
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.userId);
    const isGroupLeader = group.leaderId === session.user.userId;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to view commits for this repository' },
        { status: 403 }
      );
    }

    // If branch name is provided, we need to get commits for that specific branch
    let commitFilter = {};
    if (branchName) {
      const branch = await db.branch.findFirst({
        where: {
          repositoryId,
          name: branchName,
        },
        include: {
          headCommit: true,
        },
      });

      if (!branch) {
        return NextResponse.json(
          { message: 'Branch not found' },
          { status: 404 }
        );
      }

      // We would need a helper function to get all commits in a branch
      // For simplicity, we'll just show a limited approach here
      // In a real implementation, you would traverse the commit history using parentCommitIDs
      commitFilter = {
        id: branch.headCommitId,
      };
    }

    // Fetch commits with filtering options
    const commits = await db.commit.findMany({
      where: {
        repositoryId,
        ...(commitFilter),
        ...(message && { message: { contains: message, mode: 'insensitive' } }),
        ...(authorId && { authorId }),
      },
      include: {
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        fileChanges: {
          select: {
            id: true,
            filePath: true,
            changeType: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await db.commit.count({
      where: {
        repositoryId,
        ...(commitFilter),
        ...(message && { message: { contains: message, mode: 'insensitive' } }),
        ...(authorId && { authorId }),
      },
    });

    return NextResponse.json({
      commits,
      pagination: {
        total,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new commit
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupUserName, repositoryId } = params;

    // Verify the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
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
        groupUserName,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create commits
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.userId);
    const isGroupLeader = group.leaderId === session.user.userId;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to create commits for this repository' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createCommitSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message, branchName, parentCommitIds, fileChanges } = validationResult.data;

    // Find branch to update
    const branch = await db.branch.findFirst({
      where: {
        repositoryId,
        name: branchName,
      },
      include: {
        headCommit: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { message: 'Branch not found' },
        { status: 404 }
      );
    }

    // Create commit ID (usually this would be a hash of the content)
    const commitId = `commit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create commit in a transaction
    const newCommit = await db.$transaction(async (tx) => {
      // Create the commit
      const commit = await tx.commit.create({
        data: {
          id: commitId,
          message,
          timestamp: new Date(),
          repositoryId,
          authorId: session.user.userId,
          parentCommitIDs: parentCommitIds.length > 0 ? parentCommitIds : [branch.headCommitId],
        },
      });

      // Create all file changes
      for (const change of fileChanges) {
        await tx.fileChange.create({
          data: {
            filePath: change.filePath,
            changeType: change.changeType,
            fileContentHash: change.fileContentHash || null,
            previousFileContentHash: change.previousFileContentHash || null,
            commitId: commit.id,
          },
        });
      }

      // Update branch head
      await tx.branch.update({
        where: {
          id: branch.id,
        },
        data: {
          headCommitId: commit.id,
        },
      });

      return commit;
    });

    // Fetch the complete commit with relations
    const completeCommit = await db.commit.findUnique({
      where: {
        id: newCommit.id,
      },
      include: {
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        fileChanges: true,
      },
    });

    return NextResponse.json(completeCommit, { status: 201 });
  } catch (error) {
    console.error('Error creating commit:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}