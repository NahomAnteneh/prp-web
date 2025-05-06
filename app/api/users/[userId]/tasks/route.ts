import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

// Initialize Prisma client
const prisma = new PrismaClient()

// Define the TaskStatus enum to match the Prisma schema
enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  BLOCKED = "BLOCKED"
}

const userIdSchema = z.string().min(1)

// Query parameter schema
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "ALL"]).optional(),
  created: z.enum(["true", "false"]).transform(val => val === "true").optional(),
  assigned: z.enum(["true", "false"]).transform(val => val === "true").optional(),
  sortBy: z.enum(["deadline", "createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
}).optional()

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    // Await params before accessing its properties
    const { params } = context;
    const userId = params.userId;

    // Validate userId
    const parsedParams = userIdSchema.safeParse(params.userId)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }

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
    const limit = queryParams.limit || 20
    const offset = queryParams.offset || 0
    const sortBy = queryParams.sortBy || "updatedAt"
    const sortOrder = queryParams.sortOrder || "desc"
    
    // Which tasks to include based on user's relationship with them
    const includeCreated = queryParams.created ?? true
    const includeAssigned = queryParams.assigned ?? true

    // Build the filter conditions
    const whereCondition: any = {
      OR: []
    }

    // Include tasks created by the user
    if (includeCreated) {
      whereCondition.OR.push({ creatorId: userId })
    }

    // Include tasks assigned to the user
    if (includeAssigned) {
      whereCondition.OR.push({ assigneeId: userId })
    }

    // If neither created nor assigned is true, return empty array
    if (whereCondition.OR.length === 0) {
      return NextResponse.json({
        tasks: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
        counts: {
          total: 0,
          todo: 0,
          inProgress: 0,
          done: 0,
          blocked: 0,
        }
      })
    }

    // Filter by status if providedid
    if (queryParams.status && queryParams.status !== "ALL") {
      whereCondition.status = queryParams.status
    }

    // Count total tasks matching the criteria (for pagination info)
    const totalTasks = await prisma.task.count({
      where: whereCondition
    })

    // Get task status counts
    const todoCount = await prisma.task.count({
      where: {
        ...whereCondition,
        status: TaskStatus.TODO
      }
    })

    const inProgressCount = await prisma.task.count({
      where: {
        ...whereCondition,
        status: TaskStatus.IN_PROGRESS
      }
    })

    const doneCount = await prisma.task.count({
      where: {
        ...whereCondition,
        status: TaskStatus.DONE
      }
    })

    const blockedCount = await prisma.task.count({
      where: {
        ...whereCondition,
        status: TaskStatus.BLOCKED
      }
    })

    // Fetch tasks with related data
    const tasks = await prisma.task.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        assignee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
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
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: offset,
      take: limit,
    })

    // Format tasks for response
    const formattedTasks = tasks.map((task: any) => {
      const isCreator = task.creatorId === userId
      const isAssignee = task.assigneeId === userId
      const deadlineFormatted = task.deadline ? formatDate(task.deadline) : null
      const deadlineRelative = task.deadline ? formatTimeAgo(task.deadline) : null
      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE'
      
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        deadlineFormatted,
        deadlineRelative,
        isOverdue,
        technologies: task.technologies || [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        lastUpdated: formatTimeAgo(task.updatedAt),
        creator: {
          id: task.creator.id,
          name: `${task.creator.firstName} ${task.creator.lastName}`,
          username: task.creator.username,
        },
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: `${task.assignee.firstName} ${task.assignee.lastName}`,
          username: task.assignee.username,
        } : null,
        project: task.project ? {
          id: task.project.id,
          title: task.project.title,
          group: task.project.group ? {
            id: task.project.group.id,
            name: task.project.group.name,
          } : null,
        } : null,
        isCreator,
        isAssignee,
      }
    })

    // Construct response with pagination info and status counts
    const response = {
      tasks: formattedTasks,
      pagination: {
        total: totalTasks,
        limit,
        offset,
        hasMore: offset + formattedTasks.length < totalTasks,
      },
      counts: {
        total: totalTasks,
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        blocked: blockedCount,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch task data" },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
  
  if (diffInSeconds < 0) {
    // Future date
    const absDiffInSeconds = Math.abs(diffInSeconds)
    
    if (absDiffInSeconds < 60) {
      return `in ${absDiffInSeconds} second${absDiffInSeconds !== 1 ? 's' : ''}`
    }
    
    const absDiffInMinutes = Math.floor(absDiffInSeconds / 60)
    if (absDiffInMinutes < 60) {
      return `in ${absDiffInMinutes} minute${absDiffInMinutes !== 1 ? 's' : ''}`
    }
    
    const absDiffInHours = Math.floor(absDiffInMinutes / 60)
    if (absDiffInHours < 24) {
      return `in ${absDiffInHours} hour${absDiffInHours !== 1 ? 's' : ''}`
    }
    
    const absDiffInDays = Math.floor(absDiffInHours / 24)
    if (absDiffInDays < 30) {
      return `in ${absDiffInDays} day${absDiffInDays !== 1 ? 's' : ''}`
    }
    
    return `on ${formatDate(date)}`
  }
  
  // Past date
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
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
  
  return formatDate(date)
}

// Helper function to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  }).format(new Date(date))
}