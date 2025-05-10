import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Schema for repository feedback
const feedbackSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  projectId: z.string().optional(), // Optional project ID to link the feedback to a project
});

// POST: Submit feedback for a repository
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryName: string } }
) {
  try {
    const { groupUserName, repositoryName } = params;
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

    // Check if repository exists and belongs to the specified group
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryName,
          groupUserName,
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found or does not belong to this group' },
        { status: 404 }
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

    const { title, content, projectId } = validationResult.data;

    // If projectId is provided, check if the project exists and the user is its advisor
    if (projectId) {
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

      // Check if the user is the project's advisor or an administrator
      const isAdvisor = project.advisorId === session.user.userId;
      const isAdmin = session.user.role === 'ADMINISTRATOR';
      
      if (!isAdvisor && !isAdmin) {
        return NextResponse.json(
          { message: 'Only the project advisor or administrators can provide feedback' },
          { status: 403 }
        );
      }
    } else {
      // If no project is specified, check if the user is an advisor for any project in this group
      const isAdvisorForGroup = await db.project.findFirst({
        where: {
          groupUserName,
          advisorId: session.user.userId,
        },
      });

      const isAdmin = session.user.role === 'ADMINISTRATOR';
      
      if (!isAdvisorForGroup && !isAdmin) {
        return NextResponse.json(
          { message: 'You are not authorized to provide feedback for this repository' },
          { status: 403 }
        );
      }
    }

    // Create the feedback
    const feedback = await db.feedback.create({
      data: {
        title,
        content,
        status: 'OPEN',
        authorId: session.user.userId,
        projectId: projectId || null,
        repositoryName,
        repositoryGroup: groupUserName,
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
            message: `New feedback on repository "${repositoryName}" from advisor`,
            recipientId: member.userId,
            read: false,
            link: `/dashboard/repository/${groupUserName}/${repositoryName}`,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting repository feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 