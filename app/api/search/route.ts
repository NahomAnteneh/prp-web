import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for search parameters
const searchQuerySchema = z.object({
  query: z.string().optional(),
  type: z.enum(['groups', 'projects', 'users', 'repositories', 'students', 'advisors']).optional().default('projects'),
  status: z.string().optional(),
  advisorId: z.string().optional(),
  batch: z.string().optional(),
  dept: z.string().optional(),
  role: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(['createdAt', 'title', 'name', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type map for response
const typeToResultType = {
  projects: 'project',
  repositories: 'repository',
  groups: 'group',
  users: 'user',
  students: 'student',
  advisors: 'advisor',
} as const;

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validationResult = searchQuerySchema.safeParse(queryParams);
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
      batch,
      dept,
      role,
      page,
      limit,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const orderBy: any = { [sortBy]: sortOrder };

    // Define search conditions based on type
    let searchResults;
    let totalCount = 0;

    switch (type) {
      case 'projects':
        // Build project search conditions
        const projectWhere: any = {
          isPrivate: false, // Only public projects
        };

        // Text search
        if (query) {
          projectWhere.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Status filter
        if (status && status.trim() !== '') {
          projectWhere.status = status;
        }

        // Advisor filter
        if (advisorId) {
          projectWhere.advisorId = advisorId;
        }

        // Execute search transaction with optimized includes
        const projectResults = await db.$transaction([
          db.project.count({ where: projectWhere }),
          db.project.findMany({
            where: projectWhere,
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  groupUserName: true,
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

        totalCount = projectResults[0];
        searchResults = projectResults[1];
        break;

      case 'repositories':
        // Build repository search conditions
        const repoWhere: any = {
          isPrivate: false, // Only public repositories
        };

        // Text search
        if (query) {
          repoWhere.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Execute search with aggregation
        const repoResults = await db.$transaction([
          db.repository.count({ where: repoWhere }),
          db.repository.findMany({
            where: repoWhere,
            include: {
              owner: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
                },
              },
              group: {
                select: {
                  id: true,
                  name: true,
                  groupUserName: true,
                },
              },
              _count: {
                select: {
                  commits: true,
                  branches: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        totalCount = repoResults[0];
        searchResults = repoResults[1];
        break;

      case 'groups':
        // Build group search conditions
        const groupWhere: any = {};

        // Text search
        if (query) {
          groupWhere.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { groupUserName: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Execute search with aggregation
        const groupResults = await db.$transaction([
          db.group.count({ where: groupWhere }),
          db.group.findMany({
            where: groupWhere,
            include: {
              leader: {
                select: {
                  userId: true,
                  firstName: true,
                  lastName: true,
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

        totalCount = groupResults[0];
        searchResults = groupResults[1];
        break;

      case 'students':
        // Build student search conditions
        const studentWhere: any = {
          role: 'STUDENT',
        };

        // Text search
        if (query) {
          studentWhere.OR = [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { userId: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Batch filter - only apply if not empty
        if (batch && batch.trim() !== '') {
          studentWhere.profileInfo = {
            path: ['batchYear'],
            equals: batch,
          };
        }

        // Department filter - only apply if not empty
        if (dept && dept.trim() !== '') {
          if (studentWhere.profileInfo) {
            // If we already have a profileInfo filter, we need to use AND logic
            studentWhere.AND = [
              {
                profileInfo: {
                  path: ['department'],
                  equals: dept,
                }
              }
            ];
          } else {
            studentWhere.profileInfo = {
              path: ['department'],
              equals: dept,
            };
          }
        }

        // Execute search
        const studentResults = await db.$transaction([
          db.user.count({ where: studentWhere }),
          db.user.findMany({
            where: studentWhere,
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileInfo: true,
              _count: {
                select: {
                  groupsMemberOf: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        totalCount = studentResults[0];
        searchResults = studentResults[1];
        break;

      case 'advisors':
        // Build advisor search conditions
        const advisorWhere: any = {
          role: 'ADVISOR',
        };

        // Text search
        if (query) {
          advisorWhere.OR = [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { userId: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Department filter - only apply if not empty
        if (dept && dept.trim() !== '') {
          advisorWhere.profileInfo = {
            path: ['department'],
            equals: dept,
          };
        }

        // Execute search
        const advisorResults = await db.$transaction([
          db.user.count({ where: advisorWhere }),
          db.user.findMany({
            where: advisorWhere,
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              profileInfo: true,
              _count: {
                select: {
                  advisedProjects: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
        ]);

        totalCount = advisorResults[0];
        searchResults = advisorResults[1];
        break;

      case 'users':
        // Build users search conditions
        const userWhere: any = {
          // Only include user roles that can be found in search
          role: { in: ['ADVISOR', 'EVALUATOR', 'STUDENT'] },
        };

        // Text search
        if (query) {
          userWhere.OR = [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { userId: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ];
        }

        // Role filter - only apply if not empty
        if (role && role.trim() !== '') {
          const roles = role.split(',');
          const mappedRoles = roles
            .map(r => {
              const upperRole = r.toUpperCase();
              if (['STUDENT', 'ADVISOR', 'EVALUATOR'].includes(upperRole)) {
                return upperRole;
              }
              return null;
            })
            .filter(Boolean) as string[];
          
          if (mappedRoles.length > 0) {
            userWhere.role = { in: mappedRoles };
          }
        }

        // Batch filter
        if (batch && batch.trim() !== '') {
          userWhere.profileInfo = {
            path: ['batchYear'],
            equals: batch,
          };
        }

        // Department filter
        if (dept && dept.trim() !== '') {
          if (userWhere.profileInfo) {
            // If we already have a profileInfo filter, we need to use AND logic
            userWhere.AND = [
              {
                profileInfo: {
                  path: ['department'],
                  equals: dept,
                }
              }
            ];
          } else {
            userWhere.profileInfo = {
              path: ['department'],
              equals: dept,
            };
          }
        }

        // Execute search
        const userResults = await db.$transaction([
          db.user.count({ where: userWhere }),
          db.user.findMany({
            where: userWhere,
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
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

        totalCount = userResults[0];
        searchResults = userResults[1];
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid search type' },
          { status: 400 }
        );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit) || 1; // Ensure at least 1 page
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // --- New: Get counts for all categories for sidebar badges ---
    const sidebarCounts = await db.$transaction([
      db.project.count({ where: query ? { OR: [ { title: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } } ] } : {} }),
      db.repository.count({ where: query ? { OR: [ { name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } } ] } : {} }),
      db.group.count({ where: query ? { OR: [ { name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }, { groupUserName: { contains: query, mode: 'insensitive' } } ] } : {} }),
      db.user.count({ where: { role: { in: ['STUDENT'] }, ...(query ? { OR: [ { firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }, { userId: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } } ] } : {}) } }),
      db.user.count({ where: { role: { in: ['ADVISOR'] }, ...(query ? { OR: [ { firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }, { userId: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } } ] } : {}) } }),
      db.user.count({ where: { role: { in: ['ADVISOR', 'EVALUATOR', 'STUDENT'] }, ...(query ? { OR: [ { firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }, { userId: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } } ] } : {}) } }),
    ]);

    return NextResponse.json({
      data: searchResults,
      type: typeToResultType[type],
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      meta: {
        query,
        type,
        filters: {
          status,
          advisorId,
          batch,
          dept,
          role,
        },
        sidebarCounts: {
          projects: sidebarCounts[0],
          repositories: sidebarCounts[1],
          groups: sidebarCounts[2],
          students: sidebarCounts[3],
          advisors: sidebarCounts[4],
          users: sidebarCounts[5],
        }
      }
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { message: 'Error processing search request', error: (error as Error).message },
      { status: 500 }
    );
  }
} 