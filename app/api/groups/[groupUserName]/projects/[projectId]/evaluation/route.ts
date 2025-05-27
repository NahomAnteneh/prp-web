import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Assuming your authOptions are here
import { prisma } from '@/lib/prisma'; // Corrected Prisma import
import { Role } from '@prisma/client';

interface RequestBody {
  score: number;
  comments: string;
  criteriaData?: any; // Flexible for now, can be typed more strictly
}

// POST /api/groups/:groupUserName/projects/:projectId/evaluation
export async function POST(
  request: Request,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json({ error: 'Unauthorized. You must be an evaluator to submit evaluations.' }, { status: 401 });
  }

  const { projectId } = params;
  const evaluatorId = session.user.userId;

  try {
    const body: RequestBody = await request.json();
    const { score, comments, criteriaData } = body;

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json({ error: 'Invalid score. Must be between 0 and 100.' }, { status: 400 });
    }
    if (!comments || typeof comments !== 'string' || comments.trim() === '') {
      return NextResponse.json({ error: 'Comments are required.' }, { status: 400 });
    }

    // Verify the evaluator is assigned to this project
    const projectEvaluator = await prisma.projectEvaluator.findUnique({
      where: {
        projectId_evaluatorId: {
          projectId,
          evaluatorId,
        },
      },
    });

    if (!projectEvaluator) {
      return NextResponse.json({ error: 'Forbidden. You are not assigned to evaluate this project.' }, { status: 403 });
    }
    
    // Check if an evaluation already exists from this evaluator for this project
    const existingEvaluation = await prisma.evaluation.findFirst({
        where: {
            projectId,
            authorId: evaluatorId,
        }
    });

    if (existingEvaluation) {
        // Update existing evaluation
        const updatedEvaluation = await prisma.evaluation.update({
            where: {
                id: existingEvaluation.id,
            },
            data: {
                score,
                comments,
                criteriaData: criteriaData || existingEvaluation.criteriaData, // Keep old criteria if new not provided
                createdAt: new Date(), // Explicitly update timestamp if desired, or let Prisma handle `updatedAt` if schema has it
            },
        });
        return NextResponse.json(updatedEvaluation, { status: 200 });
    }


    // Create the new evaluation
    const newEvaluation = await prisma.evaluation.create({
      data: {
        score,
        comments,
        criteriaData: criteriaData || {}, // Ensure criteriaData is at least an empty object
        projectId,
        authorId: evaluatorId,
        // project: { connect: { id: projectId } }, // This is implicit via projectId
        // author: { connect: { userId: evaluatorId } }, // This is implicit via authorId
      },
      include: {
        project: {
          select: { title: true }
        },
        author: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Optionally, update project status if this evaluation completes it
    // For now, keeping it simple as requested.

    return NextResponse.json(newEvaluation, { status: 201 });
  } catch (error) {
    console.error(`Error creating/updating evaluation for project ${projectId} by evaluator ${evaluatorId}:`, error);
    if (error instanceof SyntaxError) { // Handle malformed JSON
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error while submitting evaluation.' }, { status: 500 });
  }
} 