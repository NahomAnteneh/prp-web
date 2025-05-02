import { NextRequest, NextResponse } from 'next/server';
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
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
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

    // Create the group
    const group = await db.group.create({
      data: {
        name,
        description,
        members: {
          create: {},
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