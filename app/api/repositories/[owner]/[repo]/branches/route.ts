import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface BranchData {
  id: string;
  name: string;
  headCommitId: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET all branches for a repository
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    
    // Find repository
    const repository = await db.repository.findUnique({
      where: { 
        ownerId_name: { 
          ownerId: owner, 
          name: repo 
        } 
      },
      include: {
        branches: {
          include: {
            // Include additional branch-related data that might be needed
          }
        }
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Return branches with formatted data
    return NextResponse.json(repository.branches.map((branch: BranchData) => ({
      id: branch.id,
      name: branch.name,
      headCommitId: branch.headCommitId,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt
    })));
    
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

// POST create a new branch
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
    if (!body.name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }
    
    if (!body.sourceBranch && !body.sourceCommitId) {
      return NextResponse.json({ 
        error: 'Source branch or commit ID is required' 
      }, { status: 400 });
    }
    
    // Find repository
    const repository = await db.repository.findUnique({
      where: { 
        ownerId_name: { 
          ownerId: owner, 
          name: repo 
        } 
      },
      include: {
        branches: true
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Check if user has permission to create branch
    // We need to implement authorization rules here based on your application's requirements
    const canCreateBranch = repository.ownerId === userId;
    
    if (!canCreateBranch) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Check if branch with same name already exists
    if (repository.branches.some(b => b.name === body.name)) {
      return NextResponse.json({ 
        error: 'A branch with this name already exists' 
      }, { status: 409 });
    }
    
    // Determine the head commit ID
    let headCommitId: string;
    
    if (body.sourceCommitId) {
      // Use the provided commit ID
      const commit = await db.commit.findUnique({
        where: { 
          id: body.sourceCommitId,
          repositoryId: repository.id
        }
      });
      
      if (!commit) {
        return NextResponse.json({ error: 'Source commit not found' }, { status: 404 });
      }
      
      headCommitId = commit.id;
    } else {
      // Use the head commit of the source branch
      const sourceBranch = repository.branches.find(b => b.name === body.sourceBranch);
      
      if (!sourceBranch) {
        return NextResponse.json({ error: 'Source branch not found' }, { status: 404 });
      }
      
      headCommitId = sourceBranch.headCommitId;
    }
    
    // Create new branch
    const newBranch = await db.branch.create({
      data: {
        name: body.name,
        repositoryId: repository.id,
        headCommitId
      }
    });
    
    return NextResponse.json({
      id: newBranch.id,
      name: newBranch.name,
      headCommitId: newBranch.headCommitId,
      createdAt: newBranch.createdAt,
      updatedAt: newBranch.updatedAt
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
} 