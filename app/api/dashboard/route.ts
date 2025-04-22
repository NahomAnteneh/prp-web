import { NextResponse } from "next/server"
import { PrismaClient, TaskStatus } from "@prisma/client"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

// Initialize Prisma client
const prisma = new PrismaClient()

// Define types for activity data
interface CommitData {
  id: string
  message: string
  timestamp: Date
  repository: {
    id: string
    projectId: string
  }
}

interface MergeRequestData {
  id: string
  title: string
  createdAt: Date
  repositoryId: string
}

interface FeedbackData {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
  }
  project: {
    id: string
    title: string
  } | null
}

export async function GET() {
  try {
    console.log("Dashboard API: Fetching data")
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("Dashboard API: User not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`Dashboard API: Processing request for user ${userId}`)

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    })

    if (!user) {
      console.log(`Dashboard API: User ${userId} not found in database`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("Dashboard API: Retrieved user data:", user)

    // Get unread notifications count
    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    })
    console.log(`Dashboard API: Found ${unreadNotificationsCount} unread notifications`)

    // Get announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
      },
    })
    console.log(`Dashboard API: Found ${announcements.length} announcements`)

    // Get user's groups
    const userGroups = await prisma.groupMember.findMany({
      where: {
        userId,
      },
      select: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const groupIds = userGroups.map((ug) => ug.group.id)
    const hasGroup = groupIds.length > 0
    const groupName = hasGroup ? userGroups[0].group.name : null
    console.log(`Dashboard API: User belongs to ${groupIds.length} groups. Has group: ${hasGroup}`)

    // Get projects
    const projects = await prisma.project.findMany({
      where: {
        groupId: {
          in: groupIds,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        archived: true,
      },
    })
    console.log(`Dashboard API: Found ${projects.length} projects`)

    // Calculate project summary
    const projectSummary = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => 
        !p.archived && p.status !== "Completed").length,
      completedProjects: projects.filter((p) => 
        p.status === "Completed" || p.archived).length,
    }

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log(`Dashboard API: Found ${tasks.length} tasks for user`)

    // Calculate task summary
    const taskSummary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      inProgressTasks: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      todoTasks: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      blockedTasks: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    }

    // Get upcoming deadlines
    const now = new Date()
    const upcomingDeadlines = tasks
      .filter((task) => 
        task.deadline && 
        task.status !== TaskStatus.DONE && 
        new Date(task.deadline) > now
      )
      .map((task) => {
        const deadline = new Date(task.deadline as Date)
        const diffTime = Math.abs(deadline.getTime() - now.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
          id: task.id,
          title: task.title,
          deadline: task.deadline,
          daysRemaining: diffDays,
        }
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 3) // Get only the 3 most urgent tasks
    
    console.log(`Dashboard API: Found ${upcomingDeadlines.length} upcoming deadlines`)

    // Get recent activities based on user's activity
    try {
      // Get recent commits
      const recentCommits = await prisma.commit.findMany({
        where: {
          authorId: userId,
        },
        take: 2,
        orderBy: {
          timestamp: "desc",
        },
        select: {
          id: true,
          message: true,
          timestamp: true,
          repository: {
            select: {
              id: true,
              projectId: true,
            },
          },
        },
      })
      console.log(`Dashboard API: Found ${recentCommits.length} recent commits`)

      // Get recent merge requests
      const recentMergeRequests = await prisma.mergeRequest.findMany({
        where: {
          creatorId: userId,
        },
        take: 2,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          repositoryId: true,
        },
      })
      console.log(`Dashboard API: Found ${recentMergeRequests.length} recent merge requests`)

      // Get recent feedback
      const recentFeedback = await prisma.feedback.findMany({
        where: {
          OR: [
            {
              authorId: userId,
            },
            {
              project: {
                group: {
                  members: {
                    some: {
                      userId,
                    },
                  },
                },
              },
            },
          ],
        },
        take: 2,
        orderBy: {
          createdAt: "desc",
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
            },
          },
        },
      })
      console.log(`Dashboard API: Found ${recentFeedback.length} recent feedback items`)
      
      // Combine and format activities
      const recentActivities = [
        ...recentCommits.map((commit: CommitData) => ({
          id: `commit-${commit.id}`,
          type: "commit" as const,
          title: `Committed: ${commit.message.length > 50 ? commit.message.substring(0, 47) + '...' : commit.message}`,
          description: `Repository #${commit.repository.id}`,
          timestamp: commit.timestamp,
          link: `/repository/${commit.repository.projectId}/commits/${commit.id}`,
        })),
        ...recentMergeRequests.map((mr: MergeRequestData) => ({
          id: `mr-${mr.id}`,
          type: "merge_request" as const,
          title: `Merge Request: ${mr.title}`,
          description: `Repository #${mr.repositoryId}`,
          timestamp: mr.createdAt,
          link: `/repository/${mr.repositoryId}/merge-requests/${mr.id}`,
        })),
        ...recentFeedback.map((fb: FeedbackData) => ({
          id: `feedback-${fb.id}`,
          type: "feedback" as const,
          title: fb.author.id === userId 
            ? `Feedback provided on ${fb.project?.title || 'project'}`
            : `Feedback received from ${fb.author.name || 'Anonymous'}`,
          description: fb.content.length > 60 ? fb.content.substring(0, 57) + '...' : fb.content,
          timestamp: fb.createdAt,
          link: `/feedback/${fb.id}`,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4) // Get only the 4 most recent activities
      
      // Ensure name is included in the user data
      const userData = {
        id: user.id,
        name: user.name || session.user.name || "Student", // Fallback to session name or default
        unreadNotifications: unreadNotificationsCount,
        hasGroup: hasGroup,
        groupName: groupName,
      }
      
      console.log("Dashboard API: User data for response:", userData)
      
      const responseData = {
        user: userData,
        announcements,
        projectSummary,
        taskSummary: {
          ...taskSummary,
          upcomingDeadlines,
        },
        recentActivities,
      }
      
      console.log("Dashboard API: Successfully compiled response data")
      return NextResponse.json(responseData)
    } catch (activitiesError) {
      console.error("Dashboard API: Error fetching activities data:", activitiesError)
      
      // Ensure name is included in the user data
      const userData = {
        id: user.id,
        name: user.name || session.user.name || "Student", // Fallback to session name or default
        unreadNotifications: unreadNotificationsCount,
        hasGroup: hasGroup,
        groupName: groupName,
      }
      
      console.log("Dashboard API: User data for partial response:", userData)
      
      // Return data without activities if that part fails
      const responseData = {
        user: userData,
        announcements,
        projectSummary,
        taskSummary: {
          ...taskSummary,
          upcomingDeadlines,
        },
        recentActivities: [],
      }
      
      console.log("Dashboard API: Returning partial data without activities")
      return NextResponse.json(responseData)
    }
  } catch (error) {
    console.error("Dashboard API: Fatal error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
} 