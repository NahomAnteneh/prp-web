import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for validation
const evaluationSubmissionSchema = z.object({
  criteria: z.array(
    z.object({
      id: z.string(),
      score: z.number().min(0).max(10),
      comments: z.string().optional(),
    })
  ),
  overallComments: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const formId = params.formId;
    
    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.userId;
    
    // Verify the user is an evaluator
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { role: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'EVALUATOR') {
      return NextResponse.json({ error: 'Access denied. User is not an evaluator' }, { status: 403 });
    }
    
    // Verify the evaluator is assigned to this project
    const assignment = await prisma.projectEvaluator.findFirst({
      where: {
        evaluatorId: userId,
        projectId: formId,
      },
    });
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to evaluate this project' },
        { status: 403 }
      );
    }
    
    // Parse and validate the request
    const body = await request.json();
    
    const validationResult = evaluationSubmissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid submission data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { criteria, overallComments } = validationResult.data;
    
    // Calculate average score
    const totalScore = criteria.reduce((sum, item) => sum + item.score, 0);
    const averageScore = criteria.length > 0 ? totalScore / criteria.length : 0;
    
    // Check if an evaluation already exists
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        authorId: userId,
        projectId: formId,
      },
    });
    
    let evaluation;
    
    if (existingEvaluation) {
      // Update existing evaluation
      evaluation = await prisma.evaluation.update({
        where: { id: existingEvaluation.id },
        data: {
          score: averageScore,
          comments: overallComments,
          criteriaData: {
            criteria,
            totalScore,
            averageScore,
          },
        },
      });
    } else {
      // Create new evaluation
      evaluation = await prisma.evaluation.create({
        data: {
          score: averageScore,
          comments: overallComments,
          criteriaData: {
            criteria,
            totalScore,
            averageScore,
          },
          authorId: userId,
          projectId: formId,
        },
      });
      
      // Create notification for the project group
      const project = await prisma.project.findUnique({
        where: { id: formId },
        select: { 
          title: true,
          group: {
            select: {
              leaderId: true,
              members: {
                select: { userId: true }
              }
            }
          }
        },
      });
      
      if (project) {
        // Create notification for group leader
        await prisma.notification.create({
          data: {
            message: `New evaluation submitted for project: ${project.title}`,
            link: `/project/${formId}`,
            read: false,
            recipientId: project.group.leaderId,
          },
        });
        
        // Create notifications for other group members
        for (const member of project.group.members) {
          if (member.userId !== project.group.leaderId) {
            await prisma.notification.create({
              data: {
                message: `New evaluation submitted for project: ${project.title}`,
                link: `/project/${formId}`,
                read: false,
                recipientId: member.userId,
              },
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      message: 'Evaluation submitted successfully',
      evaluationId: evaluation.id,
    });
    
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
} 