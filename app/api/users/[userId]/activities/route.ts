import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { z } from "zod"

// Initialize Prisma client
const prisma = new PrismaClient()

const userIdSchema = z.string().min(1)

// Query parameter schema
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
}).optional()

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate userId
    const parsedParams = userIdSchema.safeParse(params.userId)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    const userId = params.userId

    // Parse query parameters
    const url = new URL(request.url)
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams))
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      )
    }

    const queryParams = queryResult.data || {}
    const limit = queryParams.limit || 10
    const offset = queryParams.offset || 0

    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Check authorization (users can only see their own data, or admins can see any)
    const isAuthorized = 
      session.user.id === userId || 
      session.user.role === "ADMINISTRATOR"
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to view this user's activities" },
        { status: 403 }
      )
    }

    // 1. Get recent commits
    const commits = await prisma.commit.findMany({
      where: {
        authorId: userId,
      },
      select: {
        id: true,
        message: true,
        timestamp: true,
        createdAt: true,
        repository: {
          select: {
            id: true,
            name: true,
            projects: {
              select: {
                project: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
              take: 1, // Just get one related project for context
            },
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 5, // Limit to a few recent commits
    })

    // 2. Get merge requests
    const mergeRequests = await prisma.mergeRequest.findMany({
      where: {
        creatorId: userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        repository: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5, // Limit to a few recent merge requests
    })

    // 3. Get tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId }, // Assigned to this user
          { creatorId: userId }   // Created by this user
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5, // Limit to a few recent tasks
    })

    // 4. Get feedback
    const feedback = await prisma.feedback.findMany({
      where: {
        authorId: userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Limit to a few recent feedback items
    })

    // Map commits to activity format
    const commitActivities = commits.map((commit: any) => {
      // Find a related project if any
      const relatedProject = commit.repository.projects[0]?.project;
      
      return {
        id: `commit-${commit.id}`,
        type: "commit",
        title: truncateMessage(commit.message),
        description: commit.message,
        timestamp: formatTimeAgo(commit.timestamp),
        timestamp_raw: commit.timestamp,
        project: relatedProject?.title,
        projectId: relatedProject?.id,
        relatedTo: commit.repository.name,
        relatedToId: commit.repository.id,
        relatedToType: "repository",
        link: `/repositories/${commit.repository.id}/commits/${commit.id}`,
      };
    });

    // Map merge requests to activity format
    const mergeRequestActivities = mergeRequests.map((mr: any) => ({
      id: `mr-${mr.id}`,
      type: "pull_request",
      title: truncateMessage(mr.title),
      description: `${mr.title} - ${mr.status}`,
      timestamp: formatTimeAgo(mr.updatedAt),
      timestamp_raw: mr.updatedAt,
      project: null,
      projectId: null,
      relatedTo: mr.repository.name,
      relatedToId: mr.repository.id,
      relatedToType: "repository",
      link: `/repositories/${mr.repository.id}/merge-requests/${mr.id}`,
    }));

    // Map tasks to activity format
    const taskActivities = tasks.map((task: any) => ({
      id: `task-${task.id}`,
      type: "task",
      title: task.title,
      description: `Task: ${task.title} - ${task.status}`,
      timestamp: formatTimeAgo(task.updatedAt),
      timestamp_raw: task.updatedAt,
      project: task.project?.title,
      projectId: task.project?.id,
      relatedTo: `Task #${task.id}`,
      relatedToId: task.id,
      relatedToType: "task",
      link: `/projects/${task.project?.id}/tasks/${task.id}`,
    }));

    // Map feedback to activity format
    const feedbackActivities = feedback.map((fb: any) => {
      const relatedType = fb.project ? "project" : "repository";
      const relatedName = fb.project?.title || fb.repository?.name;
      const relatedId = fb.project?.id || fb.repository?.id;
      
      return {
        id: `feedback-${fb.id}`,
        type: "comment",
        title: fb.title || "Feedback provided",
        description: truncateMessage(fb.content),
        timestamp: formatTimeAgo(fb.createdAt),
        timestamp_raw: fb.createdAt,
        project: fb.project?.title,
        projectId: fb.project?.id,
        relatedTo: relatedName,
        relatedToId: relatedId,
        relatedToType: relatedType,
        link: `/${relatedType}s/${relatedId}/feedback/${fb.id}`,
      };
    });

    // Combine all activities and sort by timestamp
    let allActivities = [
      ...commitActivities,
      ...mergeRequestActivities,
      ...taskActivities,
      ...feedbackActivities,
    ].sort((a, b) => 
      new Date(b.timestamp_raw).getTime() - new Date(a.timestamp_raw).getTime()
    );

    // Apply pagination
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    return NextResponse.json(paginatedActivities)
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
  
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date)
}

// Helper to truncate message content
function truncateMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
} 