import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma client
const prisma = new PrismaClient();

// Validation schema
const userIdSchema = z.string().min(1, 'User ID is required');

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate userId
    const parsedUserId = userIdSchema.safeParse(params.userId);
    if (!parsedUserId.success) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const userId = params.userId;

    // Verify this is an advisor
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== Role.ADVISOR) {
      return NextResponse.json(
        { error: 'User is not an advisor' },
        { status: 400 }
      );
    }

    // Get all projects advised by this advisor
    const advisedProjects = await prisma.project.findMany({
      where: {
        advisorId: userId
      },
      select: {
        id: true,
        title: true,
        status: true,
        groupId: true,
        group: {
          select: {
            name: true,
            members: {
              select: {
                userId: true,
                user: {
                  select: {
                    userId: true,
                    firstName: true,
                    lastName: true,
                    profileInfo: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Extract unique advisees from projects
    const adviseeMap = new Map();

    for (const project of advisedProjects) {
      for (const member of project.group.members) {
        const user = member.user;
        
        // Skip if already processed this user
        if (adviseeMap.has(user.userId)) {
          // If this user has a project and the existing entry doesn't, add the project
          const existingAdvisee = adviseeMap.get(user.userId);
          if (!existingAdvisee.projectTitle && project.status === 'ACTIVE') {
            existingAdvisee.projectTitle = project.title;
          }
          continue;
        }

        // Extract profile info (cast to any to access properties)
        const profileInfo = user.profileInfo as any || {};
        
        // Determine graduation status
        // This is a simplified logic - in a real app, you'd have proper logic
        let graduationStatus: "CURRENT" | "GRADUATED" | "INACTIVE" = "CURRENT";
        
        if (project.status === 'COMPLETED') {
          graduationStatus = "GRADUATED";
        } else if (project.status === 'ARCHIVED') {
          graduationStatus = "INACTIVE";
        }

        adviseeMap.set(user.userId, {
          id: user.userId,
          name: `${user.firstName} ${user.lastName}`,
          department: profileInfo.department || 'Unknown Department',
          batchYear: profileInfo.batchYear || 'Unknown Batch',
          graduationStatus,
          projectTitle: project.status === 'ACTIVE' ? project.title : undefined
        });
      }
    }

    // Convert map to array
    const advisees = Array.from(adviseeMap.values());

    // Sort by name
    advisees.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(advisees);
  } catch (error) {
    console.error('Error fetching advisees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advisees' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 