import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Initialize Prisma client
const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    if (body.markAll) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          read: false,
        },
        data: {
          read: true,
        },
      })
      
      return NextResponse.json({ 
        success: true, 
        message: "All notifications marked as read" 
      })
    } else if (body.notificationId) {
      // Mark specific notification as read
      await prisma.notification.updateMany({
        where: {
          id: body.notificationId,
          recipientId: userId, // Ensure the notification belongs to the user
        },
        data: {
          read: true,
        },
      })
      
      return NextResponse.json({ 
        success: true, 
        message: `Notification ${body.notificationId} marked as read` 
      })
    } else {
      return NextResponse.json(
        { error: "Invalid request. Provide markAll or notificationId." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
} 