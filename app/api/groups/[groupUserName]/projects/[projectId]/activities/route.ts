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
      select: { id: true, groupUserName: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to the specified group' },
        { status: 404 }
      );
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    // Fetch evaluations
    const evaluations = await prisma.evaluation.findMany({
      where: { projectId },
      select: {
        id: true,
        comments: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });

    // Fetch feedback
    const feedback = await prisma.feedback.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });

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

    // Fetch merge requests (via project repositories)
    const mergeRequests = repositoryConditions.length > 0 ? await prisma.mergeRequest.findMany({
      where: {
        OR: repositoryConditions.map(repo => ({
          repositoryName: repo.name,
          repositoryGroup: repo.groupUserName,
        })),
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        creator: { select: { firstName: true, lastName: true } },
      },
    }) : [];

    // Fetch commits (via project repositories)
    const commits = repositoryConditions.length > 0 ? await prisma.commit.findMany({
      where: {
        OR: repositoryConditions.map(repo => ({
          repositoryName: repo.name,
          repositoryGroup: repo.groupUserName,
        })),
      },
      select: {
        id: true,
        message: true,
        timestamp: true,
        author: { select: { firstName: true, lastName: true } },
      },
    }) : [];

    // Combine and transform activities
    const activities = [
      ...tasks.map((task) => ({
        type: 'TASK' as const,
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        creator: `${task.creator.firstName} ${task.creator.lastName}`,
      })),
      ...evaluations.map((evaluation) => ({
        type: 'EVALUATION' as const,
        id: evaluation.id,
        title: 'Evaluation submitted',
        comments: evaluation.comments,
        createdAt: evaluation.createdAt,
        creator: `${evaluation.author.firstName} ${evaluation.author.lastName}`,
      })),
      ...feedback.map((fb) => ({
        type: 'FEEDBACK' as const,
        id: fb.id,
        title: fb.title || 'Feedback submitted',
        content: fb.content,
        status: fb.status,
        createdAt: fb.createdAt,
        creator: `${fb.author.firstName} ${fb.author.lastName}`,
      })),
      ...mergeRequests.map((mr) => ({
        type: 'MERGE_REQUEST' as const,
        id: mr.id,
        title: mr.title,
        status: mr.status,
        createdAt: mr.createdAt,
        creator: `${mr.creator.firstName} ${mr.creator.lastName}`,
      })),
      ...commits.map((commit) => ({
        type: 'COMMIT' as const,
        id: commit.id,
        title: 'Commit added',
        message: commit.message,
        createdAt: commit.timestamp,
        creator: `${commit.author.firstName} ${commit.author.lastName}`,
      })),
    ];

    // Sort activities by createdAt in descending order
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project activities:', error);
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