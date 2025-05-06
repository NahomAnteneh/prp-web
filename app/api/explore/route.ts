import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for search/filter parameters
const exploreQuerySchema = z.object({
  query: z.string().optional(),
  type: z.enum(['groups', 'projects', 'users']).optional().default('projects'),
  status: z.enum(['ACTIVE', 'SUBMITTED', 'COMPLETED', 'ARCHIVED']).optional(),
  advisorId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(['createdAt', 'title', 'name', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate and parse query parameters
    const validationResult = exploreQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      query,
      type,
      status,
      advisorId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Create ordering configuration
    const orderBy: any = { [sortBy]: sortOrder };

    // Define search conditions based on type
    let searchResults;
    let totalCount = 0;

    switch (type) {
      case 'projects':
        // Build filtering conditions
        const projectsWhere: any = {
          isPrivate: false, // Only show public projects
        };

        // Add text search if query is provided
        if (query) {
          projectsWhere.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Add status filter if provided
        if (status) {
          projectsWhere.status = status;
        }

        // Add advisor filter if provided
        if (advisorId) {
          projectsWhere.advisorId = advisorId;
        }

        // Get projects with count
        const projectsWithCount = await db.$transaction([
          db.project.count({ where: projectsWhere }),
          db.project.findMany({
            where: projectsWhere,
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  groupUserName: true,
                  leader: {
                    select: {
                      userId: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              advisor: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        totalCount = projectsWithCount[0];
        searchResults = projectsWithCount[1];
        break;

      case 'groups':
        // Build filtering conditions
        const groupsWhere: any = {};

        // Add text search if query is provided
        if (query) {
          groupsWhere.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { groupUserName: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Get groups with count
        const groupsWithCount = await db.$transaction([
          db.group.count({ where: groupsWhere }),
          db.group.findMany({
            where: groupsWhere,
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
              projects: {
                where: {
                  isPrivate: false, // Only include public projects
                },
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  projects: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        totalCount = groupsWithCount[0];
        searchResults = groupsWithCount[1];
        break;

      case 'users':
        // Build filtering conditions for users
        const usersWhere: any = {
          // Only include users that can be found in explore
          role: { in: ['ADVISOR', 'EVALUATOR', 'STUDENT'] },
        };

        // Add text search if query is provided
        if (query) {
          usersWhere.OR = [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { userId: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Get users with count
        const usersWithCount = await db.$transaction([
          db.user.count({ where: usersWhere }),
          db.user.findMany({
            where: usersWhere,
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              role: true,
              profileInfo: true,
              _count: {
                select: {
                  advisedProjects: true,
                  groupsMemberOf: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        totalCount = usersWithCount[0];
        searchResults = usersWithCount[1];
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid explore type' },
          { status: 400 }
        );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: searchResults,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error in explore API:', error);
    return NextResponse.json(
      { message: 'Error processing explore request' },
      { status: 500 }
    );
  }
} 