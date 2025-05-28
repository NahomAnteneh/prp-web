import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatTimeAgo } from '@/lib/utils';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Schema for linking repository to project
const linkRepositorySchema = z.object({
  repositoryName: z.string().min(1, 'Repository name is required'),
});

// GET: Get repositories associated with a project
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { 
        groupUserName: true,
        name: true,
        leaderId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if the user is authorized (group member, advisor, or admin)
    const isGroupMember = await db.groupMember.findUnique({
      where: {
        groupUserName_userId: {
          groupUserName,
          userId: session.user.userId,
        },
      },
    });

    const isAdvisor = await db.project.findFirst({
      where: {
        id: projectId,
        advisorId: session.user.userId,
      },
    });

    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isAdvisor && !isAdmin) {
      return NextResponse.json(
        { message: 'You are not authorized to view this project\'s repositories' },
        { status: 403 }
      );
    }

    // Get repositories associated with the project
    const projectRepositories = await db.projectRepository.findMany({
      where: {
        projectId,
        groupUserName,
      },
      include: {
        repository: {
          select: {
            name: true,
            description: true,
            isPrivate: true,
            createdAt: true,
            updatedAt: true,
            ownerId: true,
            _count: {
              select: {
                commits: true,
                branches: true,
                projects: true,
              },
            },
          },
        },
      },
    });

    // Format repositories for consistent response
    const formattedRepositories = projectRepositories.map(pr => ({
      name: pr.repository.name,
      description: pr.repository.description,
      isPrivate: pr.repository.isPrivate,
      createdAt: pr.repository.createdAt,
      updatedAt: pr.repository.updatedAt,
      lastActivity: formatTimeAgo(pr.repository.updatedAt),
      ownerId: pr.repository.ownerId,
      groupUserName: pr.groupUserName,
      assignedAt: pr.assignedAt,
      group: {
        name: group.name,
        leaderId: group.leaderId,
      },
      stats: {
        commits: pr.repository._count.commits,
        branches: pr.repository._count.branches,
        projects: pr.repository._count.projects,
      },
    }));

    return NextResponse.json({
      repositories: formattedRepositories,
    });
  } catch (error) {
    console.error('Error fetching project repositories:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Link a repository to a project
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { 
        groupUserName: true,
        name: true,
        leaderId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = linkRepositorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { repositoryName } = validationResult.data;

    // Check if repository exists and belongs to the group
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repositoryName,
          groupUserName,
        },
      },
      include: {
        _count: {
          select: {
            commits: true,
            branches: true,
            projects: true,
          },
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        { message: 'Repository not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if the repository is already linked to the project
    const existingLink = await db.projectRepository.findFirst({
      where: {
        projectId,
        repositoryName,
        groupUserName,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { message: 'Repository is already linked to this project' },
        { status: 400 }
      );
    }

    // Create the project-repository link
    const projectRepository = await db.projectRepository.create({
      data: {
        projectId,
        repositoryName,
        groupUserName,
      },
      include: {
        repository: {
          select: {
            name: true,
            description: true,
            isPrivate: true,
            createdAt: true,
            updatedAt: true,
            ownerId: true,
          },
        },
      },
    });

    // Format repository for consistent response
    const formattedRepository = {
      name: projectRepository.repository.name,
      description: projectRepository.repository.description,
      isPrivate: projectRepository.repository.isPrivate,
      createdAt: projectRepository.repository.createdAt,
      updatedAt: projectRepository.repository.updatedAt,
      lastActivity: formatTimeAgo(projectRepository.repository.updatedAt),
      ownerId: projectRepository.repository.ownerId,
      groupUserName: projectRepository.groupUserName,
      assignedAt: projectRepository.assignedAt,
      group: {
        name: group.name,
        leaderId: group.leaderId,
      },
      stats: {
        commits: repository._count.commits,
        branches: repository._count.branches,
        projects: repository._count.projects + 1, // +1 for newly linked project
      },
    };

    return NextResponse.json({
      message: 'Repository linked to project successfully',
      repository: formattedRepository,
    }, { status: 201 });
  } catch (error) {
    console.error('Error linking repository to project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}