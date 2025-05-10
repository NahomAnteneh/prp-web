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
  path: z.array(z.string()).optional(),
});

// Schema for tree nodes
const TreeNodeSchema = z.object({
  path: z.string(),
  type: z.enum(["file", "directory"]),
});

// Define types
type TreeNode = z.infer<typeof TreeNodeSchema>;

export async function GET(
  req: NextRequest,
  context: { params: { groupId: string; repositoryId: string; branch: string; path?: string[] } }
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

    const { groupId, repositoryId, branch, path = [] } = parsedParams.data;
    const currentPath = path.join("/");
    
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
      },
      include: {
        headCommit: true,
      }
    });

    if (!branchData) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Get all file changes for this commit
    const fileChanges = await db.fileChange.findMany({
      where: {
        commitId: branchData.headCommitId,
        changeType: { not: "DELETED" }
      }
    });

    // Build tree structure
    const treeNodes: TreeNode[] = [];
    const treeEntries = new Map<string, Set<string>>();
    
    // First pass: collect all files and directories
    fileChanges.forEach(change => {
      const pathParts = change.filePath.split('/');
      const fileName = pathParts.pop()!;
      
      // Add the file itself
      treeNodes.push({
        path: change.filePath,
        type: "file",
      });
      
      // Add all parent directories
      let currentPathBuild = "";
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPathBuild = currentPathBuild ? `${currentPathBuild}/${part}` : part;
        
        if (!treeEntries.has(currentPathBuild)) {
          treeEntries.set(currentPathBuild, new Set());
          // Add directory to tree nodes
          treeNodes.push({
            path: currentPathBuild,
            type: "directory",
          });
        }
        
        if (i < pathParts.length - 1) {
          treeEntries.get(currentPathBuild)!.add(pathParts[i + 1]);
        } else {
          treeEntries.get(currentPathBuild)!.add(fileName);
        }
      }
    });

    // Filter for current path
    const filteredNodes = treeNodes.filter(node => {
      if (currentPath === "") {
        // Root level, show only top-level items
        return node.path.split("/").length === 1;
      }
      // In subfolder, show direct children only
      return (
        node.path.startsWith(currentPath + "/") &&
        node.path.split("/").length === currentPath.split("/").length + 1
      );
    });

    return NextResponse.json({
      tree: filteredNodes,
      path: currentPath,
    });
  } catch (error) {
    console.error("Error fetching repository tree:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository tree" },
      { status: 500 }
    );
  }
} 