import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Define interface for profile info
interface ProfileInfo {
  department?: string;
  batchYear?: string;
  [key: string]: any; // Allow additional fields
}

// Validation schemas
const userIdSchema = z.string().min(1, 'User ID is required');

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  try {
    // Handle params as either direct object or promise
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.userId;

    // Validate userId
    const parsedParams = userIdSchema.safeParse(userId);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user data with group details
    const user = await db.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileInfo: true,
        createdAt: true,
        updatedAt: true,
        groupsLed: {
          select: {
            groupUserName: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
        groupsMemberOf: {
          select: {
            group: {
              select: {
                groupUserName: true,
                name: true,
                description: true,
                createdAt: true,
                _count: {
                  select: {
                    repositories: true,
                  }
                }
              },
            },
            joinedAt: true,
          },
        },
        _count: {
          select: {
            groupsMemberOf: true,
            advisedProjects: true,
            commitsAuthored: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format response
    const safeProfileInfo = (user.profileInfo || {}) as ProfileInfo;
    const userResponse = {
      userId: user.userId,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profileInfo: safeProfileInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      groups: {
        led: user.groupsLed,
        memberOf: user.groupsMemberOf.map((gm) => ({
          ...gm.group,
          joinedAt: gm.joinedAt,
        })),
      },
      stats: {
        groups: user._count.groupsMemberOf,
        advisedProjects: user._count.advisedProjects,
        commits: user._count.commitsAuthored,
      },
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 