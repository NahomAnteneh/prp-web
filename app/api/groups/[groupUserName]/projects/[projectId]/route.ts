import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for project updates
const updateProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'SUBMITTED', 'COMPLETED', 'ARCHIVED']).optional(),
  submissionDate: z.string().optional().nullable(), // ISO date string
  advisorId: z.string().optional().nullable(),
  archived: z.boolean().optional(),
});

// GET: Retrieve a specific project
export async function GET(
  req: NextRequest,
  context: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await context.params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
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
      include: {
        group: {
          select: {
            groupUserName: true,
            name: true,
            leaderId: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        advisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profileInfo: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            score: true,
            comments: true,
            criteriaData: true,
            createdAt: true,
            author: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        feedback: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            content: true,
            status: true,
            createdAt: true,
            author: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            assignee: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        repositories: {
          include: {
            repository: {
              select: {
                name: true,
                description: true,
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

    // Format repositories for cleaner response
    const formattedRepositories = project.repositories.map((repo: {
      repository: {
        name: string;
        description: string | null;
      };
    }) => ({
      name: repo.repository.name,
      description: repo.repository.description,
    }));

    // Create a cleaner response object
    const projectResponse = {
      ...project,
      repositories: formattedRepositories,
    };

    return NextResponse.json(projectResponse);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a project
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
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
    const validationResult = updateProjectSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If advisor is being changed, check if they exist and have the correct role
    if (updateData.advisorId && updateData.advisorId !== project.advisorId) {
      const advisor = await db.user.findUnique({
        where: { userId: updateData.advisorId },
        select: { userId: true, role: true },
      });

      if (!advisor) {
        return NextResponse.json(
          { message: 'Advisor not found' },
          { status: 404 }
        );
      }

      if (advisor.role !== 'ADVISOR') {
        return NextResponse.json(
          { message: 'The specified user is not an advisor' },
          { status: 400 }
        );
      }
    }

    // Set submission date if status is changing to SUBMITTED
    if (updateData.status === 'SUBMITTED' && project.status !== 'SUBMITTED') {
      updateData.submissionDate = new Date().toISOString();
    }

    // Update the project
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        advisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
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
      include: {
        tasks: true,
        feedback: true,
        evaluations: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    // Check if project has related items
    const hasAssociatedData = project.tasks.length > 0 || 
                             project.feedback.length > 0 || 
                             project.evaluations.length > 0;

    // If project has related items, check for force delete
    if (hasAssociatedData) {
      const url = new URL(req.url);
      const forceDelete = url.searchParams.get('force') === 'true';

      if (!forceDelete) {
        return NextResponse.json({
          message: 'This project has associated tasks, feedback, or evaluations. Use ?force=true to confirm deletion.',
          taskCount: project.tasks.length,
          feedbackCount: project.feedback.length,
          evaluationCount: project.evaluations.length,
        }, { status: 409 }); // Conflict
      }
    }

    // Delete the project with all associated data
    await db.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}