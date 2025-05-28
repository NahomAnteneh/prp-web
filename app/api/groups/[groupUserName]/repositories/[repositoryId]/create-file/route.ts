import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for file creation
const createFileSchema = z.object({
  filePath: z.string().trim().min(1, 'File path is required'),
  content: z.string().optional().default(''),
  commitMessage: z.string().trim().min(1, 'Commit message is required'),
  branch: z.string().optional().default('main'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { groupUserName, repositoryId } = params;
    if (!groupUserName || !repositoryId) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const validationResult = createFileSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { filePath, content, commitMessage, branch } = validationResult.data;

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryId,
          groupUserName,
        }
      },
    });

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Find the branch
    const branchRecord = await prisma.branch.findFirst({
      where: {
        name: branch,
        repositoryName: repositoryId,
        repositoryGroup: groupUserName,
      },
      include: {
        headCommit: true,
      },
    });

    // Check if file already exists in the branch
    if (branchRecord) {
      const existingFile = await prisma.fileChange.findFirst({
        where: {
          filePath,
          commitId: branchRecord.headCommitId,
          changeType: {
            not: 'DELETED',
          },
        },
      });

      if (existingFile) {
        return NextResponse.json(
          { error: 'File already exists at this path' },
          { status: 409 }
        );
      }
    }

    // Create the file change
    const fileContentHash = Buffer.from(content).toString('base64');
    
    // Create the transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create a commit ID
      const commitId = `commit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Array of parent commit IDs
      const parentCommitIds: string[] = [];
      
      // If branch exists, add its head commit as parent
      if (branchRecord) {
        parentCommitIds.push(branchRecord.headCommitId);
      }

      // Create the commit
      const commit = await tx.commit.create({
        data: {
          id: commitId,
          message: commitMessage,
          timestamp: new Date(),
          repositoryName: repositoryId,
          repositoryGroup: groupUserName,
          authorId: session.user.userId,
          parentCommitIDs: parentCommitIds,
          fileChanges: {
            create: {
              filePath,
              changeType: 'ADDED',
              fileContentHash,
              previousFileContentHash: null,
            },
          },
        },
        include: {
          fileChanges: true,
          author: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create or update branch
      let updatedBranch;
      if (branchRecord) {
        updatedBranch = await tx.branch.update({
          where: {
            id: branchRecord.id,
          },
          data: {
            headCommitId: commit.id,
          },
        });
      } else {
        updatedBranch = await tx.branch.create({
          data: {
            name: branch,
            repositoryName: repositoryId,
            repositoryGroup: groupUserName,
            headCommitId: commit.id,
          },
        });
      }

      return {
        commit,
        branch: updatedBranch,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'File created successfully',
        filePath,
        branch: result.branch.name,
        commit: {
          id: result.commit.id,
          message: result.commit.message,
          timestamp: result.commit.timestamp,
          author: result.commit.author,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
} 