import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Retrieve a specific commit by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string; repositoryId: string; commitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, repositoryId, commitId } = params;

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
        { message: 'You do not have permission to view this commit' },
        { status: 403 }
      );
    }

    // Find the specific commit
    const commit = await db.commit.findUnique({
      where: {
        id: commitId,
        repositoryId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        fileChanges: {
          select: {
            id: true,
            filePath: true,
            changeType: true,
            fileContentHash: true,
            previousFileContentHash: true,
          },
        },
        // Include branches where this commit is the head
        branchesHead: {
          select: {
            id: true,
            name: true,
          },
        },
        // Include merge request if this is a merge commit
        mergeRequest: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
            creator: {
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

    if (!commit) {
      return NextResponse.json(
        { message: 'Commit not found' },
        { status: 404 }
      );
    }

    // Find parent commits based on parentCommitIDs array
    const parentCommits = commit.parentCommitIDs.length > 0 
      ? await db.commit.findMany({
          where: {
            id: { in: commit.parentCommitIDs },
          },
          select: {
            id: true,
            message: true,
            timestamp: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        })
      : [];

    // Return commit with parent commits included
    return NextResponse.json({
      ...commit,
      parentCommits,
    });
  } catch (error) {
    console.error('Error fetching commit details:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}