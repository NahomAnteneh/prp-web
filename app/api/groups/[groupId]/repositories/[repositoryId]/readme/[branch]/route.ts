import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schemas
const paramsSchema = z.object({
  groupId: z.string().min(1),
  repositoryId: z.string().min(1),
  branch: z.string().min(1),
});

// Query parameters schema
const querySchema = z.object({
  folder: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: { groupId: string; repositoryId: string; branch: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { params } = context;
    
    // Parse URL query parameters
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams);
    const { folder = '' } = querySchema.parse(query);
    
    // Validate params
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { groupId, repositoryId, branch } = parsedParams.data;
    
    // Find the repository first to check privacy and permissions
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId,
      },
      include: {
        group: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
            leaderId: true,
          },
        },
      },
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

    // Get the branch to find the head commit
    const branchData = await db.branch.findUnique({
      where: {
        repositoryId_name: {
          repositoryId,
          name: branch,
        }
      }
    });

    if (!branchData) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Format folder path correctly
    const folderPath = folder 
      ? folder.endsWith('/') 
        ? folder 
        : `${folder}/` 
      : '';
    
    // Look for README.md file in the specified folder
    const readmePath = `${folderPath}README.md`;
    
    // Find the file change for the README
    const fileChange = await db.fileChange.findFirst({
      where: {
        commit: {
          id: branchData.headCommitId,
          repositoryId,
        },
        filePath: readmePath,
        changeType: { not: "DELETED" }
      },
      orderBy: {
        commit: {
          timestamp: 'desc'
        }
      }
    });

    if (!fileChange) {
      // Try with other common README filenames
      const alternateFileChange = await db.fileChange.findFirst({
        where: {
          commit: {
            id: branchData.headCommitId,
            repositoryId,
          },
          filePath: {
            in: [
              `${folderPath}readme.md`,
              `${folderPath}Readme.md`,
              `${folderPath}README.markdown`,
              `${folderPath}README.txt`,
              `${folderPath}readme.txt`
            ]
          },
          changeType: { not: "DELETED" }
        },
        orderBy: {
          commit: {
            timestamp: 'desc'
          }
        }
      });

      if (!alternateFileChange) {
        return NextResponse.json(
          { content: "" },
          { status: 200 }
        );
      }

      // If found an alternate README file
      // In a real implementation, you would retrieve the file content
      // from a storage system using the fileContentHash
      // This is a simplified example - replace with your actual file storage retrieval
      return NextResponse.json({
        content: `# ${repository.name}\n\nThis is a placeholder README content. In a real implementation, this would be retrieved from storage using hash ${alternateFileChange.fileContentHash}.`
      });
    }

    // In a real implementation, you would retrieve the README content
    // from a storage system using the fileContentHash
    // This is a simplified example - replace with your actual file storage retrieval
    const readmeContent = `# ${repository.name}\n\nThis is a placeholder README content. In a real implementation, this would be retrieved from storage using hash ${fileChange.fileContentHash}.`;
    
    return NextResponse.json({
      content: readmeContent
    });
  } catch (error) {
    console.error("Error fetching README:", error);
    return NextResponse.json(
      { error: "Failed to fetch README" },
      { status: 500 }
    );
  }
} 