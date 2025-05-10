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
  path: z.array(z.string()).min(1),
});

// Query parameters schema
const querySchema = z.object({
  raw: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
});

// Schema for file content response
const fileSchema = z.object({
  name: z.string(),
  path: z.string(),
  content: z.string().nullable(),
  isBinary: z.boolean(),
});

export async function GET(
  req: NextRequest,
  context: { params: { groupId: string; repositoryId: string; branch: string; path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { params } = context;
    
    // Parse URL query parameters
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams);
    const { raw = false } = querySchema.parse(query);
    
    // Validate params
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { groupId, repositoryId, branch, path } = parsedParams.data;
    const filePath = path.join("/");
    
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

    // Find the file change for this path
    const fileChange = await db.fileChange.findFirst({
      where: {
        commit: {
          id: branchData.headCommitId,
          repositoryId,
        },
        filePath,
        changeType: { not: "DELETED" }
      },
      orderBy: {
        commit: {
          timestamp: 'desc'
        }
      }
    });

    if (!fileChange) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Get file name from path
    const fileName = filePath.split("/").pop() || "";
    
    // Check if file is likely binary based on extension
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe', '.dll'];
    const isBinary = binaryExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

    // In a real implementation, you would retrieve the file content
    // from a storage system using the fileContentHash
    // This is a simplified example - replace with your actual file storage retrieval
    const content = isBinary 
      ? null 
      : `This is the content of ${filePath} (hash: ${fileChange.fileContentHash})`;
      
    // For raw content delivery (e.g., for images, downloads)
    if (raw && isBinary) {
      // In a real implementation, this would return the raw binary data
      // For demo purposes, we'll return a simple message
      return new Response(
        `[Binary data would be returned for ${filePath}]`, 
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename=${fileName}`
          }
        }
      );
    }
    
    // For normal JSON response with file metadata and content
    const fileContent = {
      name: fileName,
      path: filePath,
      content,
      isBinary,
    };

    return NextResponse.json(fileContent);
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch file content" },
      { status: 500 }
    );
  }
} 