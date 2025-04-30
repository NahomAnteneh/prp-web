// get all data for any specific user
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

    // Check authorization (users can only see their own profile, or admins can see any)
    const isAuthorized = 
      session.user.id === userId || 
      session.user.role === "ADMINISTRATOR"
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to view this profile" },
        { status: 403 }
      )
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileInfo: true,
        createdAt: true,
        updatedAt: true,
        // Include relation counts
        _count: {
          select: {
            groupsMemberOf: true,
            advisedProjects: true,
            commitsAuthored: true,
            repositoriesOwned: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Format the response data
    const userResponse = {
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileInfo: user.profileInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        groups: user._count.groupsMemberOf,
        advisedProjects: user._count.advisedProjects,
        commits: user._count.commitsAuthored,
        repositories: user._count.repositoriesOwned,
      }
    }

    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    )
  }
}