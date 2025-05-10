import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List all members of a group
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string } }
) {
  try {
    const groupUserName = params.groupUserName;

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
      include: {
        members: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
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
        userId: string; 
        firstName: string; 
        lastName: string;  
        email: string; 
        role: string; 
      } 
    }) => ({
      userId: member.user.userId,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      email: member.user.email,
      role: member.user.role,
      joinedAt: member.joinedAt,
      isLeader: member.user.userId === group.leaderId,
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
  { params }: { params: { groupUserName: string } }
) {
  try {
    const groupUserName = params.groupUserName;

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
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

    // Validate input data
    const rawData = await req.json();
    const { userId } = rawData;

    // Check if the user exists
    const user = await db.user.findUnique({
      where: { userId },
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

    // Add the user to the group
    await db.groupMember.create({
      data: {
        group: {
          connect: {
            groupUserName
          }
        },
        user: {
          connect: {
            userId
          }
        }
      },
    });

    // Get the updated member information
    const newMember = await db.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
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
  { params }: { params: { groupUserName: string } }
) {
  try {
    const groupUserName = params.groupUserName;

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
      where: { groupUserName },
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
    await db.groupMember.deleteMany({
      where: {
        group: {
          groupUserName
        },
        userId
      }
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