import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: List all members of a group
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string } }
) {
  try {
    const { groupUserName } = await params;

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
    const { groupUserName } = await params;

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

// PATCH: Update a member's role in the group
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUserName: string } }
) {
  try {
    const { groupUserName } = params;
    const body = await req.json();
    const { memberUserId, role, permissions } = body; // permissions might be used later

    if (!memberUserId || !role) {
      return NextResponse.json(
        { message: 'memberUserId and role are required in the request body' },
        { status: 400 }
      );
    }

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if the member exists in the group
    const existingMembership = await db.groupMember.findUnique({
      where: {
        groupUserName_userId: {
          groupUserName: groupUserName,
          userId: memberUserId,
        },
      },
    });

    if (!existingMembership) {
      return NextResponse.json(
        { message: 'Member not found in this group' },
        { status: 404 }
      );
    }

    // Update the member's role
    // For now, we only update the role string. 
    // If `role` is 'custom', the frontend handles displaying permission toggles.
    // Storing granular custom permissions would require schema changes (e.g., a JSON field on GroupMember).
    const updatedMembership = await db.groupMember.update({
      where: {
        groupUserName_userId: {
          groupUserName: groupUserName,
          userId: memberUserId,
        },
      },
      data: {
        role: role, // The role field on GroupMember model needs to exist and be a string
        // customPermissions: role === 'custom' ? permissions : undefined, // Example if storing JSON permissions
      },
    });

    return NextResponse.json({
      message: 'Member role updated successfully',
      member: updatedMembership,
    });

  } catch (error) {
    console.error('Error updating group member role:', error);
    return NextResponse.json(
      { message: 'Internal server error while updating role' },
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
    const { groupUserName } = await params;

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