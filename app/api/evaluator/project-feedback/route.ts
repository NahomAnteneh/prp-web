import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/evaluator/project-feedback
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json({ error: 'Unauthorized. Must be an evaluator to view project feedback.' }, { status: 401 });
  }

  const evaluatorId = session.user.userId;

  try {
    // Find projects assigned to this evaluator
    const assignedProjectIds = (await prisma.projectEvaluator.findMany({
      where: { evaluatorId },
      select: { projectId: true },
    })).map(pe => pe.projectId);

    if (assignedProjectIds.length === 0) {
      return NextResponse.json([], { status: 200 }); // No projects assigned, so no feedback to show
    }

    // Fetch feedback for those projects
    // Also include feedback authored by the evaluator on any project (might be useful)
    const feedbackItems = await prisma.feedback.findMany({
      where: {
        // Option 1: Feedback on projects assigned to this evaluator
        projectId: { in: assignedProjectIds },
        // OR
        // Option 2: Feedback authored by this evaluator (if they can also create feedback threads)
        // authorId: evaluatorId 
        // For now, sticking to feedback on projects they evaluate
      },
      include: {
        project: {
          select: {
            title: true,
            group: {
              select: { name: true, groupUserName: true },
            },
          },
        },
        author: { // Author of the main feedback thread
          select: { userId: true, firstName: true, lastName: true, role: true },
        },
        // responses: { // Prisma does not support direct fetching of responses as a nested field in Feedback
        //   // This needs to be handled by a separate query or modeled differently if responses are part of Feedback itself.
        //   // Assuming Feedback model does NOT have a direct `responses` array relation in Prisma schema.
        //   // The frontend `FeedbackItem` interface expects `responses`. This will need adjustment or a separate endpoint for responses.
        //   // For now, we will return an empty array for responses and the frontend will need to adapt or fetch them separately.
        // }
        // Based on schema, Feedback doesn't have a direct `responses` field.
        // It can be linked to a MergeRequest or Project, but not directly to a list of replies within the Feedback model itself.
        // The frontend currently expects `responses`. This points to a mismatch or a need for a different data fetching strategy for responses.
        // For this API, we will return the main feedback. Responses might need another endpoint like /api/feedback/{feedbackId}/responses
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data to match frontend FeedbackItem interface
    const transformedFeedback = feedbackItems.map(fb => ({
      id: fb.id,
      projectTitle: fb.project?.title || 'N/A',
      groupName: fb.project?.group?.name || 'N/A',
      content: fb.content,
      status: fb.status, // Assuming status is already 'OPEN' | 'ADDRESSED' | 'CLOSED'
      createdAt: fb.createdAt,
      // The `responses` field is tricky. The Prisma schema for `Feedback` doesn't show a direct relation to other `Feedback` items as responses.
      // It can be linked to MergeRequest or Project. 
      // If responses are themselves `Feedback` items linked in some way (e.g. via a parentFeedbackId not shown in schema), that logic is needed.
      // For now, returning empty array as per the note above.
      responses: [], 
      // To populate responses correctly, we might need to model replies differently
      // or fetch them in a separate step for each feedback item, which can be inefficient.
      // A common pattern for threaded comments is a parentId on the comment itself.
      // The current `FeedbackItem` on frontend expects `responses: { id, content, author, createdAt }[]`
      // This would imply that `Feedback` can have nested `Feedback` items as responses, which isn't directly in the current Prisma schema.
      // Let's assume the frontend `ProjectFeedback.tsx` (now `FeedbackTab.tsx`) was fetching responses in its original `fetchFeedbacks` method
      // which might have been a custom aggregation if the API provided it.
      // For now, the /api/evaluator/project-feedback/${feedbackId}/respond endpoint will create new Feedback entries or similar.
      // This GET endpoint will thus return the *main* feedback threads.
    }));

    return NextResponse.json(transformedFeedback, { status: 200 });
  } catch (error) {
    console.error(`Error fetching project feedback for evaluator ${evaluatorId}:`, error);
    return NextResponse.json({ error: 'Internal server error while fetching project feedback.' }, { status: 500 });
  }
}

// Create new feedback
export async function POST(request: Request) {
  try {
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
    
    // Parse the request body
    const body = await request.json();
    const { title, content, targetType, targetId } = body;
    
    if (!content || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // Create the feedback based on target type
    let feedbackData: any = {
      title,
      content,
      status: 'OPEN',
      authorId: userId,
    };
    
    switch (targetType) {
      case 'PROJECT':
        feedbackData.projectId = targetId;
        break;
      
      case 'MERGE_REQUEST':
        feedbackData.mergeRequestId = targetId;
        break;
      
      case 'REPOSITORY':
        // Repository ID is expected in format "name:groupUserName"
        const [repoName, groupUserName] = targetId.split(':');
        if (!repoName || !groupUserName) {
          return NextResponse.json(
            { error: 'Invalid repository ID format' },
            { status: 400 }
          );
        }
        feedbackData.repositoryName = repoName;
        feedbackData.repositoryGroup = groupUserName;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid target type' },
          { status: 400 }
        );
    }
    
    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: feedbackData,
    });
    
    // Create notification for the target's owner/members
    if (targetType === 'PROJECT') {
      const project = await prisma.project.findUnique({
        where: { id: targetId },
        select: {
          title: true,
          group: {
            select: {
              leaderId: true,
              members: {
                select: { userId: true }
              }
            }
          }
        },
      });
      
      if (project) {
        // Create notifications for group members
        for (const member of project.group.members) {
          await prisma.notification.create({
            data: {
              message: `New feedback on project: ${project.title}`,
              link: `/project/${targetId}/feedback/${feedback.id}`,
              read: false,
              recipientId: member.userId,
            },
          });
        }
      }
    }
    
    return NextResponse.json({
      message: 'Feedback created successfully',
      feedback,
    });
    
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
} 