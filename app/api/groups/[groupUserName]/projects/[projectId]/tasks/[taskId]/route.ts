import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema for updating tasks - match the enum values with the Prisma schema's TaskStatus
const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
  deadline: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

// GET: Retrieve a specific task
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; taskId: string } }
) {
  try {
    const { groupUserName, projectId, taskId } = await params;

    // Check if group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to this group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Get the task
    const task = await db.task.findUnique({
      where: {
        id: taskId,
        projectId, // Ensure the task belongs to the specified project
      },
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupUserName, projectId, taskId } = await params;

    // Check if group exists
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

    // Check if the user is a member of the group
    const isGroupMember = group.members.some(member => member.userId === session.user.userId);
    
    if (!isGroupMember && session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { message: 'You must be a member of this group to update tasks' },
        { status: 403 }
      );
    }

    // Check if project exists and belongs to this group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if task exists and belongs to this project
    const existingTask = await db.task.findUnique({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const rawData = await req.json();
    const validationResult = taskUpdateSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, status, deadline, assigneeId } = validationResult.data;

    // If assigneeId is provided, check if user exists and is a member of the group
    if (assigneeId !== undefined) {
      if (assigneeId !== null) {
        const isMember = await db.groupMember.findUnique({
          where: {
            groupUserName_userId: {
              groupUserName,
              userId: assigneeId,
            },
          },
        });

        if (!isMember) {
          return NextResponse.json(
            { message: 'Assignee is not a member of this group' },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(deadline !== undefined && { 
        deadline: deadline ? new Date(deadline) : null 
      }),
      ...(assigneeId !== undefined && { assigneeId }),
    };

    // Update task
    const updatedTask = await db.task.update({
      where: {
        id: taskId,
      },
      data: updateData,
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupUserName, projectId, taskId } = await params;

    // Check if group exists
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

    // Check if the user is a member of the group
    const isGroupMember = group.members.some(member => member.userId === session.user.userId);
    
    if (!isGroupMember && session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { message: 'You must be a member of this group to delete tasks' },
        { status: 403 }
      );
    }

    // Check if project exists and belongs to this group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if task exists and belongs to this project
    const task = await db.task.findUnique({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete the task
    await db.task.delete({
      where: {
        id: taskId,
      },
    });

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 