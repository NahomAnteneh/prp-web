import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
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

    const userId = await params.userId

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
            groupUserName: true,
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
                userId: true,
                firstName: true,
                lastName: true,
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
      groupUserName: primaryGroup.groupUserName,
      description: primaryGroup.description,
      memberCount: primaryGroup._count.members,
      projectCount: primaryGroup._count.projects,
      repositoryCount: primaryGroup._count.repositories,
      leader: {
        id: primaryGroup.leader.userId,
        name: `${primaryGroup.leader.firstName} ${primaryGroup.leader.lastName}`,
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