import { NextResponse } from "next/server";
import { PrismaClient, AdvisorRequestStatus, Role, TaskStatus, ProjectStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize Prisma client
const prisma = new PrismaClient();

type GroupProjectData = {
  groupUserName: string;
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
      groupUserName: string;
      name: string;
      description: string | null;
      leader: {
        userId: string;
        firstName: string;
        lastName: string;
      };
      members: Array<{
        user: {
          userId: string;
          firstName: string;
          lastName: string;
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
        userId: string;
        firstName: string;
        lastName: string;
      } | null;
    }>;
  }>;
}

type FeedbackActivity = {
  type: 'feedback';
  id: string;
  content: string;
  createdAt: Date;
  author: { userId: string; firstName: string; lastName: string };
  project: { id: string; title: string; group: { groupUserName: string; name: string } } | null;
}

type TaskActivity = {
  type: 'task';
  id: string;
  title: string;
  status: TaskStatus;
  updatedAt: Date;
  assignee: { userId: string; firstName: string; lastName: string } | null;
  project: { id: string; title: string; group: { groupUserName: string; name: string } };
}

type Activity = FeedbackActivity | TaskActivity;

export async function GET() {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.userId;

    // Verify user is an advisor
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
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
        groupUserName: true,
        group: {
          select: {
            groupUserName: true,
            name: true,
            description: true,
            leader: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
            members: {
              select: {
                user: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
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
                userId: true,
                firstName: true,
                lastName: true,
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
      active: advisedProjects.filter(p => p.status === ProjectStatus.ACTIVE).length,
      completed: advisedProjects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      pending: advisedProjects.filter(p => p.status === ProjectStatus.SUBMITTED).length,
    };

    // Group projects by group
    const projectsByGroup: Record<string, GroupProjectData> = {};
    
    advisedProjects.forEach(project => {
      if (project.group) {
        const groupUserName = project.group.groupUserName;
        
        if (!projectsByGroup[groupUserName]) {
          projectsByGroup[groupUserName] = {
            groupUserName: groupUserName,
            groupName: project.group.name,
            groupDescription: project.group.description,
            projects: [],
          };
        }
        
        projectsByGroup[groupUserName].projects.push({
          ...project,
          group: project.group
        });
      }
    });

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
        authorId: true,
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        projectId: true,
        project: {
          select: {
            id: true,
            title: true,
            groupUserName: true,
            group: {
              select: {
                groupUserName: true,
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
        assigneeId: true,
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        projectId: true,
        project: {
          select: {
            id: true,
            title: true,
            groupUserName: true,
            group: {
              select: {
                groupUserName: true,
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
        groupUserName: true,
        group: {
          select: {
            groupUserName: true,
            name: true,
            description: true,
            leader: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
            members: {
              select: {
                user: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            projects: {
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
      project: f.project ? {
        id: f.project.id,
        title: f.project.title,
        group: {
          groupUserName: f.project.group.groupUserName,
          name: f.project.group.name
        }
      } : null,
    }));

    const taskActivities: TaskActivity[] = recentTaskUpdates.map(t => ({
      type: 'task',
      id: t.id,
      title: t.title,
      status: t.status,
      updatedAt: t.updatedAt,
      assignee: t.assignee,
      project: {
        id: t.project.id,
        title: t.project.title,
        group: {
          groupUserName: t.project.group.groupUserName,
          name: t.project.group.name
        }
      },
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
        id: user.userId,
        name: user.firstName,
        username: user.lastName,
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