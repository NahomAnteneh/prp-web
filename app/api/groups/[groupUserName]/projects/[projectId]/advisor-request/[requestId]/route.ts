import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// DELETE: Cancel an advisor request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; requestId: string } }
) {
  try {
    const { groupUserName, projectId, requestId } = params;
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
      include: {
        leader: true,
      },
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
          { message: 'You are not authorized to cancel advisor requests for this group' },
          { status: 403 }
        );
      }
    }

    // Check if the advisor request exists and belongs to this project and group
    const advisorRequest = await db.advisorRequest.findFirst({
      where: {
        id: requestId,
        projectId,
        groupUserName,
      },
    });

    if (!advisorRequest) {
      return NextResponse.json(
        { message: 'Advisor request not found or does not belong to this project' },
        { status: 404 }
      );
    }

    // Check if the request is still pending (only pending requests can be cancelled)
    if (advisorRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Only pending advisor requests can be cancelled' },
        { status: 400 }
      );
    }

    // Delete the advisor request
    await db.advisorRequest.delete({
      where: {
        id: requestId,
      },
    });

    // Create a notification for the advisor that the request was cancelled
    await db.notification.create({
      data: {
        message: `${group.name} has cancelled their advisor request`,
        recipientId: advisorRequest.requestedAdvisorId,
        read: false,
      },
    });

    return NextResponse.json({
      message: 'Advisor request cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling advisor request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 