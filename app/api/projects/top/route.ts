import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const topProjects = await prisma.project.findMany({
      where: {
        archived: false,
        isPrivate: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(topProjects);
  } catch (error) {
    console.error('Error fetching top projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top projects' },
      { status: 500 }
    );
  }
} 