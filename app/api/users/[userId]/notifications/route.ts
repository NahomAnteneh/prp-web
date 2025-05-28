import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Initialize Prisma client
const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.userId;
    
    // Check if user is authorized to access these notifications
    if (session.user.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch all notifications from the database
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
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

// POST method for sending new notifications
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const recipientId = params.userId
    
    // Parse the request body
    const body = await request.json()
    const { message, title } = body
    
    if (!message) {
      return NextResponse.json({ error: "Missing required message field" }, { status: 400 })
    }

    // Create the new notification
    const newNotification = await prisma.notification.create({
      data: {
        recipientId,
        message,
        link: title, // Using title as link since there's no title field in schema
        read: false
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Notification sent successfully",
      notification: newNotification
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}

// PATCH method for marking notifications as read
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = params.userId
    
    // Check if user is authorized to update these notifications
    if (session.user.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
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
        recipientId: userId,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: "Notifications marked as read" 
    })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
} 