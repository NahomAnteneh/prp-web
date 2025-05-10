import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating project advisor
const updateAdvisorSchema = z.object({
  advisorId: z.string().nullable(),
});

// GET: Get project advisor details
export async function GET(
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
        advisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            profileInfo: true,
            role: true,
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

    if (!project.advisor) {
      return NextResponse.json(
        { message: 'No advisor assigned to this project' },
        { status: 404 }
      );
    }

    return NextResponse.json({ advisor: project.advisor });
  } catch (error) {
    console.error('Error fetching project advisor:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update project advisor
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true, leaderId: true },
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
    const validationResult = updateAdvisorSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { advisorId } = validationResult.data;

    // If advisorId is provided, check if user exists and has ADVISOR role
    if (advisorId) {
      const advisor = await db.user.findUnique({
        where: { 
          userId: advisorId,
          role: 'ADVISOR'
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!advisor) {
        return NextResponse.json(
          { message: 'Advisor not found or user is not an advisor' },
          { status: 404 }
        );
      }
    }

    // Update project with new advisor
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: { advisorId },
      include: {
        advisor: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: advisorId 
        ? 'Project advisor updated successfully' 
        : 'Project advisor removed successfully',
      advisor: updatedProject.advisor,
    });
  } catch (error) {
    console.error('Error updating project advisor:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 