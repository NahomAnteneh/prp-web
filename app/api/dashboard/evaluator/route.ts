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
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'EVALUATOR') {
      return NextResponse.json({ error: 'Access denied. User is not an evaluator' }, { status: 403 });
    }
    
    // Get the evaluator's assigned projects
    const assignedProjects = await prisma.projectEvaluator.findMany({
      where: { evaluatorId: userId },
      include: {
        project: {
          select: {
            id: true,
            status: true,
            evaluations: {
              where: { authorId: userId },
              select: { id: true },
            },
            feedback: {
              where: { authorId: userId },
              select: { id: true, status: true },
            },
          },
        },
      },
    });
    
    // Count total assigned projects
    const totalAssigned = assignedProjects.length;
    
    // Count completed evaluations (projects with at least one evaluation by this evaluator)
    const completed = assignedProjects.filter(
      assignment => assignment.project.evaluations.length > 0
    ).length;
    
    // In progress = total assigned - completed
    const inProgress = totalAssigned - completed;
    
    // Count pending feedback (projects with open feedback from this evaluator)
    const pendingFeedback = assignedProjects.filter(
      assignment => assignment.project.feedback.some(fb => fb.status === 'OPEN')
    ).length;
    
    // Count unread notifications
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
    
    // Return dashboard data
    return NextResponse.json({
      evaluator: {
        id: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        username: user.userId,
      },
      evaluationStats: {
        totalAssigned,
        inProgress,
        completed,
        pendingFeedback,
      },
      unreadNotificationsCount,
    });
    
  } catch (error) {
    console.error('Error fetching evaluator dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 