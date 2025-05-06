import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for feedback updates
const updateFeedbackSchema = z.object({
  title: z.string().optional(),
  content: z.string().trim().min(1, 'Feedback content is required').optional(),
  status: z.enum(['OPEN', 'ADDRESSED', 'CLOSED']).optional(),
});

// GET: Retrieve a specific feedback entry
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; feedbackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, feedbackId } = params;

    // Check if feedback exists and belongs to the project
    const feedback = await db.feedback.findFirst({
      where: {
        id: feedbackId,
        projectId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
        project: {
          select: {
            groupId: true,
            advisorId: true,
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
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view the feedback
    const isGroupMember = feedback.project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = feedback.project.advisorId === session.user.id;
    const isEvaluator = await db.projectEvaluator.findFirst({
      where: {
        projectId,
        evaluatorId: session.user.id,
      },
    });

    if (!isGroupMember && !isAdvisor && !isEvaluator) {
      return NextResponse.json(
        { message: 'You do not have permission to view this feedback' },
        { status: 403 }
      );
    }

    // Remove unnecessary nested data before returning
    const { project, ...feedbackData } = feedback;
    
    return NextResponse.json(feedbackData);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a feedback entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; feedbackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, feedbackId } = params;

    // Check if feedback exists and belongs to the project
    const feedback = await db.feedback.findFirst({
      where: {
        id: feedbackId,
        projectId,
      },
      include: {
        project: {
          select: {
            groupId: true,
            advisorId: true,
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
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Determine authorization level
    const isAuthor = feedback.authorId === session.user.id;
    const isGroupLeader = feedback.project.group.leaderId === session.user.id;
    const isAdvisor = feedback.project.advisorId === session.user.id;

    // Check if user has permission to update the feedback
    // Author can update content and title, but not status
    // Group leader, advisor, and admin can update anything
    const canUpdateStatus = isGroupLeader || isAdvisor;
    const canUpdateContent = isAuthor || isGroupLeader || isAdvisor;

    if (!canUpdateContent) {
      return NextResponse.json(
        { message: 'You do not have permission to update this feedback' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = updateFeedbackSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if trying to update status without permission
    if (updateData.status && !canUpdateStatus) {
      return NextResponse.json(
        { message: 'You do not have permission to update the status of this feedback' },
        { status: 403 }
      );
    }

    // Update the feedback
    const updatedFeedback = await db.feedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Feedback updated successfully',
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a feedback entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; feedbackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, feedbackId } = params;

    // Check if feedback exists and belongs to the project
    const feedback = await db.feedback.findFirst({
      where: {
        id: feedbackId,
        projectId,
      },
      include: {
        project: {
          select: {
            groupId: true,
            group: {
              select: {
                leaderId: true,
              },
            },
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Check permissions (only author, group leader, or admin can delete)
    const isAuthor = feedback.authorId === session.user.id;
    const isGroupLeader = feedback.project.group.leaderId === session.user.id;

    if (!isAuthor && !isGroupLeader) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this feedback' },
        { status: 403 }
      );
    }

    // Delete the feedback
    await db.feedback.delete({
      where: { id: feedbackId },
    });

    return NextResponse.json({
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 