import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET: Search for groups with advanced filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get search parameters from URL
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const hasMember = url.searchParams.get('hasMember');
    const hasProjects = url.searchParams.get('hasProjects') === 'true';
    const hasRepositories = url.searchParams.get('hasRepositories') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build filter conditions
    let whereConditions: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Add member filter if specified
    if (hasMember) {
      whereConditions.members = {
        some: {
          userId: hasMember,
        },
      };
    }

    // Add project filter if specified
    if (hasProjects) {
      whereConditions.projects = {
        some: {},
      };
    }

    // Add repository filter if specified
    if (hasRepositories) {
      whereConditions.repositories = {
        some: {},
      };
    }

    // Count total matching groups for pagination
    const totalGroups = await db.group.count({
      where: whereConditions,
    });

    // Fetch the groups with filtering, pagination, and include relations
    const groups = await db.group.findMany({
      where: whereConditions,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
            repositories: true,
          },
        },
        members: {
          take: 5, // Just include a few members to keep response size reasonable
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
      orderBy: [
        { name: 'asc' },
      ],
      take: limit,
      skip: skip,
    });

    // Format the response for better client-side consumption
    const formattedGroups = groups.map((group: {
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      leaderId: string;
      leader: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
      };
      _count: {
        members: number;
        projects: number;
        repositories: number;
      };
      members: Array<{
        user: {
          id: string;
          firstName: string;
          lastName: string;
          username: string;
        }
      }>;
    }) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      leader: group.leader,
      stats: {
        memberCount: group._count.members,
        projectCount: group._count.projects,
        repositoryCount: group._count.repositories,
      },
      recentMembers: group.members.map((member: {
        user: {
          id: string;
          firstName: string;
          lastName: string;
          username: string;
        }
      }) => ({
        id: member.user.id,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        username: member.user.username,
        isLeader: member.user.id === group.leaderId,
      })),
    }));

    return NextResponse.json({
      groups: formattedGroups,
      pagination: {
        total: totalGroups,
        pages: Math.ceil(totalGroups / limit),
        currentPage: page,
        limit,
      },
      filters: {
        query,
        hasMember: hasMember || null,
        hasProjects,
        hasRepositories,
      },
    });
  } catch (error) {
    console.error('Error searching groups:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 