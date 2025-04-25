import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Define the repository type
interface Repository {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  updatedAt: Date;
  defaultBranchRef: {
    name: string;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    const session = await getServerSession(authOptions);
    
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            idNumber: true,
            department: true,
            batchYear: true,
            bio: true,
            skills: true
          }
        },
        repositories: {
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
            updatedAt: true,
            defaultBranchRef: {
              select: {
                name: true
              }
            }
          },
          take: 5,
          orderBy: {
            updatedAt: 'desc'
          }
        },
        groups: {
          select: {
            group: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          },
          take: 3
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            updatedAt: true
          },
          take: 4,
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine if the viewer is the profile owner
    const isProfileOwner = session?.user?.id === user.id;
    
    // Remove email for non-owners unless they're an admin/advisor
    if (!isProfileOwner && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'ADVISOR') {
      user.email = undefined;
    }

    // Remove private repositories if not the owner or admin
    if (!isProfileOwner && session?.user?.role !== 'ADMIN') {
      user.repositories = user.repositories.filter((repo: Repository) => !repo.isPrivate);
    }

    return NextResponse.json({
      user,
      viewer: {
        isLoggedIn: !!session,
        isProfileOwner,
        role: session?.user?.role || null
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 