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

    // Get current advisees count
    const currentAdvisees = await prisma.project.count({
      where: {
        advisorId: userId,
        status: 'ACTIVE',
      }
    });

    // Get completed projects count
    const completedProjects = await prisma.project.count({
      where: {
        advisorId: userId,
        status: 'COMPLETED',
      }
    });

    // Get years of experience (using a placeholder formula - in a real app you might have this in profileInfo)
    // For demonstration, we'll calculate this based on when the user was created
    const userCreationDate = await prisma.user.findUnique({
      where: { userId },
      select: { createdAt: true }
    });
    
    const currentYear = new Date().getFullYear();
    const creationYear = userCreationDate?.createdAt.getFullYear() || currentYear;
    const yearsExperience = currentYear - creationYear + 1; // +1 to include current year

    // Get average rating
    const evaluations = await prisma.evaluation.findMany({
      where: {
        project: {
          advisorId: userId
        }
      },
      select: {
        score: true
      }
    });

    let totalRating = 0;
    let ratingCount = 0;

    evaluations.forEach(evaluation => {
      if (evaluation.score !== null) {
        totalRating += evaluation.score;
        ratingCount++;
      }
    });

    const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    return NextResponse.json({
      currentAdvisees,
      completedProjects,
      yearsExperience,
      avgRating
    });
  } catch (error) {
    console.error('Error fetching advisor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advisor statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 