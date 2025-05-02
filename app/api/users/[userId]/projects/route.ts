import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Initialize Prisma client
const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
        const { userId } = params

    // Get user's groups
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    })

    const groupIds = userGroups.map((ug: { groupId: string }) => ug.groupId)

    if (groupIds.length === 0) {
      return NextResponse.json([]) // Return empty array if user is not in any group
    }

    // Build the filter conditions
    const whereCondition: any = {
      OR: [
        { groupId: { in: groupIds } }, // Projects from user's groups
        { advisorId: userId }         // Projects the user advises
      ]
    }

    // Fetch projects - both from user's groups and those they advise
    const projects = await prisma.project.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        submissionDate: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        groupId: true,
        advisorId: true,
        milestones: true,
        group: {
          select: {
            id: true,
            name: true,
            leaderId: true,
          },
        },
        advisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            evaluations: true,
          },
        },
                tasks: {
          select: {
            id: true,
            title: true,
            description: true,
          },
          take: 5,
        },
      },
      orderBy: [
        { updatedAt: "desc" }
      ],
          })

    // Format the response
    const formattedProjects = projects.map((project: any) => {
            const isGroupLeader = project.group.leaderId === userId

            return {
        id: project.id,
        title: project.title,
        description: project.description || "",
        status: project.status,
        submissionDate: project.submissionDate,
        archived: project.archived,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
                group: {
          id: project.group.id,
          name: project.group.name,
        },
        advisor: project.advisor ? {
          id: project.advisor.id,
          name: `${project.advisor.firstName} ${project.advisor.lastName}`,
        } : null,
        isGroupLeader,
        isAdvisor: project.advisorId === userId,
        milestones: project.milestones,
        stats: {
          tasks: project._count.tasks,
          evaluations: project._count.evaluations,
        }
      }
    })

    return NextResponse.json(formattedProjects)
  } catch (error) {
    console.error("Error fetching user projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch project data" },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
  
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date)
}