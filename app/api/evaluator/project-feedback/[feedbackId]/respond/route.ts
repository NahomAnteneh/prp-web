import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, FeedbackStatus } from '@prisma/client';

interface RequestBody {
  content: string;
}

// POST /api/evaluator/project-feedback/:feedbackId/respond
export async function POST(
  request: Request,
  { params }: { params: { feedbackId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId ) { // Any authenticated user can respond for now, role check can be added
    return NextResponse.json({ error: 'Unauthorized. You must be logged in to respond.' }, { status: 401 });
  }

  const { feedbackId } = params;
  const responderId = session.user.userId;

  try {
    const body: RequestBody = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Response content cannot be empty.' }, { status: 400 });
    }

    const parentFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { projectId: true, repositoryName: true, repositoryGroup: true, mergeRequestId: true }
    });

    if (!parentFeedback) {
      return NextResponse.json({ error: 'Parent feedback thread not found.' }, { status: 404 });
    }

    const newResponse = await prisma.feedback.create({
      data: {
        content,
        authorId: responderId,
        status: FeedbackStatus.OPEN, 
        projectId: parentFeedback.projectId,
        repositoryName: parentFeedback.repositoryName,
        repositoryGroup: parentFeedback.repositoryGroup,
        mergeRequestId: parentFeedback.mergeRequestId,
        // parentFeedbackId: feedbackId, // Uncomment if schema is updated for actual threading
      },
      include: {
        author: { select: { userId: true, firstName: true, lastName: true, role: true } }
      }
    });
    
    return NextResponse.json(newResponse, { status: 201 });
  } catch (error) {
    console.error(`Error creating response for feedback ${feedbackId} by user ${responderId}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.'}, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error while posting response.' }, { status: 500 });
  }
} 