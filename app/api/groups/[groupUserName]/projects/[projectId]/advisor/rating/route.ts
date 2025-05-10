import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Schema for advisor rating
const ratingSchema = z.object({
  advisorId: z.string(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().nullable().optional(),
});

// POST: Submit a rating for an advisor
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = params;
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
      select: { groupUserName: true, leaderId: true },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if the user is authorized (group leader or member)
    const isGroupLeader = group.leaderId === session.user.userId;
    
    if (!isGroupLeader) {
      const isMember = await db.groupMember.findUnique({
        where: {
          groupUserName_userId: {
            groupUserName,
            userId: session.user.userId,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { message: 'You are not authorized to rate advisors for this group' },
          { status: 403 }
        );
      }
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

    // Validate rating data
    const ratingData = await req.json();
    const validationResult = ratingSchema.safeParse(ratingData);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid rating data', 
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { advisorId, rating, feedback } = validationResult.data;

    // Check if the advisor is actually the project's advisor
    if (project.advisorId !== advisorId) {
      return NextResponse.json(
        { message: 'This user is not the advisor for this project' },
        { status: 400 }
      );
    }

    // Create an evaluation record to store the rating
    // We're using the Evaluation model since it already has fields for scores and comments
    const evaluation = await db.evaluation.create({
      data: {
        score: rating,
        comments: feedback || `Rating: ${rating}/5`,
        criteriaData: {
          advisorRating: {
            score: rating,
            feedback: feedback || null,
            ratedBy: session.user.userId,
            ratedAt: new Date().toISOString(),
          }
        },
        authorId: session.user.userId,
        projectId,
      },
    });

    // Create a notification for the advisor
    await db.notification.create({
      data: {
        message: `You received a rating for your advising on project "${project.title}"`,
        recipientId: advisorId,
        read: false,
        link: `/dashboard/project/${projectId}`,
      },
    });

    return NextResponse.json({
      message: 'Advisor rating submitted successfully',
      evaluation,
    });
  } catch (error) {
    console.error('Error submitting advisor rating:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 