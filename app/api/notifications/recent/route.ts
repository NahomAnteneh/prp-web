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