import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma client
const prisma = new PrismaClient();

// GET: List all projects for a user (member or advisor)
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  try {
    // Handle params
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.userId;

    // Validate userId
    const userIdSchema = z.string().min(1, 'User ID is required');
    const parsedUserId = userIdSchema.safeParse(userId);
    if (!parsedUserId.success) {
      return NextResponse.json(
        { message: 'Invalid user ID format', projects: [] },
        { status: 400 }
      );
    }

    // Fetch projects where user is a group member or advisor
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            group: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          {
            advisorId: userId,
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        submissionDate: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        advisorId: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true,
            groupUserName: true,
          },
        },
        advisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            score: true,
            createdAt: true,
          },
        },
        feedback: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            authorId: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            repositories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format response
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description || '',
      status: project.status,
      submissionDate: project.submissionDate,
      archived: project.archived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      group: {
        id: project.group.id,
        name: project.group.name,
        groupUserName: project.group.groupUserName,
      },
      advisor: project.advisor
        ? {
            id: project.advisor.userId,
            name: `${project.advisor.firstName} ${project.advisor.lastName}`,
          }
        : null,
      stats: {
        tasks: project._count.tasks,
        repositories: project._count.repositories,
        evaluations: project.evaluations.length,
        feedback: project.feedback.length,
      },
      evaluations: project.evaluations,
      feedback: project.feedback,
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { message: `Database error: ${error.message}`, projects: [] },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error', projects: [] },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}