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
    const projects = await prisma.project.findMany({
      where: {
        advisorId: userId
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        submissionDate: true,
        group: {
          select: {
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Generate some mock tags for projects based on their titles
    const commonTags = [
      'Research', 'Web Development', 'Mobile App', 'AI', 'Machine Learning',
      'Database', 'Cloud Computing', 'Security', 'IoT', 'Design', 'UI/UX',
      'Blockchain', 'Data Science', 'Natural Language Processing', 'Computer Vision'
    ];

    // Format the projects
    const formattedProjects = projects.map(project => {
      // Generate 2-5 random tags
      const numTags = 2 + Math.floor(Math.random() * 4);
      const tags: string[] = [];
      for (let i = 0; i < numTags; i++) {
        const randomTag = commonTags[Math.floor(Math.random() * commonTags.length)];
        if (!tags.includes(randomTag)) {
          tags.push(randomTag);
        }
      }

      // Extract advisee names from group members
      const adviseeNames = project.group.members.map(member => 
        `${member.user.firstName} ${member.user.lastName}`
      );

      return {
        id: project.id,
        title: project.title,
        description: project.description || 'No description provided.',
        status: project.status,
        adviseeNames,
        startDate: project.createdAt.toISOString(),
        endDate: project.submissionDate?.toISOString(),
        tags
      };
    });

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching advised projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advised projects' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 