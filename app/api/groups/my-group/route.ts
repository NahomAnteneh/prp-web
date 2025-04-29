import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the user's group membership
    const membership = await db.groupMember.findFirst({
      where: { userId : session.user.id },
      include: {
        group: {
          include: {
            members: {
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
            project: {
              select: {
                id: true,
                title: true,
                advisorId: true,
                advisor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true, 
                    username: true,
                    profileInfo: true,
                  },
                },
              },
            },
            advisorRequests: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                requestedAdvisorId: true,
                requestMessage: true,
                requestedAdvisor: {
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
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: 'You are not a member of any group' },
        { status: 404 }
      );
    }

    return NextResponse.json(membership.group);
  } catch (error) {
    console.error('Error fetching user group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 