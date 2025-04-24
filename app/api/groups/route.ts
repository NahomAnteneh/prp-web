import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only students can create groups
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { message: 'Only students can create groups' },
        { status: 403 }
      );
    }

    // Check if user is already in a group
    const existingMembership = await db.groupMember.findFirst({
      where: { userId: user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'You are already a member of a group' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const { name, description } = data;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { message: 'Group name is required' },
        { status: 400 }
      );
    }

    // Check if the group name is already taken
    const existingGroup = await db.group.findUnique({
      where: { name },
    });

    if (existingGroup) {
      return NextResponse.json(
        { message: 'A group with this name already exists' },
        { status: 400 }
      );
    }

    // Get the maximum group size from rules
    let maxGroupSize = 5; // Default to 5
    try {
      const rules = await db.rule.findFirst();
      if (rules) {
        maxGroupSize = rules.maxGroupSize;
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      // Continue with default maxGroupSize
    }

    // Create the group and add the user as both leader and member
    const group = await db.group.create({
      data: {
        name,
        description,
        leaderId: user.id,
        members: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Group created successfully',
      group,
      maxGroupSize,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 