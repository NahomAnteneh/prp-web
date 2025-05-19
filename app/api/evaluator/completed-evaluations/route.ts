import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
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
    
    // Get completed evaluations
    const completedEvaluations = await prisma.evaluation.findMany({
      where: { authorId: userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
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
        createdAt: 'desc',
      },
    });
    
    // Format the evaluations for the response
    const formattedEvaluations = completedEvaluations.map(evaluation => {
      const criteriaData = evaluation.criteriaData as any || {};
      
      return {
        id: evaluation.id,
        projectId: evaluation.projectId,
        projectTitle: evaluation.project.title,
        groupName: evaluation.project.group.name,
        groupUserName: evaluation.project.group.groupUserName,
        score: evaluation.score,
        comments: evaluation.comments,
        criteria: criteriaData.criteria || [],
        submissionDate: evaluation.project.submissionDate,
        evaluationDate: evaluation.createdAt,
        projectStatus: evaluation.project.status,
      };
    });
    
    return NextResponse.json(formattedEvaluations);
    
  } catch (error) {
    console.error('Error fetching completed evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completed evaluations' },
      { status: 500 }
    );
  }
} 