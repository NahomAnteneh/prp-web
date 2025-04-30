import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { z } from "zod"

// Initialize Prisma client
const prisma = new PrismaClient()

const userIdSchema = z.string().min(1)

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
        { error: "Not authorized to view this user's group information" },
        { status: 403 }
      )
    }

    // Find the user's groups
    const userGroups = await prisma.groupMember.findMany({
      where: {
        userId: userId,
      },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            leaderId: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
                projects: true,
                repositories: true,
              },
            },
            leader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        joinedAt: true,
      },
    })

    if (userGroups.length === 0) {
      return NextResponse.json(
        { message: "User is not a member of any group" },
        { status: 404 }
      )
    }

    // Format response to return primary group info (for now just taking the first group)
    // In a real implementation you might add logic to determine the primary group
    const primaryGroup = userGroups[0].group
    const isLeader = primaryGroup.leaderId === userId

    const response = {
      id: primaryGroup.id,
      name: primaryGroup.name,
      description: primaryGroup.description,
      memberCount: primaryGroup._count.members,
      projectCount: primaryGroup._count.projects,
      repositoryCount: primaryGroup._count.repositories,
      leader: {
        id: primaryGroup.leader.id,
        name: `${primaryGroup.leader.firstName} ${primaryGroup.leader.lastName}`,
        username: primaryGroup.leader.username,
      },
      joinedAt: userGroups[0].joinedAt,
      isLeader: isLeader,
      createdAt: primaryGroup.createdAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user's group data:", error)
    return NextResponse.json(
      { error: "Failed to fetch group data" },
      { status: 500 }
    )
  }
} 