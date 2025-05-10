import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Schema for creating advisor requests
const createRequestSchema = z.object({
  requestedAdvisorId: z.string(),
  requestMessage: z.string().nullable().optional(),
});

// GET: Get project advisor request
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
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Get the advisor request for this project
    const advisorRequest = await db.advisorRequest.findFirst({
      where: {
        projectId,
        groupUserName,
      },
      include: {
        requestedAdvisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profileInfo: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ request: advisorRequest });
  } catch (error) {
    console.error('Error fetching advisor request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new advisor request
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
      include: {
        leader: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if the user is authorized (group leader or member)
    const isGroupLeader = group.leaderId === session.user.userId;
    
    if (!isGroupLeader) {
      const isMember = await db.groupMember.findUnique({
        where: {
          groupUserName_userId: {
            groupUserName,
            userId: session.user.userId,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { message: 'You are not authorized to request an advisor for this group' },
          { status: 403 }
        );
      }
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

    // Check if the project already has an advisor
    if (project.advisorId) {
      return NextResponse.json(
        { message: 'This project already has an advisor assigned' },
        { status: 400 }
      );
    }

    // Check if there's already a pending request for this project
    const existingRequest = await db.advisorRequest.findFirst({
      where: {
        projectId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: 'There is already a pending advisor request for this project' },
        { status: 400 }
      );
    }

    // Validate request data
    const requestData = await req.json();
    const validationResult = createRequestSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid request data', 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { requestedAdvisorId, requestMessage } = validationResult.data;

    // Check if the requested advisor exists and has the ADVISOR role
    const advisor = await db.user.findFirst({
      where: {
        userId: requestedAdvisorId,
        role: 'ADVISOR',
      },
    });

    if (!advisor) {
      return NextResponse.json(
        { message: 'Requested advisor not found or is not an advisor' },
        { status: 404 }
      );
    }

    // Create the advisor request
    const advisorRequest = await db.advisorRequest.create({
      data: {
        status: 'PENDING',
        requestMessage: requestMessage || null,
        projectId,
        groupUserName,
        requestedAdvisorId,
      },
      include: {
        requestedAdvisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create a notification for the advisor
    await db.notification.create({
      data: {
        message: `${group.name} has requested you as an advisor for their project "${project.title}"`,
        recipientId: requestedAdvisorId,
        read: false,
        link: `/dashboard/advisor/requests`,
      },
    });

    return NextResponse.json({
      message: 'Advisor request created successfully',
      request: advisorRequest,
    });
  } catch (error) {
    console.error('Error creating advisor request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 