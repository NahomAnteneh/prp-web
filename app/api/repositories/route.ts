import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all repositories (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner');
    const isPublic = url.searchParams.get('public') === 'true';
    
    // Build query based on filters
    const query: any = {};
    
    if (owner) {
      query.ownerId = owner;
    }
    
    if (isPublic !== undefined) {
      query.isPrivate = !isPublic;
    }
    
    // Get repositories
    const repositories = await db.repository.findMany({
      where: query,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        branches: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Map to remove sensitive data and format response
    const formattedRepositories = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description || '',
      isPrivate: repo.isPrivate,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      owner: repo.owner,
      defaultBranchRef: repo.branches.find(b => b.name === 'main') || repo.branches[0] || null,
      project: repo.project ? {
        id: repo.project.id,
        title: repo.project.title
      } : null
    }));
    
    return NextResponse.json(formattedRepositories);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}

// POST create a new repository
export async function POST(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }
    
    // Check if repository with same name already exists for this user
    const existingRepo = await db.repository.findUnique({
      where: {
        ownerId_name: {
          ownerId: userId,
          name: body.name
        }
      }
    });
    
    if (existingRepo) {
      return NextResponse.json({ 
        error: 'A repository with this name already exists' 
      }, { status: 409 });
    }
    
    // Create repository
    const newRepository = await db.repository.create({
      data: {
        name: body.name,
        description: body.description || '',
        isPrivate: body.isPrivate !== undefined ? body.isPrivate : true,
        ownerId: userId,
        // If projectId is provided, associate with a project
        ...(body.projectId ? { projectId: body.projectId } : {})
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });
    
    // Create default 'main' branch
    const mainBranch = await db.branch.create({
      data: {
        name: 'main',
        repositoryId: newRepository.id,
        // Create an initial commit for the branch
        headCommitId: await createInitialCommit(newRepository.id, userId)
      }
    });
    
    return NextResponse.json({
      id: newRepository.id,
      name: newRepository.name,
      description: newRepository.description,
      isPrivate: newRepository.isPrivate,
      createdAt: newRepository.createdAt,
      updatedAt: newRepository.updatedAt,
      owner: newRepository.owner,
      defaultBranchRef: {
        id: mainBranch.id,
        name: mainBranch.name
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating repository:', error);
    return NextResponse.json({ error: 'Failed to create repository' }, { status: 500 });
  }
}

// Helper function to create initial commit
async function createInitialCommit(repositoryId: string, authorId: string) {
  // Generate a unique commit hash
  const commitId = generateCommitHash();
  
  // Create the initial commit
  const commit = await db.commit.create({
    data: {
      id: commitId,
      message: 'Initial commit',
      authorId,
      repositoryId,
      parentCommitIDs: [],
      fileChanges: {
        create: {
          filePath: 'README.md',
          changeType: 'ADDED',
          fileContentHash: await createInitialReadme(repositoryId)
        }
      }
    }
  });
  
  return commit.id;
}

// Create initial README content
async function createInitialReadme(repositoryId: string) {
  const repository = await db.repository.findUnique({
    where: { id: repositoryId },
    select: { name: true }
  });
  
  const content = `# ${repository?.name || 'New Repository'}
  
Welcome to this repository!

## Getting Started

Add your project documentation here.
`;

  // Generate a hash for the content
  const contentHash = generateContentHash(content);
  
  // Store the content in database or file system
  await db.fileContent.create({
    data: {
      hash: contentHash,
      content
    }
  });
  
  return contentHash;
}

// Generate a SHA-256 hash for commit
function generateCommitHash() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;
}

// Generate a content hash
function generateContentHash(content: string) {
  return `content-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 8)}`;
} 