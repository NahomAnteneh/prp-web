import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/evaluator/completed-evaluations
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json(
      { error: 'Unauthorized. Must be an evaluator to view completed evaluations.' },
      { status: 401 }
    );
  }

  const evaluatorId = session.user.userId;

  try {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        authorId: evaluatorId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            submissionDate: true,
            group: {
              select: {
                name: true,
                groupUserName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Assuming createdAt of evaluation is the evaluationDate
      },
    });

    // The frontend CompletedTab expects fields like projectTitle, groupName, evaluationDate, score, category.
    // The transformation is already handled in the CompletedTab.tsx component using this data structure.
    // (e.g., evaluation.project?.title, new Date(evaluation.createdAt) for evaluationDate)
    // So, we can return the evaluations as fetched, assuming frontend can map them.

    return NextResponse.json(evaluations, { status: 200 });
  } catch (error) {
    console.error(`Error fetching completed evaluations for evaluator ${evaluatorId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error while fetching completed evaluations.' },
      { status: 500 }
    );
  }
} 