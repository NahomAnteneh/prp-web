import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for group updates
const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').optional(),
  description: z.string().optional().nullable(),
  leaderId: z.string().optional(),
});

// GET: Retrieve a specific group by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.groupId;

    // Find the group with detailed information
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            advisorId: true,
            advisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        advisorRequests: {
          select: {
            id: true,
            status: true,
            requestedAdvisorId: true,
            requestMessage: true,
            requestedAdvisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        repositories: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
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

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing group
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.groupId;

    // Find the group
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

    // Check permissions: Only group leader or admin can update the group
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to update this group' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = updateGroupSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If changing leader, check if the new leader is a member of the group
    if (updateData.leaderId && updateData.leaderId !== group.leaderId) {
      const isMember = group.members.some((member: { userId: string }) => member.userId === updateData.leaderId);
      
      if (!isMember) {
        return NextResponse.json(
          { message: 'New leader must be a member of the group' },
          { status: 400 }
        );
      }
      
      // Only admins can change group leadership 
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Only administrators can change group leadership' },
          { status: 403 }
        );
      }
    }

    // If changing name, check if the new name is already taken
    if (updateData.name && updateData.name !== group.name) {
      const existingGroup = await db.group.findUnique({
        where: { name: updateData.name },
      });

      if (existingGroup) {
        return NextResponse.json(
          { message: 'A group with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the group
    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: updateData,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Group updated successfully',
      group: updatedGroup,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.groupId;

    // Find the group
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        projects: true,
        repositories: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check permissions: Only group leader or admin can delete the group
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this group' },
        { status: 403 }
      );
    }

    // Check if the group has projects or repositories
    if (group.projects.length > 0 || group.repositories.length > 0) {
      // Allow force delete with query parameter, but only for admins
      const url = new URL(req.url);
      const forceDelete = url.searchParams.get('force') === 'true';
      
      if (!forceDelete) {
        return NextResponse.json(
          { 
            message: 'This group has projects or repositories that will be deleted. Use ?force=true to confirm deletion.',
            projectCount: group.projects.length,
            repositoryCount: group.repositories.length
          },
          { status: 409 } // Conflict
        );
      } else if (!isAdmin) {
        return NextResponse.json(
          { message: 'Only administrators can force delete groups with projects or repositories' },
          { status: 403 }
        );
      }
    }

    // Delete the group and all related data (handled by Prisma cascade delete)
    await db.group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 