import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET repository overview
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    
    // Find the repository and include related data
    const repository = await db.repository.findUnique({
      where: { 
        ownerId_name: { 
          ownerId: owner, 
          name: repo 
        } 
      },
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
            description: true,
          }
        },
        branches: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Get default branch (assuming it's called 'main' if not found)
    const defaultBranch = repository.branches.find((b: { id: string; name: string; createdAt: Date; updatedAt: Date }) => 
      b.name === 'main'
    ) || repository.branches[0];
    
    // Format response to match what the UI expects
    const response = {
      id: repository.id,
      name: repository.name,
      description: repository.description || '',
      isPrivate: repository.isPrivate,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
      owner: repository.owner,
      defaultBranchRef: defaultBranch ? {
        name: defaultBranch.name,
        id: defaultBranch.id
      } : null,
      // Add any other fields needed by your UI
      repositoryTopics: { nodes: [] }, // Replace with actual topics if you have them
      mentionableUsers: { 
        nodes: [repository.owner].filter(Boolean) 
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching repository:', error);
    return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 });
  }
} 