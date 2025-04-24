import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json(
        { message: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find the invite in the database
    // Note: This requires the Prisma schema to include the GroupInvite model
    // Since Prisma may not be updated yet, we need to handle potential errors
    let invite;
    
    try {
      invite = await db.groupInvite.findUnique({
        where: { code: inviteCode },
        include: {
          group: {
            include: {
              members: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding invite code - the GroupInvite model might not be available:', error);
      
      // Fallback to a mock implementation if the model doesn't exist yet
      return NextResponse.json(
        { message: 'The invitation system is currently being upgraded. Please try again later or contact support.' },
        { status: 503 } // Service Unavailable
      );
    }

    if (!invite) {
      return NextResponse.json(
        { message: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'This invitation has expired' },
        { status: 410 } // Gone
      );
    }

    // Check if invitation has already been used
    if (invite.usedAt) {
      return NextResponse.json(
        { message: 'This invitation has already been used' },
        { status: 410 } // Gone
      );
    }

    // Check if the user is already in a group
    const existingMembership = await db.groupMember.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'You are already a member of a group' },
        { status: 400 }
      );
    }

    // Check if the group is full
    // Get max group size from database rules
    const rule = await db.rule.findFirst();
    const maxGroupSize = rule?.maxGroupSize || 5; // Default to 5 if not specified

    if (invite.group.members.length >= maxGroupSize) {
      return NextResponse.json(
        { message: 'This group is already at maximum capacity' },
        { status: 400 }
      );
    }

    // Add the user to the group
    await db.groupMember.create({
      data: {
        groupId: invite.groupId,
        userId: session.user.id,
      },
    });

    // Mark the invitation as used
    await db.groupInvite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Successfully joined the group',
      group: {
        id: invite.groupId,
        name: invite.group.name,
      },
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { message: 'Error joining group' },
      { status: 500 }
    );
  }
} 