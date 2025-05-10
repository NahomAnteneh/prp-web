import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema for creating/updating feedback
const feedbackSchema = z.object({
  title: z.string().min(1, 'Feedback title is required'),
  content: z.string().min(1, 'Feedback content is required'),
  status: z.enum(['OPEN', 'ADDRESSED', 'CLOSED']).optional(),
});

// GET: List project feedback
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

    // Get feedback for this project
    const feedback = await db.feedback.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching project feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Submit feedback for a project
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

    // Check if the user is the project's advisor or an administrator
    const isAdvisor = project.advisorId === session.user.userId;
    const isAdmin = session.user.role === 'ADMINISTRATOR';
    
    if (!isAdvisor && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the project advisor or administrators can provide feedback' },
        { status: 403 }
      );
    }

    // Validate feedback data
    const feedbackData = await req.json();
    const validationResult = feedbackSchema.safeParse(feedbackData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid feedback data', 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { title, content } = validationResult.data;

    // Create the feedback
    const feedback = await db.feedback.create({
      data: {
        title,
        content,
        status: 'OPEN',
        authorId: session.user.userId,
        projectId,
      },
    });

    // Create notifications for all group members
    const groupMembers = await db.groupMember.findMany({
      where: { groupUserName },
      select: { userId: true },
    });

    await Promise.all(
      groupMembers.map(member =>
        db.notification.create({
          data: {
            message: `New feedback on project "${project.title}" from advisor`,
            recipientId: member.userId,
            read: false,
            link: `/dashboard/project/${projectId}`,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting project feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 