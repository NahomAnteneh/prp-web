import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for group updates
const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').optional(),
  description: z.string().optional().nullable(),
  leaderId: z.string().optional(),
});

// GET: Retrieve a specific group by username
export async function GET(
  req: NextRequest,
  context: { params: { groupUserName: string } | Promise<{ groupUserName: string }> }
) {
  try {
    // Ensure params are resolved (handles both direct object and promise)
    const resolvedParams = await Promise.resolve(context.params);
    const { groupUserName } = resolvedParams;

    // Find the group with detailed information
    const group = await db.group.findUnique({
      where: { groupUserName },
      include: {
        leader: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
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
                userId: true,
                firstName: true,
                lastName: true,
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
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        repositories: {
          select: {
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
  { params }: { params: { groupUserName: string } | Promise<{ groupUserName: string }> }
) {
  try {
    // Ensure params are resolved
    const resolvedParams = await Promise.resolve(params);
    const { groupUserName } = resolvedParams;

    // Find the group
    const group = await db.group.findUnique({
      where: { groupUserName },
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

    // Update the group
    const updatedGroup = await db.group.update({
      where: { groupUserName },
      data: updateData,
      include: {
        leader: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
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
  { params }: { params: { groupUserName: string } | Promise<{ groupUserName: string }> }
) {
  try {
    // Ensure params are resolved
    const resolvedParams = await Promise.resolve(params);
    const { groupUserName } = resolvedParams;

    // Find the group
    const group = await db.group.findUnique({
      where: { groupUserName },
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

    // Delete the group and all related data (handled by Prisma cascade delete)
    await db.group.delete({
      where: { groupUserName },
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