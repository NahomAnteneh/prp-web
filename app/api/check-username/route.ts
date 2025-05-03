import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Input validation schema using Zod
const checkUsernameSchema = z.object({
  groupUserName: z.string().min(1, 'Group username is required').max(255, 'Group username is too long'),
});

// POST /api/check-username
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { groupUserName } = checkUsernameSchema.parse(body);

    // Check if groupUserName exists in the Group table
    const existingGroup = await prisma.group.findUnique({
      where: { groupUserName },
      select: { id: true }, // Minimal select to optimize query
    });

    // Return response based on whether the groupUserName is taken
    if (existingGroup) {
      return NextResponse.json(
        {
          isAvailable: false,
          message: 'Group username is already taken',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isAvailable: true,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          isAvailable: false,
          message: 'Invalid input: ' + error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    // Handle other errors (e.g., database issues)
    console.error('Error checking group username:', error);
    return NextResponse.json(
      {
        isAvailable: false,
        message: 'Failed to check username availability. Please try again.',
      },
      { status: 500 }
    );
  } finally {
    // Disconnect Prisma Client to prevent connection leaks
    await prisma.$disconnect();
  }
}