import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for repository updates
const updateRepositorySchema = z.object({
  name: z.string().trim().min(1, 'Repository name is required').optional(),
  description: z.string().trim().min(1, 'Repository description is required').optional(),
  isPrivate: z.boolean().optional(),
});

// GET: Retrieve a specific repository by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, repositoryId } = params;

    // Find the group to verify it exists and check permissions
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this group
    const isGroupMember = group.members.some((member: { userId: string }) => member.userId === session.user.id);
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to view this repository' },
        { status: 403 }
      );
    }

    // Find the repository
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId, // Ensure repository belongs to the specified group
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
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
  { params }: { params: { groupId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, repositoryId } = params;

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Find the repository
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check permissions: Only repository owner, group leader, or admin can update
    const isRepoOwner = repository.ownerId === session.user.id;
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isRepoOwner && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to update this repository' },
        { status: 403 }
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

    // If changing name, check if the new name is already taken in this group
    if (updateData.name && updateData.name !== repository.name) {
      const existingRepository = await db.repository.findFirst({
        where: {
          groupId,
          name: updateData.name,
          id: { not: repositoryId }, // Exclude current repository
        },
      });

      if (existingRepository) {
        return NextResponse.json(
          { message: 'A repository with this name already exists in the group' },
          { status: 409 }
        );
      }
    }

    // Update the repository
    const updatedRepository = await db.repository.update({
      where: {
        id: repositoryId,
      },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
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
  { params }: { params: { groupId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, repositoryId } = params;

    // Verify that the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Find the repository
    const repository = await db.repository.findUnique({
      where: {
        id: repositoryId,
        groupId,
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check permissions: Only repository owner, group leader, or admin can delete
    const isRepoOwner = repository.ownerId === session.user.id;
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isRepoOwner && !isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this repository' },
        { status: 403 }
      );
    }

    // Delete the repository
    await db.repository.delete({
      where: {
        id: repositoryId,
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