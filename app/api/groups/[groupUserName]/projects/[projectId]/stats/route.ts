import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

    const group = await prisma.group.findUnique({
        where: { groupUserName },
        select: { groupUserName: true },
      });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify the project exists and belongs to the group
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId, 
        groupUserName 
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to the specified group' },
        { status: 404 }
      );
    }

    // Fetch task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { id: true },
    });

    const tasks = {
      total: taskStats.reduce((sum, stat) => sum + stat._count.id, 0),
      byStatus: taskStats.reduce(
        (acc, stat) => ({
          ...acc,
          [stat.status]: stat._count.id,
        }),
        {} as Record<string, number>
      ),
    };

    // Fetch evaluation count
    const evaluationCount = await prisma.evaluation.count({
      where: { projectId },
    });

    // Fetch feedback statistics
    const feedbackStats = await prisma.feedback.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { id: true },
    });

    const feedback = {
      total: feedbackStats.reduce((sum, stat) => sum + stat._count.id, 0),
      byStatus: feedbackStats.reduce(
        (acc, stat) => ({
          ...acc,
          [stat.status]: stat._count.id,
        }),
        {} as Record<string, number>
      ),
    };

    // Fetch repositories linked to this project
    const projectRepositories = await prisma.projectRepository.findMany({
      where: { projectId },
      select: {
        repositoryName: true,
        groupUserName: true,
      },
    });

    // Create a list of repository conditions for merge requests and commits
    const repositoryConditions = projectRepositories.map(repo => ({
      name: repo.repositoryName,
      groupUserName: repo.groupUserName,
    }));

    // Fetch merge request statistics
    const mergeRequestStats = repositoryConditions.length > 0 ? await prisma.mergeRequest.groupBy({
      by: ['status'],
      where: {
        OR: repositoryConditions.map(repo => ({
          repositoryName: repo.name,
          repositoryGroup: repo.groupUserName,
        })),
      },
      _count: { id: true },
    }) : [];

    const mergeRequests = {
      total: mergeRequestStats.reduce((sum, stat) => sum + stat._count.id, 0),
      byStatus: mergeRequestStats.reduce(
        (acc, stat) => ({
          ...acc,
          [stat.status]: stat._count.id,
        }),
        {} as Record<string, number>
      ),
    };

    // Fetch commit count
    const commitCount = repositoryConditions.length > 0 ? await prisma.commit.count({
      where: {
        OR: repositoryConditions.map(repo => ({
          repositoryName: repo.name,
          repositoryGroup: repo.groupUserName,
        })),
      },
    }) : 0;

    // Fetch group member count
    const memberCount = await prisma.groupMember.count({
      where: { groupUserName },
    });

    // Construct the stats response
    const stats = {
      tasks,
      evaluations: { total: evaluationCount },
      feedback,
      mergeRequests,
      commits: { total: commitCount },
      members: { total: memberCount },
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}