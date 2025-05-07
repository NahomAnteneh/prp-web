import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Updated parameter parsing to correctly handle groupId and repositoryId
const paramsSchema = z.object({
  groupId: z.string().min(1),
  repositoryId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string; repositoryId: string } }
) {
  try {
    // Validate params
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { groupId, repositoryId } = parsedParams.data;

    const realGroupId = await prisma.group.findUnique({
      where: { groupUserName: groupId },
      select: { id: true },
    });

    // Verify the repository exists and belongs to the group
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId, groupId: realGroupId?.id },
      select: { id: true },
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
          some: { repositoryId },
        },
      },
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
      repositories.map(async (repository) => {
        const contributors = await prisma.commit.findMany({
          where: {
            repositoryId: repository.id,
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
          repository.branches.find((b) => b.name === 'main') ||
          repository.branches.find((b) => b.name === 'master') ||
          repository.branches[0];

        return {
          id: repository.id,
          name: repository.name,
          description: repository.description,
          isPrivate: repository.isPrivate,
          owner: repository.owner,
          group: repository.group
            ? {
                id: repository.group.id,
                name: repository.group.name,
              }
            : null,
          stats: {
            commits: repository._count.commits,
            branches: repository._count.branches,
          },
          defaultBranch: defaultBranch
            ? {
                id: defaultBranch.id,
                name: defaultBranch.name,
              }
            : null,
          branches: repository.branches,
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