import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for task updates
const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
  deadline: z.string().optional().nullable(), // ISO date string
  assigneeId: z.string().optional().nullable(),
});

// GET: Retrieve a specific task
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, taskId } = params;

    // Check if task exists and belongs to the project
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        project: {
          select: {
            groupId: true,
            advisorId: true,
            group: {
              select: {
                members: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view the task
    const isGroupMember = task.project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = task.project.advisorId === session.user.id;
    const isEvaluator = await db.projectEvaluator.findFirst({
      where: {
        projectId,
        evaluatorId: session.user.id,
      },
    });

    if (!isGroupMember && !isAdvisor && !isEvaluator) {
      return NextResponse.json(
        { message: 'You do not have permission to view this task' },
        { status: 403 }
      );
    }

    // Remove unnecessary nested data before returning
    const { project, ...taskData } = task;
    
    return NextResponse.json(taskData);
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
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, taskId } = params;

    // Check if task exists and belongs to the project
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        project: {
          select: {
            groupId: true,
            advisorId: true,
            group: {
              select: {
                leaderId: true,
                members: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Determine authorization level
    const isAssignee = task.assigneeId === session.user.id;
    const isCreator = task.creatorId === session.user.id;
    const isGroupLeader = task.project.group.leaderId === session.user.id;
    const isGroupMember = task.project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = task.project.advisorId === session.user.id;

    // Different levels of permissions based on user role
    // - Assignee: Can update status, description
    // - Creator/Leader/Advisor: Can update anything
    // - Other members: Cannot update tasks not assigned to them (except status)

    // Validate input data
    const rawData = await req.json();
    const validationResult = updateTaskSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Handle different permission levels
    if (!isCreator && !isGroupLeader && !isAdvisor) {
      // For regular members or assignees
      if (isAssignee) {
        // Assignees can update status and description
        if (updateData.title || updateData.deadline || updateData.assigneeId) {
          return NextResponse.json(
            { message: 'You can only update the status and description of tasks assigned to you' },
            { status: 403 }
          );
        }
      } else {
        // Non-assignees with low privilege can only view
        return NextResponse.json(
          { message: 'You do not have permission to update this task' },
          { status: 403 }
        );
      }
    }

    // If changing assignee, check if they exist and are a member of the group
    if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
      // null is allowed (unassign the task)
      if (updateData.assigneeId !== null) {
        const isValidAssignee = task.project.group.members.some(
          (member: { userId: string }) => member.userId === updateData.assigneeId
        );

        if (!isValidAssignee) {
          return NextResponse.json(
            { message: 'Assignee must be a member of the project group' },
            { status: 400 }
          );
        }
      }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        deadline: updateData.deadline ? new Date(updateData.deadline) : updateData.deadline === null ? null : undefined,
        assigneeId: updateData.assigneeId === null ? null : updateData.assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
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

// DELETE: Remove a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, taskId } = params;

    // Check if task exists and belongs to the project
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        project: {
          select: {
            groupId: true,
            group: {
              select: {
                leaderId: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Check permissions (only creator, group leader, or admin can delete)
    const isCreator = task.creatorId === session.user.id;
    const isGroupLeader = task.project.group.leaderId === session.user.id;

    if (!isCreator && !isGroupLeader) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this task' },
        { status: 403 }
      );
    }

    // Delete the task
    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 