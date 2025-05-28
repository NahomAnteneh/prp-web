import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.enum(['firstName', 'lastName', 'updatedAt']).optional().default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  expertise: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Validate query parameters
    const validationResult = querySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      sortBy,
      sortOrder,
      expertise,
    } = validationResult.data;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Check if there's a system rule for maximum projects per advisor
    let maxProjectsPerAdvisor = 5; // Default value
    try {
      const rule = await db.rule.findFirst();
      if (rule && rule.maxProjectsPerAdvisor) {
        maxProjectsPerAdvisor = rule.maxProjectsPerAdvisor;
      }
    } catch (error) {
      console.warn('Could not fetch maxProjectsPerAdvisor rule, using default value:', error);
      // Continue with default value if we can't get the rule
    }

    // Build the where clause
    const where: any = {
      role: 'ADVISOR',
    };

    // Add expertise filter if provided
    if (expertise) {
      where.profileInfo = {
        path: ['expertise'],
        array_contains: expertise,
      };
    }

    // Get the count of advisors
    const count = await db.user.count({
      where,
    });

    // Get advisors with their current project count
    const advisors = await db.user.findMany({
      where,
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        profileInfo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            advisedProjects: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Filter for advisors who have capacity for new projects
    const availableAdvisors = advisors.map(advisor => {
      const currentProjects = advisor._count.advisedProjects;
      const isAvailable = currentProjects < maxProjectsPerAdvisor;
      const availableSlots = maxProjectsPerAdvisor - currentProjects;
      
      return {
        userId: advisor.userId,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        profileInfo: advisor.profileInfo,
        currentProjects,
        isAvailable,
        availableSlots,
        updatedAt: advisor.updatedAt,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: availableAdvisors,
      pagination: {
        totalCount: count,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    // console.error('Error fetching available advisors:', error);
    return NextResponse.json(
      { message: 'Error fetching available advisors' },
      { status: 500 }
    );
  }
}