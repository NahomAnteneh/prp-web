import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/evaluator/completed-evaluations/:evaluationId/details
export async function GET(
  request: Request,
  { params }: { params: { evaluationId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json(
      { error: 'Unauthorized. Must be an evaluator to view evaluation details.' },
      { status: 401 }
    );
  }

  const { evaluationId } = params;
  const evaluatorId = session.user.userId;

  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        id: evaluationId,
        // Ensure the evaluator is the author of this evaluation
        authorId: evaluatorId, 
      },
      include: {
        project: {
          select: {
            title: true,
            submissionDate: true,
            group: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found or access denied.' }, { status: 404 });
    }

    // Transform to match frontend EvaluationDetails interface (partially)
    // The frontend mock `fetchEvaluationDetailsAPI` has a more detailed structure for criteria.
    // The `criteriaData` in Prisma is a JSON blob. We need to ensure it matches what frontend expects or transform it.
    
    let criteria = [];
    if (evaluation.criteriaData && typeof evaluation.criteriaData === 'object' && Array.isArray((evaluation.criteriaData as any).criteria)) {
        criteria = (evaluation.criteriaData as any).criteria;
    } else if (Array.isArray(evaluation.criteriaData)) {
        // If criteriaData itself is an array (less likely based on typical usage but possible)
        criteria = evaluation.criteriaData;
    }
    // If criteriaData is not in the expected structure, it defaults to empty array.

    const details = {
      id: evaluation.id,
      projectTitle: evaluation.project.title,
      groupName: evaluation.project.group.name,
      submissionDate: evaluation.project.submissionDate, 
      evaluationDate: evaluation.createdAt, // Assuming createdAt is the evaluation date
      score: evaluation.score,
      // category: getEvaluationCategory(evaluation.score || 0), // Category is derived on frontend
      overallComments: evaluation.comments,
      criteria: criteria, // This relies on criteriaData being structured as { criteria: [...] } or an array itself.
      // evaluatorNotes: evaluation.profileInfo?.evaluatorNotes, // Example if notes were stored elsewhere
    };

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    console.error(`Error fetching details for evaluation ${evaluationId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error while fetching evaluation details.' },
      { status: 500 }
    );
  }
} 