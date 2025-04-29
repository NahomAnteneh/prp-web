import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    // Find the project by ID
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        advisor: true,
        tasks: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the project's group or has admin/evaluator/advisor role
    const isMember = project.group.members.some(
      (member) => member.user.id === session.user.id
    );
    
    const hasAccess = 
      isMember || 
      session.user.role === 'ADMIN' || 
      session.user.role === 'EVALUATOR' || 
      (project.advisorId && project.advisorId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { message: 'Error fetching project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const updateData = await request.json();

    // Find the project
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the project's group or has admin role
    const isMember = project.group.members.some(
      (member) => member.user.id === session.user.id
    );
    
    const isLeader = project.group.leaderId === session.user.id;
    
    const hasAccess = 
      isLeader || 
      session.user.role === 'ADMIN' || 
      (project.advisorId && project.advisorId === session.user.id);

    // For milestones update, regular members can also add/update milestones
    const canUpdateMilestones = isMember || hasAccess;
    
    // For basic project info, only leader/admin/advisor can update
    if (!hasAccess && !('milestones' in updateData)) {
      return NextResponse.json(
        { message: 'You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    // For milestones update, members can update
    if (!canUpdateMilestones && 'milestones' in updateData) {
      return NextResponse.json(
        { message: 'You do not have permission to update project milestones' },
        { status: 403 }
      );
    }

    // Prepare update data
    // Remove any fields that shouldn't be updated directly
    const validUpdateData = { ...updateData };
    
    // Remove protected fields
    delete validUpdateData.id;
    delete validUpdateData.groupId;
    delete validUpdateData.createdAt;

    // Handle milestones separately
    let milestones = undefined;
    if ('milestones' in updateData) {
      milestones = updateData.milestones;
      delete validUpdateData.milestones;
    }

    // Update the project
    const updatedProject = await db.project.update({
      where: {
        id: projectId,
      },
      data: {
        ...validUpdateData,
        ...(milestones !== undefined && { milestones }),
      },
    });

    return NextResponse.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { message: 'Error updating project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    // Find the project
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        group: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Only group leader or admin can delete a project
    const hasPermission = 
      project.group.leaderId === session.user.id || 
      session.user.role === 'ADMIN';

    if (!hasPermission) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this project' },
        { status: 403 }
      );
    }

    // Delete the project
    await db.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { message: 'Error deleting project' },
      { status: 500 }
    );
  }
} 