import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for validation
const responseSchema = z.object({
  content: z.string().min(1, "Response content is required"),
});

// Note: In this version, we'll simulate feedback responses through comments since 
// there's no dedicated FeedbackResponse model in the schema. In a real application,
// you might want to extend the schema to include a proper response model.

export async function POST(
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
      select: { 
        userId: true,
        firstName: true,
        lastName: true,
        role: true
      },
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
      include: {
        project: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                name: true,
                groupUserName: true,
                leaderId: true,
                members: {
                  select: { userId: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found or you do not have permission to respond to it' },
        { status: 404 }
      );
    }
    
    // Parse and validate the request
    const body = await request.json();
    
    const validationResult = responseSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid response', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { content } = validationResult.data;
    
    // Since we don't have a FeedbackResponse model, we'll update the feedback
    // itself by appending the response to the content (this is a simplified approach)
    // In a real application, you'd create a proper response record
    const updatedContent = `${feedback.content}\n\n**Response by ${user.firstName} ${user.lastName} (${new Date().toISOString()}):**\n${content}`;
    
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { 
        content: updatedContent,
        // Optionally update status to ADDRESSED if it was OPEN
        status: feedback.status === 'OPEN' ? 'ADDRESSED' : feedback.status
      },
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
    
    // Create notifications for group members if project feedback
    if (feedback.project) {
      const project = feedback.project;
      
      // Create notifications for all group members
      for (const member of project.group.members) {
        if (member.userId !== userId) { // Don't notify self
          await prisma.notification.create({
            data: {
              message: `New response to feedback on project: ${project.title}`,
              link: `/project/${project.id}/feedback/${feedbackId}`,
              read: false,
              recipientId: member.userId,
            },
          });
        }
      }
    }
    
    // Format the response to match the frontend's expected data structure
    // In this simplified example, we generate a fake "responses" array
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
      // Create a simulated responses array based on markdown format responses in the content
      responses: [
        {
          id: `response-${Date.now()}`,
          content: content,
          author: {
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            initials: `${user.firstName[0]}${user.lastName[0]}`,
          },
          createdAt: new Date(),
        }
      ]
    };
    
    return NextResponse.json(formattedFeedback);
    
  } catch (error) {
    console.error('Error responding to feedback:', error);
    return NextResponse.json(
      { error: 'Failed to respond to feedback' },
      { status: 500 }
    );
  }
} 