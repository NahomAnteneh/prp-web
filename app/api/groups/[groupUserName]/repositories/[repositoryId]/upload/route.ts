import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChangeType } from '@prisma/client';

// Define file change type
interface FileChange {
  filePath: string;
  changeType: ChangeType;
  fileContentHash: string | null;
  previousFileContentHash: string | null;
}

interface ProcessedFile {
  name: string;
  size: number;
}

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

    // Process multipart form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const commitMessage = formData.get('commitMessage') as string;
    const branchName = (formData.get('branch') as string) || 'main';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!commitMessage) {
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    // Find the branch
    const branchRecord = await prisma.branch.findFirst({
      where: {
        name: branchName,
        repositoryName: repositoryId,
        repositoryGroup: groupUserName,
      },
      include: {
        headCommit: true,
      },
    });

    // Process files
    const fileChanges: FileChange[] = [];
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      const filePath = file.name;
      const content = await file.arrayBuffer();
      const fileContentHash = Buffer.from(content).toString('base64');

      let changeType: ChangeType = 'ADDED';
      let previousFileContentHash = null;

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
          changeType = 'MODIFIED';
          previousFileContentHash = existingFile.fileContentHash;
        }
      }

      fileChanges.push({
        filePath,
        changeType,
        fileContentHash,
        previousFileContentHash,
      });

      processedFiles.push({
        name: filePath,
        size: file.size,
      });
    }

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
            create: fileChanges,
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
            name: branchName,
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
        message: `${files.length} file(s) uploaded successfully`,
        files: processedFiles,
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
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 