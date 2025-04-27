import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { params } = context;
    const awaitedParams = await params;
    const { groupId } = awaitedParams;

    // Check if user is a member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Get projects for the group
    const projects = await db.project.findMany({
      where: {
        groupId: groupId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      projects,
    });
  } catch (error) {
    console.error('Error fetching group projects:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const { groupId, title, description } = await req.json();

    // Validate required fields
    if (!groupId || !title) {
      return NextResponse.json(
        { message: 'Group ID and title are required' },
        { status: 400 }
      );
    }

    // Check if user is member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { message: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Create the project in the database
    const newProject = await db.project.create({
      data: {
        title,
        description: description || null,
        status: 'ACTIVE',
        groupId,
      },
    });
    
    return NextResponse.json({ 
      message: 'Project created successfully',
      project: newProject 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { message: 'Error creating project' },
      { status: 500 }
    );
  }
}
