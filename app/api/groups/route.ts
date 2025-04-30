import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for group creation
const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required'),
  description: z.string().optional(),
});

// GET: Retrieve all groups (with filtering capabilities)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // URL query parameters for filtering
    const url = new URL(req.url);
    const nameFilter = url.searchParams.get('name');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build filter condition
    const whereCondition: any = {};
    if (nameFilter) {
      whereCondition.name = {
        contains: nameFilter,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    // Get total count for pagination
    const totalGroups = await db.group.count({
      where: whereCondition,
    });

    // Query groups with filtering, pagination, and data relations
    const groups = await db.group.findMany({
      where: whereCondition,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            repositories: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
    });

    return NextResponse.json({
      groups,
      pagination: {
        total: totalGroups,
        pages: Math.ceil(totalGroups / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new group
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

    // Parse and validate request data
    const rawData = await req.json();
    const validationResult = createGroupSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { name, description } = validationResult.data;

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
                firstName: true,
                lastName: true,
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 