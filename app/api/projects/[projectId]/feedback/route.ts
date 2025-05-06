import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for feedback creation
const createFeedbackSchema = z.object({
  title: z.string().optional(),
  content: z.string().trim().min(1, 'Feedback content is required'),
  status: z.enum(['OPEN', 'ADDRESSED', 'CLOSED']).default('OPEN'),
});

// GET: List all feedback for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
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
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view feedback
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
        { message: 'You do not have permission to view feedback for this project' },
        { status: 403 }
      );
    }

    // Get filter parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const authorId = url.searchParams.get('authorId');

    // Build filter conditions
    const whereConditions: any = {
      projectId,
    };

    if (status) {
      whereConditions.status = status;
    }

    if (authorId) {
      whereConditions.authorId = authorId;
    }

    // Fetch feedback
    const feedback = await db.feedback.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching project feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new feedback for a project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
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
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to create feedback
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

    // Only project members, the project advisor, evaluators, and admins can provide feedback
    if (!isGroupMember && !isAdvisor && !isEvaluator) {
      return NextResponse.json(
        { message: 'You do not have permission to provide feedback for this project' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = createFeedbackSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, content, status } = validationResult.data;

    // Create the feedback
    const feedback = await db.feedback.create({
      data: {
        title,
        content,
        status,
        projectId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Feedback created successfully',
      feedback,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 