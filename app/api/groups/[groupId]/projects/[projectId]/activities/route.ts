import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { groupId: string; projectId: string } }
) {
  try {
    const { groupId, projectId } = await params;

    const realGroupId = await prisma.group.findFirst({
      where: { groupUserName: groupId },
      select: { id: true },
    });

    // Verify the project exists and belongs to the group
    const project = await prisma.project.findUnique({
      where: { id: projectId, groupId: realGroupId?.id },
      select: { id: true, groupId: true },
    });

    if (!realGroupId || !project || project.groupId !== realGroupId.id) {
      return NextResponse.json(
        { error: 'Project not found or does not belong to the specified group' },
        { status: 404 }
      );
    }

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

    // Fetch merge requests (via project repositories)
    const mergeRequests = await prisma.mergeRequest.findMany({
      where: {
        repository: {
          projects: {
            some: { projectId },
          },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    // Fetch commits (via project repositories)
    const commits = await prisma.commit.findMany({
      where: {
        repository: {
          projects: {
            some: { projectId },
          },
        },
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });

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
        createdAt: commit.createdAt,
        creator: `${commit.author.firstName} ${commit.author.lastName}`,
      })),
    ];

    // Sort activities by createdAt in descending order
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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