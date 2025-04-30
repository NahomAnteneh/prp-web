import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for leadership transfer
const transferLeadershipSchema = z.object({
  newLeaderId: z.string().min(1, 'New leader ID is required'),
});

// POST: Transfer group leadership to another member
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.groupId;

    // Find the group with its members
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if the current user is authorized to transfer leadership
    // Only the current leader or an admin can transfer leadership
    const isCurrentLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isCurrentLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the current group leader or an administrator can transfer leadership' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = transferLeadershipSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { newLeaderId } = validationResult.data;

    // Check if the new leader is different from the current leader
    if (newLeaderId === group.leaderId) {
      return NextResponse.json(
        { message: 'The user is already the leader of this group' },
        { status: 400 }
      );
    }

    // Check if the new leader is a member of the group
    const isGroupMember = group.members.some(
      (member: { userId: string }) => member.userId === newLeaderId
    );

    if (!isGroupMember) {
      return NextResponse.json(
        { message: 'The new leader must be a current member of the group' },
        { status: 400 }
      );
    }

    // Get information about the new leader
    const newLeader = await db.user.findUnique({
      where: { id: newLeaderId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
      },
    });

    if (!newLeader) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Update the group with the new leader
    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: {
        leaderId: newLeaderId,
      },
      include: {
        leader: {
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
      message: 'Group leadership transferred successfully',
      previousLeaderId: group.leaderId,
      newLeader: updatedGroup.leader,
    });
  } catch (error) {
    console.error('Error transferring group leadership:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 