import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  deadline: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { groupUserName, projectId } = params;

    // Verify the creator is a group member
    const isCreatorMember = await db.groupMember.findUnique({
      where: {
        groupUserName_userId: {
          groupUserName,
          userId: session.user.userId,
        },
      },
    });
    if (!isCreatorMember) {
      return NextResponse.json(
        { message: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
    });
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    const project = await db.project.findFirst({
      where: { id: projectId, groupUserName },
      select: { id: true, status: true },
    });
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }
    if (project.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Cannot create tasks for non-active projects' },
        { status: 400 }
      );
    }

    const rawData = await req.json();
    const validationResult = taskSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, status, priority, deadline, assigneeId } = validationResult.data;

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

    const task = await db.task.create({
      data: {
        title,
        description,
        status,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        projectId,
        assigneeId,
        creatorId: session.user.userId,
      },
      include: {
        assignee: {
          select: { userId: true, firstName: true, lastName: true },
        },
        creator: {
          select: { userId: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(
      { message: 'Task created successfully', task },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
