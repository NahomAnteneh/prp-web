import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for validation
const statusUpdateSchema = z.object({
  status: z.enum(['OPEN', 'ADDRESSED', 'CLOSED']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { feedbackId: string } }
) {
  try {
    const feedbackId = params.feedbackId;
    
    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.userId;
    
    // Verify the user is an evaluator
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'EVALUATOR') {
      return NextResponse.json({ error: 'Access denied. User is not an evaluator' }, { status: 403 });
    }
    
    // Verify the feedback exists and belongs to this evaluator
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        authorId: userId,
      },
    });
    
    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    // Parse and validate the request
    const body = await request.json();
    
    const validationResult = statusUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid status', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { status } = validationResult.data;
    
    // Update the feedback status
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                name: true,
                groupUserName: true,
              },
            },
          },
        },
        mergeRequest: {
          select: {
            id: true,
            title: true,
          },
        },
        repository: {
          select: {
            name: true,
            groupUserName: true,
          },
        },
      },
    });
    
    // Format the response
    const formattedFeedback = {
      id: updatedFeedback.id,
      title: updatedFeedback.title || 'Untitled Feedback',
      content: updatedFeedback.content,
      status: updatedFeedback.status,
      createdAt: updatedFeedback.createdAt,
      targetType: updatedFeedback.projectId 
        ? 'PROJECT' 
        : updatedFeedback.mergeRequestId 
          ? 'MERGE_REQUEST' 
          : 'REPOSITORY',
      targetId: updatedFeedback.projectId || updatedFeedback.mergeRequestId || `${updatedFeedback.repositoryName}:${updatedFeedback.repositoryGroup}`,
      targetName: updatedFeedback.project?.title || updatedFeedback.mergeRequest?.title || updatedFeedback.repository?.name,
      groupName: updatedFeedback.project?.group.name || (updatedFeedback.repository ? updatedFeedback.repository.groupUserName : null),
      responses: [], // No responses in this context
    };
    
    return NextResponse.json(formattedFeedback);
    
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback status' },
      { status: 500 }
    );
  }
} 