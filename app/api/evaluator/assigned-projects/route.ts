import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, ProjectStatus } from '@prisma/client';

// GET /api/evaluator/assigned-projects
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json({ error: 'Unauthorized. You must be an evaluator to view assigned projects.' }, { status: 401 });
  }

  const evaluatorId = session.user.userId;

  try {
    const assignedProjectEntries = await prisma.projectEvaluator.findMany({
      where: {
        evaluatorId: evaluatorId,
      },
      include: {
        project: {
          include: {
            group: true, // To get groupName (which is group.name or group.groupUserName)
            evaluations: { // To get existing evaluation details for this evaluator
              where: {
                authorId: evaluatorId,
              },
              orderBy: {
                createdAt: 'desc' // Get the latest evaluation if multiple (though typically one per evaluator)
              },
              take: 1
            }
          }
        },
      },
      orderBy: {
        project: {
          createdAt: 'desc' // Order projects by creation date or submission date
        }
      }
    });

    // Transform data to match frontend AssignedProject interface
    const assignedProjects = assignedProjectEntries.map(entry => {
      const project = entry.project;
      const latestEvaluation = project.evaluations?.[0];
      
      let status: 'PENDING_EVALUATION' | 'IN_PROGRESS' | 'EVALUATION_COMPLETED' | 'FEEDBACK_PROVIDED' = 'PENDING_EVALUATION';
      
      if (latestEvaluation) {
        // This logic might need refinement based on how `markAsCompleted` was intended to work.
        // If an evaluation exists, it implies it is at least IN_PROGRESS or COMPLETED.
        // For now, if an evaluation exists, we assume it means it has been worked on.
        // A more robust status might come from the Project model itself, e.g. project.status
        status = 'EVALUATION_COMPLETED'; // Or IN_PROGRESS if not explicitly completed
      } else if (project.status === ProjectStatus.SUBMITTED || project.status === ProjectStatus.ACTIVE) {
         // If no evaluation yet, but project is submitted/active, it implies pending for this evaluator
         status = 'PENDING_EVALUATION';
      }
      // Consider further logic based on project.status and presence of evaluation.
      // The `markAsCompleted` flag in the frontend dialog might directly translate to a project status update
      // or a specific field in the Evaluation model itself. The current backend for submission
      // doesn't explicitly handle a separate \"completed\" flag beyond creating/updating the evaluation record.

      return {
        id: project.id,
        title: project.title,
        groupName: project.group.name, // Assuming group.name is the display name
        groupUserName: project.group.groupUserName, // Crucial for API calls
        submissionDate: project.submissionDate ? project.submissionDate.toISOString() : new Date().toISOString(), // Fallback for safety
        status: status, // This needs to be derived based on actual project and evaluation state
        currentScore: latestEvaluation?.score,
        feedbackSummary: latestEvaluation?.comments, // Or a snippet
        // evaluationLink: `/evaluator/evaluate/${project.id}` // Example link if a separate page exists
      };
    });

    return NextResponse.json(assignedProjects, { status: 200 });
  } catch (error) {
    console.error(`Error fetching assigned projects for evaluator ${evaluatorId}:`, error);
    return NextResponse.json({ error: 'Internal server error while fetching assigned projects.' }, { status: 500 });
  }
} 