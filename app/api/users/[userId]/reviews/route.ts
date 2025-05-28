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

    // Get evaluations for projects advised by this advisor
    const evaluations = await prisma.evaluation.findMany({
      where: {
        project: {
          advisorId: userId
        }
      },
      select: {
        id: true,
        score: true,
        comments: true,
        createdAt: true,
        authorId: true,
        projectId: true,
        project: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For each evaluation, fetch the author's name
    const reviewsPromises = evaluations.map(async (evaluation) => {
      const author = await prisma.user.findUnique({
        where: { userId: evaluation.authorId },
        select: {
          firstName: true,
          lastName: true
        }
      });

      // Generate a simple helpful count (just for demo)
      const helpfulCount = Math.floor(Math.random() * 10);

      return {
        id: evaluation.id,
        authorId: evaluation.authorId,
        authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown User',
        rating: evaluation.score || 3, // Default to 3 if no score
        comment: evaluation.comments || "No detailed feedback provided.",
        projectTitle: evaluation.project.title,
        date: evaluation.createdAt.toISOString(),
        helpfulCount: helpfulCount,
        // Random flag for userHasMarkedHelpful for demo purposes
        userHasMarkedHelpful: Math.random() > 0.5
      };
    });

    const reviews = await Promise.all(reviewsPromises);

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 