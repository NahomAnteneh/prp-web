import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { formatTimeAgo } from "@/lib/utils"
import { z } from "zod"

const userIdSchema = z.string().min(1)

// Query parameter schema
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  includeGroupRepos: z.enum(["true", "false"]).transform(val => val === "true").optional(),
}).optional()

export async function GET(
  request: Request,
  context: { params: { userId: string } | Promise<{ userId: string }> }
) {
  try {
    // Resolve params first
    const resolvedParams = await Promise.resolve(context.params);
    const userId = resolvedParams.userId;

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
    let groupUserNames: string[] = []
    if (includeGroupRepos) {
      const userGroups = await db.groupMember.findMany({
        where: { userId },
        select: { groupUserName: true }
      })
      groupUserNames = userGroups.map(ug => ug.groupUserName)
    }

    // Fetch repositories from user's groups
    const repositories = await db.repository.findMany({
      where: {
        // Only group repositories
        groupUserName: { in: groupUserNames }
      },
      select: {
        name: true,
        description: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        groupUserName: true,
        owner: {
          select: {
            name: true,
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
    const formattedRepositories = repositories.map(repo => ({
      name: repo.name,
      description: repo.description,
      isPrivate: repo.isPrivate,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      lastActivity: formatTimeAgo(repo.updatedAt),
      ownerId: repo.ownerId,
      groupUserName: repo.groupUserName,
      group: {
        name: repo.owner.name,
        groupUserName: repo.groupUserName,
      },
      stats: {
        commits: repo._count.commits,
        branches: repo._count.branches,
        projects: repo._count.projects,
      },
      isOwner: repo.ownerId === userId,
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