import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for project creation
const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required'),
  description: z.string().optional(),
  advisorId: z.string().optional(), // Optional: can be set later
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().optional(), // ISO date string
  })).optional(),
});

// GET: List all projects for a group
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

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    // Build filter conditions
    const whereConditions: any = {
      groupId,
    };

    if (status) {
      whereConditions.status = status;
    }

    if (!includeArchived) {
      whereConditions.archived = false;
    }

    // Fetch projects with related data
    const projects = await db.project.findMany({
      where: whereConditions,
      include: {
        advisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            score: true,
            createdAt: true,
          },
        },
        feedback: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            authorId: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            repositories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching group projects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new project for a group
export async function POST(
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

    // Check if the group exists and user is a member or admin
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

    // Check if user is part of the group or an admin
    const isGroupMember = group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isAdmin) {
      return NextResponse.json(
        { message: 'You must be a member of this group to create a project' },
        { status: 403 }
      );
    }

    // Only group leader or admin can create projects
    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the group leader or administrators can create projects' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createProjectSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, advisorId, milestones } = validationResult.data;

    // If advisor is specified, check if they exist and have the correct role
    if (advisorId) {
      const advisor = await db.user.findUnique({
        where: { id: advisorId },
        select: { id: true, role: true },
      });

      if (!advisor) {
        return NextResponse.json(
          { message: 'Advisor not found' },
          { status: 404 }
        );
      }

      if (advisor.role !== 'ADVISOR') {
        return NextResponse.json(
          { message: 'The specified user is not an advisor' },
          { status: 400 }
        );
      }
    }

    // Process milestones data for JSON storage
    const milestonesData = milestones
      ? milestones.map(m => ({
          ...m,
          dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
          completed: false,
          createdAt: new Date(),
        }))
      : undefined;

    // Create the project
    const project = await db.project.create({
      data: {
        title,
        description,
        groupId,
        advisorId: advisorId || undefined,
        milestones: milestonesData ? { milestones: milestonesData } : undefined,
      },
      include: {
        advisor: {
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
      message: 'Project created successfully',
      project,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 