import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session - the property is userId, not id
    const userId = session.user.userId;
    if (!userId) {
      console.error('Missing userId in session', session.user);
      return NextResponse.json({ message: 'Invalid user session' }, { status: 400 });
    }

    // Get request data
    let inviteCode: string;
    try {
      const body = await req.json();
      inviteCode = body.inviteCode;
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ message: 'Invalid request format' }, { status: 400 });
    }

    if (!inviteCode) {
      return NextResponse.json(
        { message: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find the invite in the database
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
      console.error('Error finding invite code:', error);
      
      // Check if it's a Prisma error related to missing model
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json(
          { message: 'The invitation system is currently being upgraded. Please try again later or contact support.' },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { message: 'Failed to validate invite code' },
        { status: 500 }
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
    try {
      const existingMembership = await db.groupMember.findFirst({
        where: {
          userId: userId,
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { message: 'You are already a member of a group' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing group membership:', error);
      return NextResponse.json(
        { message: 'Failed to validate group membership' },
        { status: 500 }
      );
    }

    // Check if the group is full
    try {
      // Get max group size from database rules
      const rule = await db.rule.findFirst();
      const maxGroupSize = rule?.maxGroupSize || 5; // Default to 5 if not specified

      if (invite.group.members.length >= maxGroupSize) {
        return NextResponse.json(
          { message: 'This group is already at maximum capacity' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking group capacity:', error);
      return NextResponse.json(
        { message: 'Failed to validate group capacity' },
        { status: 500 }
      );
    }

    // Use a transaction to ensure atomicity
    try {
      // Add the user to the group and mark the invitation as used
      await db.$transaction([
        db.groupMember.create({
          data: {
            groupUserName: invite.groupUserName,
            userId: userId,
          },
        }),
        db.groupInvite.update({
          where: { id: invite.id },
          data: {
            usedAt: new Date(),
          },
        })
      ]);
      
      return NextResponse.json({
        message: 'Successfully joined the group',
        group: {
          groupUserName: invite.groupUserName,
          name: invite.group.name,
        },
      });
    } catch (error) {
      console.error('Error completing group join transaction:', error);
      return NextResponse.json(
        { message: 'Failed to join group' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error joining group:', error);
    return NextResponse.json(
      { message: 'Error joining group' },
      { status: 500 }
    );
  }
} 