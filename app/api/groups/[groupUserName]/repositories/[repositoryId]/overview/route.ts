import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; repositoryId: string } }
) {
  try {
    // Validate params
    const { groupUserName, repositoryId } = await params;
    if (!groupUserName || !repositoryId) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Verify the group exists
    const group = await prisma.group.findUnique({
      where: { groupUserName },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify the repository exists and belongs to the group
    const repository = await prisma.repository.findUnique({
      where: { 
        name_groupUserName: {
          name: repositoryId, // repositoryId param is actually the repository name
          groupUserName,
        }
      },
    });

    console.log('Repository:', repository);

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found or does not belong to the specified group' },
        { status: 404 }
      );
    }

    // Fetch repositories associated with the repository
    const repositories = await prisma.repository.findMany({
      where: {
        projects: {
          some: { 
            repositoryName: repository.name,
            groupUserName: repository.groupUserName, 
          },
        },
      },
      include: {
        owner: {
          select: {
            name: true,
            leaderId: true,
          },
        },
        branches: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            commits: true,
            branches: true,
          },
        },
      },
    });

    // Fetch contributors for each repository
    const formattedRepos = await Promise.all(
      repositories.map(async (repo) => {
        const contributors = await prisma.commit.findMany({
          where: {
            repositoryName: repo.name,
            repositoryGroup: repo.groupUserName,
          },
          select: {
            author: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          distinct: ['authorId'],
          take: 10,
        });

        // Find default branch (usually "main" or "master")
        const defaultBranch =
          repo.branches.find((b) => b.name === 'main') ||
          repo.branches.find((b) => b.name === 'master') ||
          repo.branches[0];

        return {
          name: repo.name,
          groupUserName: repo.groupUserName,
          description: repo.description,
          isPrivate: repo.isPrivate,
          owner: repo.owner
            ? {
                name: repo.owner.name,
                leaderId: repo.owner.leaderId,
              }
            : null,
          stats: {
            commits: repo._count.commits,
            branches: repo._count.branches,
          },
          defaultBranch: defaultBranch
            ? {
                id: defaultBranch.id,
                name: defaultBranch.name,
              }
            : null,
          branches: repo.branches,
          contributors: contributors.map((c) => c.author),
        };
      })
    );

    return NextResponse.json(formattedRepos, { status: 200 });
  } catch (error) {
    console.error('Error fetching project repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}