import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Schema for creating advice requests
const createAdviceSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

// GET: Get advice requests for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists
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
      select: { id: true, advisorId: true },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Get advice requests for this project
    const adviceRequests = await db.adviceRequest.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        topic: true,
        description: true,
        status: true,
        createdAt: true,
        response: {
          select: {
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(adviceRequests);
  } catch (error) {
    console.error('Error fetching advice requests:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new advice request
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists
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
      include: {
        advisor: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if the project has an advisor
    if (!project.advisorId) {
      return NextResponse.json(
        { message: 'This project does not have an advisor assigned' },
        { status: 400 }
      );
    }

    // Validate request data
    const requestData = await req.json();
    const validationResult = createAdviceSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid request data', 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { topic, description } = validationResult.data;

    // Create the advice request
    const adviceRequest = await db.adviceRequest.create({
      data: {
        topic,
        description,
        status: "PENDING",
        projectId,
        requesterId: session.user.userId,
      },
      select: {
        id: true,
        topic: true,
        description: true,
        status: true,
        createdAt: true,
        project: {
          select: {
            title: true,
            advisorId: true,
          },
        },
      },
    });

    // Create a notification for the advisor
    await db.notification.create({
      data: {
        message: `New advice request for project "${project.title}": ${topic}`,
        recipientId: project.advisorId,
        read: false,
        link: `/dashboard/advisor/projects/${projectId}`,
      },
    });

    return NextResponse.json({
      message: 'Advice request created successfully',
      adviceRequest,
    });
  } catch (error) {
    console.error('Error creating advice request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 