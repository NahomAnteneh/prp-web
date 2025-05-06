import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

// Initialize Prisma client
const prisma = new PrismaClient()

const userIdSchema = z.string().min(1)

// Query parameter schema
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  includeGroupRepos: z.enum(["true", "false"]).transform(val => val === "true").optional(),
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
    const parsedParams = userIdSchema.safeParse(userId);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
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
    const limit = queryParams.limit || 10
    const includeGroupRepos = queryParams.includeGroupRepos ?? true

    // Get user's groups for group repository lookup
    let groupIds: string[] = []
    if (includeGroupRepos) {
      const userGroups = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true }
      })
      groupIds = userGroups.map((ug: { groupId: string }) => ug.groupId)
    }

    // Fetch repositories - both user-owned and those from their groups
    const repositories = await prisma.repository.findMany({
      where: {
        OR: [
          { ownerId: userId }, // User's personal repositories
          // Include group repositories if option is enabled and user belongs to groups
          ...(includeGroupRepos && groupIds.length > 0 
            ? [{ groupId: { in: groupIds } }] 
            : [])
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            commits: true,
            branches: true,
            projects: true,
          },
        },
      },
      orderBy: [
        { updatedAt: "desc" }
      ],
      take: limit,
    })

    // Format repositories for response
    const formattedRepositories = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      isPrivate: repo.isPrivate,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      lastActivity: formatTimeAgo(repo.updatedAt),
      owner: {
        id: repo.owner.id,
        username: repo.owner.username,
        name: `${repo.owner.firstName} ${repo.owner.lastName}`,
      },
      group: repo.group ? {
        id: repo.group.id,
        name: repo.group.name,
      } : null,
      stats: {
        commits: repo._count.commits,
        branches: repo._count.branches,
        projects: repo._count.projects,
      },
      isOwner: repo.owner.id === userId,
    }))

    return NextResponse.json(formattedRepositories)
  } catch (error) {
    console.error("Error fetching user repositories:", error)
    return NextResponse.json(
      { error: "Failed to fetch repository data" },
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