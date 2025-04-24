import { NextResponse } from "next/server";
import { PrismaClient, AdvisorRequestStatus, Role, TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Initialize Prisma client
const prisma = new PrismaClient();

type GroupProjectData = {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
  projects: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    submissionDate: Date | null;
    updatedAt: Date;
    group: {
      id: string;
      name: string;
      description: string | null;
      leader: {
        id: string;
        name: string | null;
        username: string;
      };
      members: Array<{
        user: {
          id: string;
          name: string | null;
          username: string;
        };
      }>;
    };
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      status: TaskStatus;
      deadline: Date | null;
      assignee: {
        id: string;
        name: string | null;
      } | null;
    }>;
  }>;
}

type FeedbackActivity = {
  type: 'feedback';
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string | null };
  project: { id: string; title: string; group: { id: string; name: string } } | null;
}

type TaskActivity = {
  type: 'task';
  id: string;
  title: string;
  status: TaskStatus;
  updatedAt: Date;
  assignee: { id: string; name: string | null } | null;
  project: { id: string; title: string; group: { id: string; name: string } };
}

type Activity = FeedbackActivity | TaskActivity;

export async function GET() {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user is an advisor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });

    if (!user || user.role !== Role.ADVISOR) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get advisor's projects
    const advisedProjects = await prisma.project.findMany({
      where: {
        advisorId: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        submissionDate: true,
        updatedAt: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            leader: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            deadline: true,
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 5,
        },
      },
    });

    // Calculate project statistics
    const projectStats = {
      total: advisedProjects.length,
      active: advisedProjects.filter(p => p.status === "Active").length,
      completed: advisedProjects.filter(p => p.status === "Completed").length,
      pending: advisedProjects.filter(p => p.status === "Pending").length,
    };

    // Group projects by group
    const projectsByGroup = advisedProjects.reduce<Record<string, GroupProjectData>>((acc, project) => {
      if (!acc[project.group.id]) {
        acc[project.group.id] = {
          groupId: project.group.id,
          groupName: project.group.name,
          groupDescription: project.group.description,
          projects: [],
        };
      }
      acc[project.group.id].projects.push(project);
      return acc;
    }, {});

    // Get recent activities related to advised projects
    const projectIds = advisedProjects.map(p => p.id);
    
    // Get recent feedback provided on projects
    const recentFeedback = await prisma.feedback.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Get recent tasks updates
    const recentTaskUpdates = await prisma.task.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    // Get pending advisor requests
    const pendingAdvisorRequests = await prisma.advisorRequest.findMany({
      where: {
        // The 'advisorId' is the ID of the user who is requested to be the advisor
        requestedAdvisorId: userId,
        status: AdvisorRequestStatus.PENDING,
      },
      select: {
        id: true,
        requestMessage: true,
        createdAt: true,
        status: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            leader: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
            project: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Get unread notifications
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });

    // Combine all activities and sort by date
    const feedbackActivities: FeedbackActivity[] = recentFeedback.map(f => ({
      type: 'feedback',
      id: f.id,
      content: f.content,
      createdAt: f.createdAt,
      author: f.author,
      project: f.project,
    }));

    const taskActivities: TaskActivity[] = recentTaskUpdates.map(t => ({
      type: 'task',
      id: t.id,
      title: t.title,
      status: t.status,
      updatedAt: t.updatedAt,
      assignee: t.assignee,
      project: t.project,
    }));

    const allActivities: Activity[] = [...feedbackActivities, ...taskActivities]
      .sort((a, b) => {
        const dateA = a.type === 'feedback' ? a.createdAt : a.updatedAt;
        const dateB = b.type === 'feedback' ? b.createdAt : b.updatedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 10);

    return NextResponse.json({
      advisor: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
      projectStats,
      projectsByGroup: Object.values(projectsByGroup),
      recentActivities: allActivities,
      pendingRequests: pendingAdvisorRequests,
      unreadNotificationsCount,
    });
  } catch (error) {
    console.error("Error fetching advisor dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch advisor dashboard data" },
      { status: 500 }
    );
  }
} 