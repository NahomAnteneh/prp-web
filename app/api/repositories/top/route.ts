import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatTimeAgo } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const topRepositories = await prisma.repository.findMany({
      where: {
        isPrivate: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        owner: {
          select: {
            name: true,
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
    });

    const formattedRepositories = topRepositories.map(repo => ({
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
        groupUserName: repo.groupUserName,
      },
      stats: {
        commits: repo._count.commits,
        branches: repo._count.branches,
        projects: repo._count.projects,
      },
    }));

    return NextResponse.json(formattedRepositories);
  } catch (error) {
    console.error('Error fetching top repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top repositories' },
      { status: 500 }
    );
  }
} 