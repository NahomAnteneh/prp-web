import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
            firstName: true,
            lastName: true,
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(topRepositories);
  } catch (error) {
    console.error('Error fetching top repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top repositories' },
      { status: 500 }
    );
  }
} 