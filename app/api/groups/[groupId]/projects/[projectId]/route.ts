import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  milestones: z.array(z.object({
    id: z.string().optional(), // For existing milestones
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().optional(), // ISO date string
    completed: z.boolean().optional(),
  })).optional(),
});

// GET: Retrieve a specific project
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
            id: true,
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
            id: true,
            firstName: true,
            lastName: true,
            username: true,
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
                id: true,
                firstName: true,
                lastName: true,
                username: true,
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
                id: true,
                firstName: true,
                lastName: true,
                username: true,
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
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        repositories: {
          include: {
            repository: {
              select: {
                id: true,
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

    // Check if user is authorized to view this project
    const isGroupMember = project.group.members.some(
      (member: { userId: string }) => member.userId === session.user.id
    );
    const isAdvisor = project.advisorId === session.user.id;
    const isEvaluator = await db.projectEvaluator.findFirst({
      where: {
        projectId: projectId,
        evaluatorId: session.user.id,
      },
    });
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupMember && !isAdvisor && !isEvaluator && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to view this project' },
        { status: 403 }
      );
    }

    // Format repositories for cleaner response
    const formattedRepositories = project.repositories.map((repo: {
      repository: {
        id: string;
        name: string;
        description: string | null;
      }
    }) => ({
      id: repo.repository.id,
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

    // Check if user is authorized to update this project
    const isGroupLeader = project.group.leaderId === session.user.id;
    const isAdvisor = project.advisorId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdvisor && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to update this project' },
        { status: 403 }
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
        where: { id: updateData.advisorId },
        select: { id: true, role: true },
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

    // Process milestones data for JSON storage
    let milestonesData;
    if (updateData.milestones) {
      // Get existing milestones
      const existingMilestones = project.milestones ? 
        (project.milestones as any).milestones || [] : 
        [];
      
      // Map new milestones preserving existing ones where possible
      milestonesData = updateData.milestones.map(m => {
        // If we have an ID, try to find the existing milestone
        if (m.id) {
          const existing = existingMilestones.find((em: any) => em.id === m.id);
          if (existing) {
            return {
              ...existing,
              title: m.title || existing.title,
              description: m.description ?? existing.description,
              dueDate: m.dueDate ? new Date(m.dueDate) : existing.dueDate,
              completed: m.completed ?? existing.completed,
              updatedAt: new Date(),
            };
          }
        }
        
        // Otherwise create a new milestone
        return {
          id: m.id || Math.random().toString(36).substring(2, 15),
          title: m.title,
          description: m.description,
          dueDate: m.dueDate ? new Date(m.dueDate) : null,
          completed: m.completed || false,
          createdAt: new Date(),
        };
      });
    }

    // Prepare update data object
    const projectUpdateData: any = {
      ...updateData,
      milestones: undefined, // Remove the raw milestones data
    };

    // If we processed milestones, add them back in the correct format
    if (milestonesData) {
      projectUpdateData.milestones = { milestones: milestonesData };
    }

    // Set submission date if status is changing to SUBMITTED
    if (updateData.status === 'SUBMITTED' && project.status !== 'SUBMITTED') {
      projectUpdateData.submissionDate = new Date();
    }

    // Update the project
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: projectUpdateData,
      include: {
        advisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
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

// DELETE: Remove a project
export async function DELETE(
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

    // Check if user is authorized to delete this project
    const isGroupLeader = project.group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the group leader or administrators can delete projects' },
        { status: 403 }
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
      } else if (!isAdmin) {
        return NextResponse.json(
          { message: 'Only administrators can force delete projects with associated data' },
          { status: 403 }
        );
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