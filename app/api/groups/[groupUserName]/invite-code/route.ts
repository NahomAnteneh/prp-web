import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';

// Default expiration time for invite codes (24 hours)
const INVITE_EXPIRATION_HOURS = 24;

export async function POST(
  request: Request,
  { params }: { params: { groupUserName: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const groupUserName = params.groupUserName;

    // Check if the group exists
    const group = await db.group.findUnique({
      where: { groupUserName },
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

    // Check if user is authorized (is group leader or admin)
    const isGroupLeader = group.leaderId === session.user.userId;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only group leaders can generate invite codes' },
        { status: 403 }
      );
    }

    // Check group size limit (from request body or default to system limit)
    const { email } = await request.json().catch(() => ({}));
    
    // Get max group size from database rules
    const rule = await db.rule.findFirst();
    const maxGroupSize = rule?.maxGroupSize || 5; // Default to 5 if not specified
    
    // Check if group is already full
    if (group.members.length >= maxGroupSize) {
      return NextResponse.json(
        { message: `Group is already at maximum capacity (${maxGroupSize})` },
        { status: 400 }
      );
    }

    // Generate a unique invite code
    const inviteCode = generateInviteCode();
    
    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRATION_HOURS);
    
    // Create the invitation in the database
    const invitation = await db.groupInvite.create({
      data: {
        code: inviteCode,
        expiresAt,
        groupUserName,
        createdById: session.user.userId,
        email: email || null,
      },
    });
    
    return NextResponse.json({ 
      id: invitation.id,
      inviteCode: invitation.code,
      expiresAt: invitation.expiresAt,
      message: `Invitation created successfully. Valid for ${INVITE_EXPIRATION_HOURS} hours.`
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating invite code:', error);
    return NextResponse.json(
      { message: 'Error generating invite code' },
      { status: 500 }
    );
  }
}

// Get information about an invite code
export async function GET(
  request: Request,
  { params }: { params: { groupUserName: string } | Promise<{ groupUserName: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params); // Ensure params is resolved
    const groupUserName = resolvedParams.groupUserName;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    // If code is provided, get specific invitation
    if (code) {
      const invitation = await db.groupInvite.findUnique({
        where: { code },
        include: {
          group: {
            select: {
              name: true,
              description: true,
              members: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!invitation || invitation.groupUserName !== groupUserName) {
        return NextResponse.json(
          { message: 'Invitation not found' },
          { status: 404 }
        );
      }

      // Check if invitation is expired
      if (invitation.expiresAt < new Date()) {
        return NextResponse.json(
          { message: 'Invitation has expired' },
          { status: 410 } // Gone
        );
      }

      // Check if already used
      if (invitation.usedAt) {
        return NextResponse.json(
          { message: 'Invitation has already been used' },
          { status: 410 } // Gone
        );
      }

      return NextResponse.json({
        invitation: {
          code: invitation.code,
          expiresAt: invitation.expiresAt,
          group: {
            groupUserName,
            name: invitation.group.name,
            description: invitation.group.description,
            memberCount: invitation.group.members.length,
          },
        },
      });
    }

    // Otherwise, list all active invitations for the group
    // Authorization: Only group leader or admin can see all invitations
    const group = await db.group.findUnique({
      where: { groupUserName },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    const isGroupLeader = group.leaderId === session.user.userId;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isGroupLeader && !isAdmin) {
      return NextResponse.json(
        { message: 'Only group leaders can view all invitations' },
        { status: 403 }
      );
    }

    const invitations = await db.groupInvite.findMany({
      where: {
        groupUserName,
        expiresAt: { gt: new Date() }, // Only active invitations
        usedAt: null, // Only unused invitations
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        code: true,
        email: true,
        expiresAt: true,
        createdAt: true,
        groupUserName: true,
        usedAt: true,
        createdById: true
      }
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invite code:', error);
    return NextResponse.json(
      { message: 'Error fetching invite code' },
      { status: 500 }
    );
  }
}

// Generate a secure random invite code
function generateInviteCode(): string {
  // Generate a random code (8 characters, alphanumeric)
  // Using crypto.randomBytes for cryptographic security
  return randomBytes(6)
    .toString('hex')
    .toUpperCase();
} 