import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for adding members
const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Schema for removing members
const removeMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// GET: List all members of a group
export async function GET(
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

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                role: true,
              },
            },
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

    // Transform the data to return a clean member list
    const members = group.members.map((member: { 
      joinedAt: Date; 
      user: { 
        id: string; 
        firstName: string; 
        lastName: string; 
        username: string; 
        email: string; 
        role: string; 
      } 
    }) => ({
      id: member.user.id,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      username: member.user.username,
      email: member.user.email,
      role: member.user.role,
      joinedAt: member.joinedAt,
      isLeader: member.user.id === group.leaderId,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add a new member to the group
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

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check permissions: Only group leader or admin can add members
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'You do not have permission to add members to this group' },
        { status: 403 }
      );
    }

    // Validate input data
    const rawData = await req.json();
    const validationResult = addMemberSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data;

    // Check if the user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is already a member of this group
    const existingMembership = group.members.find(
      (member: { userId: string }) => member.userId === userId
    );

    if (existingMembership) {
      return NextResponse.json(
        { message: 'User is already a member of this group' },
        { status: 400 }
      );
    }

    // Check if the user is already a member of another group
    const otherGroupMembership = await db.groupMember.findFirst({
      where: { userId },
    });

    if (otherGroupMembership) {
      return NextResponse.json(
        { message: 'User is already a member of another group' },
        { status: 400 }
      );
    }

    // Get the maximum group size from rules
    let maxGroupSize = 5; // Default to 5
    
    try {
      const rules = await db.rule.findFirst();
      if (rules) {
        maxGroupSize = rules.maxGroupSize;
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      // Continue with default maxGroupSize
    }

    // Check if adding this member would exceed the maximum group size
    if (group.members.length >= maxGroupSize) {
      return NextResponse.json(
        { message: `Cannot add more members. Maximum group size (${maxGroupSize}) reached.` },
        { status: 400 }
      );
    }

    // Add the user to the group
    await db.groupMember.create({
      data: {
        groupId,
        userId,
      },
    });

    // Get the updated member information
    const newMember = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Member added successfully',
      member: {
        ...newMember,
        joinedAt: new Date(),
        isLeader: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding group member:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a member from the group
export async function DELETE(
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

    // Parse the URL to get the userId to remove
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user to remove is the group leader
    if (userId === group.leaderId) {
      return NextResponse.json(
        { message: 'Cannot remove the group leader. Transfer leadership first.' },
        { status: 400 }
      );
    }

    // Check permissions: Only group leader or admin can remove members
    // (or the member can remove themselves)
    const isGroupLeader = group.leaderId === session.user.id;
    const isAdmin = session.user.role === 'ADMINISTRATOR';
    const isSelfRemoval = userId === session.user.id;

    if (!isGroupLeader && !isAdmin && !isSelfRemoval) {
      return NextResponse.json(
        { message: 'You do not have permission to remove members from this group' },
        { status: 403 }
      );
    }

    // Check if the user is actually a member of this group
    const existingMembership = group.members.find(
      (member: { userId: string }) => member.userId === userId
    );

    if (!existingMembership) {
      return NextResponse.json(
        { message: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // Remove the user from the group
    await db.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return NextResponse.json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 