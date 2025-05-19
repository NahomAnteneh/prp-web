import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
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
    
    // Get all feedback created by this evaluator
    const feedback = await prisma.feedback.findMany({
      where: { authorId: userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                name: true,
                groupUserName: true,
              },
            },
          },
        },
        mergeRequest: {
          select: {
            id: true,
            title: true,
          },
        },
        repository: {
          select: {
            name: true,
            groupUserName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Format the feedback for response
    const formattedFeedback = feedback.map(item => ({
      id: item.id,
      title: item.title || 'Untitled Feedback',
      content: item.content,
      status: item.status,
      createdAt: item.createdAt,
      targetType: item.projectId 
        ? 'PROJECT' 
        : item.mergeRequestId 
          ? 'MERGE_REQUEST' 
          : 'REPOSITORY',
      targetId: item.projectId || item.mergeRequestId || `${item.repositoryName}:${item.repositoryGroup}`,
      targetName: item.project?.title || item.mergeRequest?.title || item.repository?.name,
      groupName: item.project?.group.name || (item.repository ? item.repository.groupUserName : null),
    }));
    
    return NextResponse.json(formattedFeedback);
    
  } catch (error) {
    console.error('Error fetching project feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project feedback' },
      { status: 500 }
    );
  }
}

// Create new feedback
export async function POST(request: Request) {
  try {
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
    
    // Parse the request body
    const body = await request.json();
    const { title, content, targetType, targetId } = body;
    
    if (!content || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // Create the feedback based on target type
    let feedbackData: any = {
      title,
      content,
      status: 'OPEN',
      authorId: userId,
    };
    
    switch (targetType) {
      case 'PROJECT':
        feedbackData.projectId = targetId;
        break;
      
      case 'MERGE_REQUEST':
        feedbackData.mergeRequestId = targetId;
        break;
      
      case 'REPOSITORY':
        // Repository ID is expected in format "name:groupUserName"
        const [repoName, groupUserName] = targetId.split(':');
        if (!repoName || !groupUserName) {
          return NextResponse.json(
            { error: 'Invalid repository ID format' },
            { status: 400 }
          );
        }
        feedbackData.repositoryName = repoName;
        feedbackData.repositoryGroup = groupUserName;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid target type' },
          { status: 400 }
        );
    }
    
    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: feedbackData,
    });
    
    // Create notification for the target's owner/members
    if (targetType === 'PROJECT') {
      const project = await prisma.project.findUnique({
        where: { id: targetId },
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
        // Create notifications for group members
        for (const member of project.group.members) {
          await prisma.notification.create({
            data: {
              message: `New feedback on project: ${project.title}`,
              link: `/project/${targetId}/feedback/${feedback.id}`,
              read: false,
              recipientId: member.userId,
            },
          });
        }
      }
    }
    
    return NextResponse.json({
      message: 'Feedback created successfully',
      feedback,
    });
    
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
} 