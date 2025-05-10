import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma client inside handler
const prisma = new PrismaClient();

// Schema for project creation
const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(255, 'Project title is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
});

// GET: List all projects for a group
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string } | Promise<{ groupUserName: string }> }
) {
  try {
    // Handle params
    const resolvedParams = await Promise.resolve(params);
    const groupUserName = resolvedParams.groupUserName;

    // Validate groupUserName
    const groupUserNameSchema = z.string().min(1, 'Group username is required');
    const parsedGroupUserName = groupUserNameSchema.safeParse(groupUserName);
    if (!parsedGroupUserName.success) {
      return NextResponse.json(
        { message: 'Invalid group username format' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists and user is a member or admin
    const group = await prisma.group.findUnique({
      where: { groupUserName },
      select: {
        groupUserName: true,
        name: true,
        members: { select: { userId: true } },
        leaderId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    const isGroupMember = group.members.some((m) => m.userId === session.user.userId);
    if (!isGroupMember) {
      return NextResponse.json(
        { message: 'You must be a member of this group to view projects' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    // Build filter conditions
    const whereConditions: any = { groupUserName: group.groupUserName };
    if (status) {
      whereConditions.status = status;
    }
    if (!includeArchived) {
      whereConditions.archived = false;
    }

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        submissionDate: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        group: {
          select: {
            groupUserName: true,
            name: true,
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
      orderBy: { createdAt: 'desc' },
    });

    // Format response with groupUserName
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      status: project.status,
      submissionDate: project.submissionDate,
      archived: project.archived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      group: {
        groupUserName: project.group.groupUserName,
        name: project.group.name,
      },
      stats: {
        tasks: project._count.tasks,
        repositories: project._count.repositories,
        evaluations: project.evaluations.length,
        feedback: project.feedback.length,
      },
      evaluations: project.evaluations,
      feedback: project.feedback,
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching group projects:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new project for a group
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string } | Promise<{ groupUserName: string }> }
) {
  try {
    // Handle params
    const resolvedParams = await Promise.resolve(params);
    const groupUserName = resolvedParams.groupUserName;

    // Validate groupUserName
    const groupUserNameSchema = z.string().min(1, 'Group username is required');
    const parsedGroupUserName = groupUserNameSchema.safeParse(groupUserName);
    if (!parsedGroupUserName.success) {
      return NextResponse.json(
        { message: 'Invalid group username format' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists and user is a member or admin
    const group = await prisma.group.findUnique({
      where: { groupUserName },
      select: {
        groupUserName: true,
        name: true,
        leaderId: true,
        members: { select: { userId: true } },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    const isGroupMember = group.members.some((m) => m.userId === session.user.userId);
    const isGroupLeader = group.leaderId === session.user.userId;

    if (!isGroupMember) {
      return NextResponse.json(
        { message: 'You must be a member of this group to create a project' },
        { status: 403 }
      );
    }

    if (!isGroupLeader) {
      return NextResponse.json(
        { message: 'Only the group leader can create projects' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createProjectSchema.safeParse(rawData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid input',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, description } = validationResult.data;

    // Create project
    try {
      const project = await prisma.project.create({
        data: {
          title,
          description: description || null,
          groupUserName: group.groupUserName
        },
        include: {
          group: true
        }
      });

      // Format response
      const formattedProject = {
        id: project.id,
        title: project.title,
        description: project.description || '',
        status: project.status,
        submissionDate: project.submissionDate,
        archived: project.archived,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        group: {
          groupUserName: project.group.groupUserName,
          name: project.group.name,
        }
      };

      return NextResponse.json({
        message: 'Project created successfully',
        project: formattedProject
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating project:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { message: 'A project with this title already exists for this group' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { message: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}