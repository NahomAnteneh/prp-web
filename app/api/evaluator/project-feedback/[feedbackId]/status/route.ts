import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, FeedbackStatus } from '@prisma/client';

interface RequestBody {
  status: FeedbackStatus;
}

// PATCH /api/evaluator/project-feedback/:feedbackId/status
export async function PATCH(
  request: Request,
  { params }: { params: { feedbackId: string } }
) {
  const session = await getServerSession(authOptions);

  // For now, only evaluators can change status. This can be broadened if other roles need to.
  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json({ error: 'Unauthorized. Must be an evaluator to update feedback status.' }, { status: 401 });
  }

  const { feedbackId } = params;
  const updaterId = session.user.userId; // For logging or audit if needed

  try {
    const body: RequestBody = await request.json();
    const { status } = body;

    if (!status || !Object.values(FeedbackStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid feedback status provided.' }, { status: 400 });
    }

    // Check if feedback exists and if the user has permission to update it
    // (e.g. is an evaluator for the project this feedback belongs to)
    const feedbackToUpdate = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: { project: { select: { projectEvaluators: { where: { evaluatorId: updaterId } } } } }
    });

    if (!feedbackToUpdate) {
      return NextResponse.json({ error: 'Feedback thread not found.' }, { status: 404 });
    }
    
    // Check if the project is assigned to this evaluator, if feedback is project-specific
    if (feedbackToUpdate.project && feedbackToUpdate.project.projectEvaluators.length === 0) {
        return NextResponse.json({ error: 'Forbidden. You are not an evaluator for the project associated with this feedback.' }, { status: 403 });
    }
    // Add similar checks if feedback is for MergeRequest or Repository, based on user permissions for those contexts.

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        status: status,
      },
      include: {
        project: { select: { title: true, group: { select: { name: true }} } },
        author: { select: { firstName: true, lastName: true, role: true } },
        // again, responses are not directly included here from schema
      }
    });

    return NextResponse.json(updatedFeedback, { status: 200 });
  } catch (error) {
    console.error(`Error updating status for feedback ${feedbackId} by user ${updaterId}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.'}, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error while updating feedback status.' }, { status: 500 });
  }
} 