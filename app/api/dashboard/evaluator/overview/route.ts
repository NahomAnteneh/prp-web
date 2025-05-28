import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, FeedbackStatus } from '@prisma/client';

// GET /api/dashboard/evaluator/overview
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json({ error: 'Unauthorized. Must be an evaluator to view dashboard overview.' }, { status: 401 });
  }

  const evaluatorId = session.user.userId;

  try {
    const evaluator = await prisma.user.findUnique({
      where: { userId: evaluatorId },
      select: { firstName: true, lastName: true }
    });

    const evaluatorName = evaluator ? `${evaluator.firstName} ${evaluator.lastName}` : 'Evaluator';

    // 1. Announcements (fetch general active announcements for now)
    const announcementsData = await prisma.announcement.findMany({
      where: { active: true }, // Add more specific targeting if needed
      orderBy: { createdAt: 'desc' },
      take: 5, // Limit to 5 most recent
    });
    const announcements = announcementsData.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.createdAt.toISOString(),
        type: a.priority > 1 ? 'urgent' : 'info', // Example mapping
    }));

    // 2. Stats
    const totalAssignedProjects = await prisma.projectEvaluator.count({
      where: { evaluatorId: evaluatorId }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const completedThisWeekCount = await prisma.evaluation.count({
      where: {
        authorId: evaluatorId,
        createdAt: { gte: sevenDaysAgo }
      }
    });
    
    const assignedProjectIds = (await prisma.projectEvaluator.findMany({
        where: { evaluatorId },
        select: { projectId: true },
      })).map(pe => pe.projectId);

    let pendingFeedbackCount = 0;
    if (assignedProjectIds.length > 0) {
        pendingFeedbackCount = await prisma.feedback.count({
            where: {
                projectId: { in: assignedProjectIds },
                status: FeedbackStatus.OPEN, // Or any status considered \'pending\' from evaluator\'s perspective
            }
        });
    }
    
    // Placeholder for inProgress and averageEvaluationTime as they are more complex
    const stats = {
      totalAssigned: totalAssignedProjects,
      inProgress: 0, // TODO: Implement logic (e.g., assigned projects without a submitted evaluation)
      completedThisWeek: completedThisWeekCount,
      pendingFeedback: pendingFeedbackCount,
      averageEvaluationTime: 'N/A', // TODO: Implement logic
    };

    // 3. Unread Notifications Count
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        recipientId: evaluatorId,
        read: false,
      }
    });

    const overviewData = {
      evaluatorName,
      announcements,
      stats,
      unreadNotificationsCount,
    };

    return NextResponse.json(overviewData, { status: 200 });

  } catch (error) {
    console.error(`Error fetching evaluator dashboard overview for ${evaluatorId}:`, error);
    return NextResponse.json({ error: 'Internal server error while fetching dashboard overview.' }, { status: 500 });
  }
} 