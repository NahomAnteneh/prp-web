// get all data for any specific user
import { NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Initialize Prisma client
const prisma = new PrismaClient()

const userIdSchema = z.string().min(1)

// Define interface for profile info to help with type safety
interface ProfileInfo {
  idNumber?: string;
  department?: string;
  batchYear?: string;
  bio?: string;
  [key: string]: any; // Allow for other fields that might be in the JSON
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Retrieve and await the params
    const { userId } = await params

    // Validate userId
    const parsedParams = userIdSchema.safeParse(userId)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { username: userId },
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

    // Create a safe version of profileInfo with proper typing
    const safeProfileInfo = (user.profileInfo || {}) as ProfileInfo;

    // Format the response data
    const userResponse = {
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileInfo: safeProfileInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        groups: user._count.groupsMemberOf,
        advisedProjects: user._count.advisedProjects,
        commits: user._count.commitsAuthored,
        repositories: user._count.repositoriesOwned,
      },
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

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Retrieve and validate params
    const { userId } = await params
    const parsedParams = userIdSchema.safeParse(userId)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { firstName, lastName, email, password, profileInfo, role } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prepare data for update
    const updateData: any = {}

    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email) updateData.email = email
    if (profileInfo) updateData.profileInfo = profileInfo
    if (role) updateData.role = role

    // Handle password update if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { username: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileInfo: true,
        updatedAt: true,
        // Don't return sensitive info like passwordHash
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user data:", error)
    return NextResponse.json(
      { error: "Failed to update user data" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Retrieve and validate params
    const { userId } = await params
    const parsedParams = userIdSchema.safeParse(userId)
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }

    // Check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { username: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Delete the user
    await prisma.user.delete({
      where: { username: userId },
    })

    return NextResponse.json({
      success: true,
      message: "User successfully deleted",
    })
  } catch (error) {
    console.error("Error deleting user:", error)

    // Handle referential integrity errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { 
            error: "Cannot delete user because they have related data in the system. Consider deactivating the user instead." 
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}