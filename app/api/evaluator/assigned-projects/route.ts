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
    
    // Get the evaluator's assigned projects with details
    const assignedProjects = await prisma.projectEvaluator.findMany({
      where: { evaluatorId: userId },
      include: {
        project: {
          include: {
            group: {
              select: {
                name: true,
                groupUserName: true,
              },
            },
          },
        },
      },
    });
    
    // Format the response
    const formattedProjects = assignedProjects.map(assignment => ({
      id: assignment.project.id,
      title: assignment.project.title,
      groupName: assignment.project.group.name,
      groupUserName: assignment.project.group.groupUserName,
      status: assignment.project.status,
      submissionDate: assignment.project.submissionDate,
      lastUpdated: assignment.project.updatedAt,
    }));
    
    return NextResponse.json(formattedProjects);
    
  } catch (error) {
    console.error('Error fetching assigned projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned projects' },
      { status: 500 }
    );
  }
} 