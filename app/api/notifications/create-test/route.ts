import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Initialize Prisma client
const prisma = new PrismaClient()

// This endpoint creates test notifications for the current user
// Only for development/testing purposes
export async function POST() {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id

    // Create some test notifications
    const testNotifications = [
      {
        message: 'You received new feedback on project "PRP Final"',
        link: '/feedback/123',
        recipientId: userId
      },
      {
        message: 'You have been assigned a new task "Fix dashboard UI"',
        link: '/tasks/456',
        recipientId: userId
      },
      {
        message: 'Your merge request has been approved by John Doe',
        link: '/repository/789/merge-requests/10',
        recipientId: userId
      },
      {
        message: 'The deadline for "PRP Final" has been extended',
        link: '/projects/321',
        recipientId: userId
      }
    ]

    // Save the test notifications to the database
    const createdNotifications = await Promise.all(
      testNotifications.map(notification => 
        prisma.notification.create({
          data: notification
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: "Test notifications created successfully",
      count: createdNotifications.length,
      notifications: createdNotifications
    })
  } catch (error) {
    console.error("Error creating test notifications:", error)
    return NextResponse.json(
      { error: "Failed to create test notifications" },
      { status: 500 }
    )
  }
} 