import { NextRequest, NextResponse } from 'next/server';
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
    const { groupId, projectId } = params;

    const realGroupId = await db.group.findUnique({
      where: { groupUserName: groupId },
      select: { id: true },
    });

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupId: realGroupId?.id,
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
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Format response
    const repositories = projectRepositories.map((pr) => {
      if (!pr.repository) {
        throw new Error("Invalid data structure: 'repository' property is missing.");
      }
      return {
        id: pr.repository.id,
        name: pr.repository.name,
        description: pr.repository.description,
        isPrivate: pr.repository.isPrivate,
        createdAt: pr.repository.createdAt,
        updatedAt: pr.repository.updatedAt,
        owner: pr.repository.owner,
      };
    });

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
    const { groupId, projectId } = params;

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupId: groupId,
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