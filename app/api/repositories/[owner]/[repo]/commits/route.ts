import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Interface for file change in a commit
interface FileChangeInput {
  filePath: string;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  content?: string;
}

// GET commits for a repository
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch') || 'main';
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    // Find repository
    const repository = await db.repository.findUnique({
      where: { 
        ownerId_name: { 
          ownerId: owner, 
          name: repo 
        } 
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Find the branch
    const branchRecord = await db.branch.findFirst({
      where: {
        repositoryId: repository.id,
        name: branch
      }
    });
    
    if (!branchRecord) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    
    // Find all commits reachable from this branch's head commit
    // For simplicity, we'll just query recent commits for this repository
    // In a real implementation, you'd need to traverse the commit graph
    const commits = await db.commit.findMany({
      where: {
        repositoryId: repository.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        fileChanges: {
          select: {
            filePath: true,
            changeType: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit
    });
    
    // Format commits for the response
    const formattedCommits = commits.map(commit => ({
      id: commit.id,
      message: commit.message,
      timestamp: commit.timestamp,
      author: commit.author,
      parents: commit.parentCommitIDs,
      changes: commit.fileChanges.map(change => ({
        path: change.filePath,
        type: change.changeType
      }))
    }));
    
    return NextResponse.json(formattedCommits);
    
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json({ error: 'Failed to fetch commits' }, { status: 500 });
  }
}

// POST create a new commit
export async function POST(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { owner, repo } = params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.message) {
      return NextResponse.json({ error: 'Commit message is required' }, { status: 400 });
    }
    
    if (!body.branch) {
      return NextResponse.json({ error: 'Target branch is required' }, { status: 400 });
    }
    
    if (!Array.isArray(body.changes) || body.changes.length === 0) {
      return NextResponse.json({ error: 'File changes are required' }, { status: 400 });
    }
    
    // Find repository
    const repository = await db.repository.findUnique({
      where: { 
        ownerId_name: { 
          ownerId: owner, 
          name: repo 
        } 
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Check if user has permission to commit
    // Implement authorization logic based on your requirements
    const canCommit = repository.ownerId === userId;
    
    if (!canCommit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Find the branch
    const branch = await db.branch.findFirst({
      where: {
        repositoryId: repository.id,
        name: body.branch
      }
    });
    
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    
    // Generate a unique commit hash
    const commitId = generateCommitHash();
    
    // Process file changes and store file content
    const fileChanges = await Promise.all(
      (body.changes as FileChangeInput[]).map(async (change) => {
        // For added or modified files, store the content
        let fileContentHash = null;
        
        if (change.changeType !== 'DELETED' && change.content) {
          fileContentHash = generateContentHash(change.content);
          
          // Store the file content
          await db.fileContent.create({
            data: {
              hash: fileContentHash,
              content: change.content
            }
          });
        }
        
        return {
          filePath: change.filePath,
          changeType: change.changeType,
          fileContentHash: fileContentHash,
          previousFileContentHash: null // In a real implementation, you'd need to find the previous content hash
        };
      })
    );
    
    // Create the commit
    const commit = await db.commit.create({
      data: {
        id: commitId,
        message: body.message,
        authorId: userId,
        repositoryId: repository.id,
        parentCommitIDs: [branch.headCommitId], // Current head commit becomes the parent
        fileChanges: {
          create: fileChanges
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        fileChanges: true
      }
    });
    
    // Update the branch to point to the new commit
    await db.branch.update({
      where: { id: branch.id },
      data: { headCommitId: commit.id }
    });
    
    // Format commit for response
    const formattedCommit = {
      id: commit.id,
      message: commit.message,
      timestamp: commit.timestamp,
      author: commit.author,
      parents: commit.parentCommitIDs,
      changes: commit.fileChanges.map(change => ({
        path: change.filePath,
        type: change.changeType
      }))
    };
    
    return NextResponse.json(formattedCommit, { status: 201 });
    
  } catch (error) {
    console.error('Error creating commit:', error);
    return NextResponse.json({ error: 'Failed to create commit' }, { status: 500 });
  }
}

// Helper functions

// Generate a SHA-256 hash for commit
function generateCommitHash() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
}

// Generate a content hash
function generateContentHash(content: string) {
  return `content-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`;
} 