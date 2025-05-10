import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for repository updates
const updateRepositorySchema = z.object({
  description: z.string().trim().min(1, 'Repository description is required').optional(),
  isPrivate: z.boolean().optional(),
});

// GET: Retrieve a specific repository by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const { groupUserName, repositoryId } = params;

    // Find the repository - repositoryId is actually the repository name in the URL
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryId, // repositoryId param is actually the repository name
          groupUserName,
        }
      },
      include: {
        owner: {
          select: {
            name: true,
            leaderId: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        branches: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            headCommitId: true,
          },
        },
        projects: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(repository);
  } catch (error) {
    console.error('Error fetching repository:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing repository
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const { groupUserName, repositoryId } = params;

    // Find the repository - repositoryId is actually the repository name in the URL
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryId, // repositoryId param is actually the repository name
          groupUserName,
        }
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = updateRepositorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update the repository
    const updatedRepository = await db.repository.update({
      where: {
        name_groupUserName: {
          name: repositoryId,
          groupUserName,
        }
      },
      data: updateData,
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRepository);
  } catch (error) {
    console.error('Error updating repository:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a repository
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    const { groupUserName, repositoryId } = params;

    // Find the repository - repositoryId is actually the repository name in the URL
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryId, // repositoryId param is actually the repository name
          groupUserName,
        }
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Delete the repository
    await db.repository.delete({
      where: {
        name_groupUserName: {
          name: repositoryId,
          groupUserName,
        }
      },
    });

    return NextResponse.json(
      { message: 'Repository deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting repository:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}