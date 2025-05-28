import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Schema for responding to advice requests
const adviceResponseSchema = z.object({
  content: z.string().min(5, 'Response must be at least 5 characters'),
});

// POST: Respond to an advice request
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; adviceId: string } }
) {
  try {
    const { groupUserName, projectId, adviceId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
      select: { 
        id: true, 
        advisorId: true,
        title: true,
        group: {
          select: {
            name: true,
          }
        }
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if the user is the project advisor
    if (project.advisorId !== session.user.userId) {
      return NextResponse.json(
        { message: 'Only the project advisor can respond to advice requests' },
        { status: 403 }
      );
    }

    // Check if the advice request exists and belongs to this project
    const adviceRequest = await db.adviceRequest.findFirst({
      where: {
        id: adviceId,
        projectId,
      },
      select: {
        id: true,
        topic: true,
        status: true,
        requesterId: true,
      },
    });

    if (!adviceRequest) {
      return NextResponse.json(
        { message: 'Advice request not found' },
        { status: 404 }
      );
    }

    // Validate response data
    const responseData = await req.json();
    const validationResult = adviceResponseSchema.safeParse(responseData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid response data', 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Create the response and update the advice request status
    const response = await db.adviceResponse.create({
      data: {
        content,
        adviceRequestId: adviceId,
        authorId: session.user.userId,
      },
    });

    await db.adviceRequest.update({
      where: { id: adviceId },
      data: { status: 'ANSWERED' },
    });

    // Create a notification for the student
    await db.notification.create({
      data: {
        message: `Your advisor responded to your request "${adviceRequest.topic}" in project ${project.title}`,
        recipientId: adviceRequest.requesterId,
        read: false,
        link: `/groups/${groupUserName}/projects/${projectId}`,
      },
    });

    return NextResponse.json({
      message: 'Response submitted successfully',
      response,
    });
  } catch (error) {
    console.error('Error submitting advice response:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 