import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE: Unlink a repository from a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string; projectId: string; repositoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId, projectId, repositoryId } = params;

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

    // Check if user is authorized to unlink repositories from this project
    const isGroupLeader = project.group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the group leader or administrators can unlink repositories from projects' },
        { status: 403 }
      );
    }

    // Check if the repository link exists
    const projectRepository = await db.projectRepository.findFirst({
      where: {
        projectId,
        repositoryId,
        groupId,
      },
      include: {
        repository: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!projectRepository) {
      return NextResponse.json(
        { message: 'This repository is not linked to the project' },
        { status: 404 }
      );
    }

    // Get repository name for the response
    const repositoryName = projectRepository.repository.name;

    // Delete the link
    await db.projectRepository.delete({
      where: {
        projectId_repositoryId: {
          projectId,
          repositoryId,
        },
      },
    });

    return NextResponse.json({
      message: `Repository "${repositoryName}" successfully unlinked from the project`,
    });
  } catch (error) {
    console.error('Error unlinking repository from project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 