import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const paramsSchema = z.object({
  groupId: z.string().min(1),
  repositoryId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  context: { params: { groupId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { params } = context;
    
    // Validate params
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { groupId, repositoryId } = parsedParams.data;
    
    // Find the repository first to check privacy and permissions
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId,
      },
      include: {
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                userId: true,
              },
            },
            leaderId: true,
          }
        },
        branches: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            commits: true,
            branches: true,
          }
        }
      }
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    // If repository is private, check authentication
    if (repository.isPrivate) {
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check if user has access to this private repository
      const isGroupMember = repository.group?.members.some(
        (member: { userId: string }) => member.userId === session.user.userId
      ) || false;
      const isGroupLeader = repository.group?.leaderId === session.user.userId;
      const isRepoOwner = repository.ownerId === session.user.userId;

      if (!isGroupMember && !isGroupLeader && !isRepoOwner) {
        return NextResponse.json(
          { error: "You do not have permission to view this private repository" },
          { status: 403 }
        );
      }
    }

    // Find default branch (usually "main" or "master")
    const defaultBranch = repository.branches.find(b => b.name === "main") || 
                          repository.branches.find(b => b.name === "master") || 
                          repository.branches[0];
                          
    // Get contributors
    const contributors = await db.commit.findMany({
      where: {
        repositoryId,
      },
      select: {
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      distinct: ['authorId'],
      take: 10,
    });

    // Format repository data
    const formattedRepo = {
      id: repository.id,
      name: repository.name,
      description: repository.description,
      isPrivate: repository.isPrivate,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
      owner: repository.owner,
      group: {
        id: repository.group?.id,
        name: repository.group?.name,
      },
      stats: {
        commits: repository._count.commits,
        branches: repository._count.branches,
      },
      defaultBranch: defaultBranch ? {
        id: defaultBranch.id,
        name: defaultBranch.name,
      } : null,
      branches: repository.branches,
      contributors: contributors.map(c => c.author),
      isOwner: repository.owner.userId === session?.user?.userId
    };

    return NextResponse.json(formattedRepo);
  } catch (error) {
    console.error("Error fetching repository overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository overview" },
      { status: 500 }
    );
  }
} 