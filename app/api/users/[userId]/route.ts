import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Define interface for profile info
interface ProfileInfo {
  department?: string;
  batchYear?: string;
  [key: string]: any; // Allow additional fields
}

// Validation schemas
const userIdSchema = z.string().min(1, 'User ID is required');

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  profileInfo: z.record(z.any()).optional(), // Allow any JSON object
  role: z.enum(['STUDENT', 'ADVISOR', 'EVALUATOR', 'ADMINISTRATOR']).optional(),
});

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

    // TODO: Add authentication check (e.g., verify user is self)
    // const user = req.user; // Example: Get user from auth middleware
    // if (user.userId !== userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

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

export async function PUT(
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

    // TODO: Add authentication check
    // const user = req.user;
    // if (user.userId !== userId && user.role !== 'ADMINISTRATOR') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Parse and validate request body
    const body = await req.json();
    const parsedBody = updateUserSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid input: ' + parsedBody.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, profileInfo, role } = parsedBody.data;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email },
        select: { userId: true },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (profileInfo) updateData.profileInfo = profileInfo;
    if (role) updateData.role = role as Role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { userId },
      data: updateData,
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileInfo: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user data:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // TODO: Add authentication check (admin only)
    // const user = req.user;
    // if (user.role !== 'ADMINISTRATOR') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    await db.user.delete({
      where: { userId },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}