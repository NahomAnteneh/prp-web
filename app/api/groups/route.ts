import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Retrieve all groups (with filtering capabilities)
export async function GET(req: NextRequest) {
  try {
    // URL query parameters for filtering
    const url = new URL(req.url);
    const nameFilter = url.searchParams.get('name');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build filter condition
    const whereCondition: Record<string, unknown> = {};
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
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
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
    // Parse request data
    const rawData = await req.json();
    const { name, groupUserName, description } = rawData;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the group name is already taken
    const existingGroup = await db.group.findUnique({
      where: { groupUserName },
    });

    if (existingGroup) {
      return NextResponse.json(
        { message: 'A group with this group username already exists' },
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

    // Create the group
    const group = await db.group.create({
      data: {
        name,
        groupUserName,
        description,
        leader: {
          connect: {
            userId: session.user.userId,
          },
        },
        members: {
          create: {
            userId: session.user.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
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