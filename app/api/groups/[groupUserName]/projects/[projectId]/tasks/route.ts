import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema for creating/updating tasks
const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
  deadline: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

// GET: List project tasks
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to the specified group
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

    // Get tasks for this project
    const tasks = await db.task.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
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

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new task
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupUserName, projectId } = await params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to the specified group
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

    // Validate input data
    const rawData = await req.json();
    const validationResult = taskSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, status, deadline, assigneeId } = validationResult.data;

    // If assigneeId is provided, check if user exists and is a member of the group
    if (assigneeId) {
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

    // Create task
    const task = await db.task.create({
      data: {
        title,
        description,
        status,
        deadline: deadline ? new Date(deadline) : null,
        projectId,
        assigneeId,
        creatorId: session.user.userId,
      },
      include: {
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
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
      message: 'Task created successfully',
      task,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project task:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
