import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Retrieve all tasks assigned to the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get filter parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const projectId = url.searchParams.get('projectId');
    const groupId = url.searchParams.get('groupId');
    const dueBefore = url.searchParams.get('dueBefore'); // ISO date string
    const dueAfter = url.searchParams.get('dueAfter'); // ISO date string
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build filter conditions
    const whereConditions: any = {
      assigneeId: userId,
    };

    if (status) {
      whereConditions.status = status;
    }

    if (projectId) {
      whereConditions.projectId = projectId;
    }

    if (dueBefore) {
      whereConditions.deadline = {
        ...whereConditions.deadline,
        lte: new Date(dueBefore),
      };
    }

    if (dueAfter) {
      whereConditions.deadline = {
        ...whereConditions.deadline,
        gte: new Date(dueAfter),
      };
    }

    // Group ID filter requires joining with project
    let projectWhere = {};
    if (groupId) {
      projectWhere = {
        groupId,
      };
    }

    // Fetch tasks
    const tasks = await db.task.findMany({
      where: whereConditions,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: projectWhere,
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // TODO first, then IN_PROGRESS, etc.
        { deadline: 'asc' }, // Earliest deadline first
      ],
      take: limit,
    });

    // Filter out tasks where project is null (due to groupId filter)
    const filteredTasks = tasks.filter((task: { project: any }) => task.project !== null);

    // Calculate statistics for assigned tasks
    const stats = {
      total: filteredTasks.length,
      byStatus: {
        TODO: filteredTasks.filter((task: { status: string }) => task.status === 'TODO').length,
        IN_PROGRESS: filteredTasks.filter((task: { status: string }) => task.status === 'IN_PROGRESS').length,
        DONE: filteredTasks.filter((task: { status: string }) => task.status === 'DONE').length,
        BLOCKED: filteredTasks.filter((task: { status: string }) => task.status === 'BLOCKED').length,
      },
      byProject: {},
    } as any;

    // Build stats by project
    filteredTasks.forEach((task: { 
      projectId: string; 
      project: { 
        title: string 
      } 
    }) => {
      const projectId = task.projectId;
      if (!stats.byProject[projectId]) {
        stats.byProject[projectId] = {
          projectId,
          projectTitle: task.project.title,
          count: 0,
        };
      }
      stats.byProject[projectId].count++;
    });

    // Convert byProject from object to array
    stats.byProject = Object.values(stats.byProject);

    return NextResponse.json({
      tasks: filteredTasks,
      stats,
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 