import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for task creation
const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
  deadline: z.string().optional(), // ISO date string
  assigneeId: z.string().optional(),
});

// GET: List all tasks for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
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
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view tasks
    const isGroupMember = project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = project.advisorId === session.user.id;
    const isEvaluator = await db.projectEvaluator.findFirst({
      where: {
        projectId,
        evaluatorId: session.user.id,
      },
    });
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isAdvisor && !isEvaluator && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to view tasks for this project' },
        { status: 403 }
      );
    }

    // Get filter parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const assigneeId = url.searchParams.get('assigneeId');

    // Build filter conditions
    const whereConditions: any = {
      projectId,
    };

    if (status) {
      whereConditions.status = status;
    }

    if (assigneeId) {
      whereConditions.assigneeId = assigneeId;
    }

    // Fetch tasks
    const tasks = await db.task.findMany({
      where: whereConditions,
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
      orderBy: [
        { status: 'asc' }, // TODO first, then IN_PROGRESS, etc.
        { deadline: 'asc' }, // Earliest deadline first
        { createdAt: 'desc' }, // Most recently created first (for tasks with same status and deadline)
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new task for a project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
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
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to create tasks
    const isGroupMember = project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = project.advisorId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isAdvisor && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to create tasks for this project' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createTaskSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, status, deadline, assigneeId } = validationResult.data;

    // If assignee is specified, check if they exist and are a member of the group
    if (assigneeId) {
      const isValidAssignee = project.group.members.some(
        (member: { userId: string }) => member.userId === assigneeId
      );

      if (!isValidAssignee) {
        return NextResponse.json(
          { message: 'Assignee must be a member of the project group' },
          { status: 400 }
        );
      }
    }

    // Create the task
    const task = await db.task.create({
      data: {
        title,
        description,
        status,
        deadline: deadline ? new Date(deadline) : undefined,
        projectId,
        assigneeId,
        creatorId: session.user.id,
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
      message: 'Task created successfully',
      task,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 