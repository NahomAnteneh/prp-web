import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Initialize Prisma client
const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the user ID
    const userId = session.user.id

    // Fetch real notifications from the database
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent notifications
    })

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        read: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// Add a POST method to mark notifications as read
export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "Invalid notification IDs" }, { status: 400 })
    }

    // Mark notifications as read in the database
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipientId: session.user.id,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}