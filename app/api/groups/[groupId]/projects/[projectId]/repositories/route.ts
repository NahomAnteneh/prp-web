import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for linking repository to project
const linkRepositorySchema = z.object({
  repositoryId: z.string().min(1, 'Repository ID is required'),
});

// GET: List repositories linked to a project
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, projectId } = params;

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupId: groupId,
      },
      include: {
        group: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this project's repositories
    const isGroupMember = project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = project.advisorId === session.user.id;
    const isEvaluator = await db.projectEvaluator.findFirst({
      where: {
        projectId,
        evaluatorId: session.user.id,
      },
    });

    if (!isGroupMember && !isAdvisor && !isEvaluator) {
      return NextResponse.json(
        { message: 'You do not have permission to view this project' },
        { status: 403 }
      );
    }

    // Fetch repositories linked to the project
    const projectRepositories = await db.projectRepository.findMany({
      where: {
        projectId,
      },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
            createdAt: true,
            updatedAt: true,
            owner: {
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
    });

    // Format response
    const repositories = projectRepositories.map((pr: {
      repository: {
        id: string;
        name: string;
        description: string;
        isPrivate: boolean;
        createdAt: Date;
        updatedAt: Date;
        owner: {
          id: string;
          firstName: string;
          lastName: string;
          username: string;
        };
      };
    }) => ({
      id: pr.repository.id,
      name: pr.repository.name,
      description: pr.repository.description,
      isPrivate: pr.repository.isPrivate,
      createdAt: pr.repository.createdAt,
      updatedAt: pr.repository.updatedAt,
      owner: pr.repository.owner,
    }));

    return NextResponse.json({ repositories });
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
  { params }: { params: { groupId: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, projectId } = params;

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupId: groupId,
      },
      include: {
        group: {
          select: {
            leaderId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if user is authorized to link repositories to this project
    const isGroupLeader = project.group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the group leader or administrators can link repositories to projects' },
        { status: 403 }
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

    const { repositoryId } = validationResult.data;

    // Check if repository exists and belongs to the group
    const repository = await db.repository.findFirst({
      where: {
        id: repositoryId,
        groupId: groupId,
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
        repositoryId,
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
        repositoryId,
        groupId,
      },
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Repository linked to project successfully',
      repository: {
        id: projectRepository.repository.id,
        name: projectRepository.repository.name,
        description: projectRepository.repository.description,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error linking repository to project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 