import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// DELETE: Remove a repository from a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; repoName: string } }
) {
  try {
    const { groupUserName, projectId, repoName } = params;
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

    // Check if the user is authorized (group leader or admin)
    const isGroupLeader = group.leaderId === session.user.userId;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You are not authorized to remove repositories from this project' },
        { status: 403 }
      );
    }

    // Check if the repository link exists
    const projectRepository = await db.projectRepository.findFirst({
      where: {
        projectId,
        repositoryName: repoName,
        groupUserName,
      },
    });

    if (!projectRepository) {
      return NextResponse.json(
        { message: 'Repository is not linked to this project' },
        { status: 404 }
      );
    }

    // Delete the project-repository link
    await db.projectRepository.delete({
      where: {
        projectId_repositoryName_groupUserName: {
          projectId,
          repositoryName: repoName,
          groupUserName,
        },
      },
    });

    return NextResponse.json({
      message: 'Repository successfully removed from project',
    });
  } catch (error) {
    console.error('Error removing repository from project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 