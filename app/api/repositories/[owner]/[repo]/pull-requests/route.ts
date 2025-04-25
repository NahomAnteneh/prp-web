import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET pull requests for a repository
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'OPEN';
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const page = parseInt(url.searchParams.get('page') || '1');
    const search = url.searchParams.get('search') || '';
    
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
    
    // Build the where clause for pull requests
    const where = {
      repositoryId: repository.id,
      ...(status !== 'ALL' ? { status } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };
    
    // Find pull requests
    const pullRequests = await db.mergeRequest.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        sourceBranch: {
          select: {
            id: true,
            name: true
          }
        },
        targetBranch: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit
    });
    
    // Format pull requests for response
    const formattedPullRequests = pullRequests.map(pr => ({
      id: pr.id,
      title: pr.title,
      description: pr.description,
      status: pr.status,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      creator: pr.creator,
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      reviewCount: pr.reviews.length,
      reviewers: pr.reviews.map(review => review.user)
    }));
    
    return NextResponse.json(formattedPullRequests);
    
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    return NextResponse.json({ error: 'Failed to fetch pull requests' }, { status: 500 });
  }
}

// POST create a new pull request
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
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!body.sourceBranch || !body.targetBranch) {
      return NextResponse.json({ 
        error: 'Source and target branches are required' 
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
    
    // Find source and target branches
    const sourceBranch = repository.branches.find(
      (b: { name: string }) => b.name === body.sourceBranch
    );
    
    const targetBranch = repository.branches.find(
      (b: { name: string }) => b.name === body.targetBranch
    );
    
    if (!sourceBranch) {
      return NextResponse.json({ error: 'Source branch not found' }, { status: 404 });
    }
    
    if (!targetBranch) {
      return NextResponse.json({ error: 'Target branch not found' }, { status: 404 });
    }
    
    // Check if there's already an open pull request for these branches
    const existingPR = await db.mergeRequest.findFirst({
      where: {
        repositoryId: repository.id,
        sourceBranchId: sourceBranch.id,
        targetBranchId: targetBranch.id,
        status: 'OPEN'
      }
    });
    
    if (existingPR) {
      return NextResponse.json({ 
        error: 'An open pull request already exists for these branches' 
      }, { status: 409 });
    }
    
    // Create the pull request
    const pullRequest = await db.mergeRequest.create({
      data: {
        title: body.title,
        description: body.description || '',
        status: 'OPEN',
        repositoryId: repository.id,
        creatorId: userId,
        sourceBranchId: sourceBranch.id,
        targetBranchId: targetBranch.id,
        // Create explicit join records for source and target branches
        branchMergeRequestSources: {
          create: {
            branchId: sourceBranch.id
          }
        },
        branchMergeRequestTargets: {
          create: {
            branchId: targetBranch.id
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        sourceBranch: true,
        targetBranch: true
      }
    });
    
    // If reviewers are specified, add them
    if (body.reviewerIds && Array.isArray(body.reviewerIds)) {
      for (const reviewerId of body.reviewerIds) {
        await db.mergeRequestReview.create({
          data: {
            mergeRequestId: pullRequest.id,
            userId: reviewerId,
            status: 'PENDING'
          }
        });
      }
    }
    
    // Format response
    return NextResponse.json({
      id: pullRequest.id,
      title: pullRequest.title,
      description: pullRequest.description,
      status: pullRequest.status,
      createdAt: pullRequest.createdAt,
      updatedAt: pullRequest.updatedAt,
      creator: pullRequest.creator,
      sourceBranch: {
        id: pullRequest.sourceBranch.id,
        name: pullRequest.sourceBranch.name
      },
      targetBranch: {
        id: pullRequest.targetBranch.id,
        name: pullRequest.targetBranch.name
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating pull request:', error);
    return NextResponse.json({ error: 'Failed to create pull request' }, { status: 500 });
  }
} 