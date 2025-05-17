import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatTimeAgo } from '@/lib/utils';
import { z } from 'zod';
import type { Role } from '@prisma/client';

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

// Helper to create text search conditions
function createTextSearchCondition(query: string | undefined, fields: string[]): any[] {
  if (!query || query.trim() === '') return [];
  
  return fields.map(field => ({
    [field]: { contains: query, mode: 'insensitive' }
  }));
}

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Create a cache key from the query parameters for potential HTTP caching
    const cacheKey = JSON.stringify(queryParams);
    
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
    
    // Keep track of all query promises to execute them in parallel where possible
    let countPromises: Promise<any>[] = [];
    
    // Efficient helper functions for filtering
    const addBatchFilter = (where: any, batchValue?: string) => {
      if (batchValue && batchValue.trim() !== '') {
        if (!where.profileInfo) {
          where.profileInfo = {};
        }
        where.profileInfo.path = ['batchYear'];
        where.profileInfo.equals = batchValue;
      }
      return where;
    };
    
    const addDeptFilter = (where: any, deptValue?: string) => {
      if (deptValue && deptValue.trim() !== '') {
        if (where.profileInfo) {
          // If we already have a profileInfo filter, use AND logic
          where.AND = [
            {
              profileInfo: {
                path: ['department'],
                equals: deptValue,
              }
            }
          ];
        } else {
          where.profileInfo = {
            path: ['department'],
            equals: deptValue,
          };
        }
      }
      return where;
    };

    switch (type) {
      case 'projects':
        // Build project search conditions
        const projectWhere: any = {
          isPrivate: false, // Only public projects
        };

        // Text search
        if (query) {
          projectWhere.OR = createTextSearchCondition(query, ['title', 'description']);
        }

        // Status filter
        if (status && status.trim() !== '') {
          projectWhere.status = status;
        }

        // Advisor filter
        if (advisorId) {
          projectWhere.advisorId = advisorId;
        }

        // Execute search in parallel
        const [projectCount, projectData] = await Promise.all([
          db.project.count({ where: projectWhere }),
          db.project.findMany({
            where: projectWhere,
            include: {
              group: {
                select: {
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
          })
        ]);

        totalCount = projectCount;
        searchResults = projectData;
        break;

      case 'repositories':
        // Build repository search conditions
        const repoWhere: any = {
          isPrivate: false, // Only public repositories
        };

        // Text search
        if (query) {
          repoWhere.OR = createTextSearchCondition(query, ['name', 'description']);
        }

        // Execute search in parallel
        const [repoCount, repoData] = await Promise.all([
          db.repository.count({ where: repoWhere }),
          db.repository.findMany({
            where: repoWhere,
            include: {
              owner: {
                select: {
                  name: true,
                  leaderId: true,
                },
              },
              _count: {
                select: {
                  commits: true,
                  branches: true,
                  projects: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          })
        ]);

        // Format repositories to match our standard format
        const formattedRepos = repoData.map(repo => ({
          name: repo.name,
          description: repo.description,
          isPrivate: repo.isPrivate,
          createdAt: repo.createdAt,
          updatedAt: repo.updatedAt,
          lastActivity: formatTimeAgo(repo.updatedAt),
          ownerId: repo.ownerId,
          groupUserName: repo.groupUserName,
          group: {
            name: repo.owner.name,
            leaderId: repo.owner.leaderId,
          },
          stats: {
            commits: repo._count.commits,
            branches: repo._count.branches,
            projects: repo._count.projects,
          },
        }));

        totalCount = repoCount;
        searchResults = formattedRepos;
        break;

      case 'groups':
        // Build group search conditions
        const groupWhere: any = {};

        // Text search
        if (query) {
          groupWhere.OR = createTextSearchCondition(query, ['name', 'description', 'groupUserName']);
        }

        // Execute search in parallel
        const [groupCount, groupData] = await Promise.all([
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
          })
        ]);

        totalCount = groupCount;
        searchResults = groupData;
        break;

      case 'students':
        // Build student search conditions
        const studentWhere: any = {
          role: 'STUDENT',
        };

        // Text search
        if (query) {
          studentWhere.OR = createTextSearchCondition(query, ['firstName', 'lastName', 'userId', 'email']);
        }

        // Apply filters
        addBatchFilter(studentWhere, batch);
        addDeptFilter(studentWhere, dept);

        // Execute search in parallel
        const [studentCount, studentData] = await Promise.all([
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
          })
        ]);

        totalCount = studentCount;
        searchResults = studentData;
        break;

      case 'advisors':
        // Build advisor search conditions
        const advisorWhere: any = {
          role: 'ADVISOR',
        };

        // Text search
        if (query) {
          advisorWhere.OR = createTextSearchCondition(query, ['firstName', 'lastName', 'userId', 'email']);
        }

        // Apply filters
        addDeptFilter(advisorWhere, dept);

        // Execute search in parallel
        const [advisorCount, advisorData] = await Promise.all([
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
          })
        ]);

        totalCount = advisorCount;
        searchResults = advisorData;
        break;

      case 'users':
        // Build users search conditions
        const userWhere: any = {
          // Only include user roles that can be found in search
          role: { in: ['ADVISOR', 'EVALUATOR', 'STUDENT'] },
        };

        // Text search
        if (query) {
          userWhere.OR = createTextSearchCondition(query, ['firstName', 'lastName', 'userId', 'email']);
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

        // Apply filters
        addBatchFilter(userWhere, batch);
        addDeptFilter(userWhere, dept);

        // Execute search in parallel
        const [userCount, userData] = await Promise.all([
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
          })
        ]);

        totalCount = userCount;
        searchResults = userData;
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

    // Only compute sidebar counts when on first page or explicitly requested
    // This avoids unnecessary counts on pagination
    if (page > 1 && !queryParams.includeCounts) {
      // Return response without sidebar counts for better performance during pagination
      const response = NextResponse.json({
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
          }
        }
      });
      
      // Add cache header for 1 minute
      response.headers.set('Cache-Control', 'public, max-age=60');
      return response;
    }

    // Compute sidebar counts for all categories in parallel for efficiency
    const projectFilter = query ? {
      OR: createTextSearchCondition(query, ['title', 'description']),
      isPrivate: false
    } : { isPrivate: false };

    const repoFilter = query ? {
      OR: createTextSearchCondition(query, ['name', 'description']),
      isPrivate: false
    } : { isPrivate: false };

    const groupFilter = query ? {
      OR: createTextSearchCondition(query, ['name', 'description', 'groupUserName']),
    } : {};

    const studentFilter = {
      role: 'STUDENT' as Role,
      ...(query && { OR: createTextSearchCondition(query, ['firstName', 'lastName', 'userId', 'email']) })
    };

    const advisorFilter = {
      role: 'ADVISOR' as Role,
      ...(query && { OR: createTextSearchCondition(query, ['firstName', 'lastName', 'userId', 'email']) })
    };

    const userRoles: Role[] = ['STUDENT', 'ADVISOR', 'EVALUATOR'];
    const userFilter = {
      role: { in: userRoles },
      ...(query && { OR: createTextSearchCondition(query, ['firstName', 'lastName', 'userId', 'email']) })
    };

    // Run all sidebar count queries in parallel
    const [
      projectCount,
      repoCount,
      groupCount,
      studentCount,
      advisorCount,
      userCount
    ] = await Promise.all([
      db.project.count({ where: projectFilter }),
      db.repository.count({ where: repoFilter }),
      db.group.count({ where: groupFilter }),
      db.user.count({ where: studentFilter }),
      db.user.count({ where: advisorFilter }),
      db.user.count({ where: userFilter })
    ]);

    // Create the response with full data including sidebar counts
    const response = NextResponse.json({
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
          projects: projectCount,
          repositories: repoCount,
          groups: groupCount,
          students: studentCount,
          advisors: advisorCount,
          users: userCount,
        }
      }
    });
    
    // Add cache headers - 60 seconds for search results
    response.headers.set('Cache-Control', 'public, max-age=60');
    
    return response;
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { message: 'Error processing search request', error: (error as Error).message },
      { status: 500 }
    );
  }
} 