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

    // Get all evaluations for projects advised by this advisor
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

    // Calculate average rating and distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    let totalScore = 0;
    let ratingCount = 0;

    evaluations.forEach(evaluation => {
      if (evaluation.score !== null) {
        // Round the score to nearest integer 1-5
        const roundedScore = Math.min(5, Math.max(1, Math.round(evaluation.score)));
        ratingDistribution[roundedScore as 1|2|3|4|5]++;
        totalScore += evaluation.score;
        ratingCount++;
      }
    });

    const averageRating = ratingCount > 0 ? totalScore / ratingCount : 0;

    return NextResponse.json({
      averageRating,
      totalReviews: ratingCount,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 