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

    // Check if this group already has a project
    const existingProject = await db.project.findUnique({
      where: {
        groupId: groupId,
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { message: 'This group already has a project' },
        { status: 400 }
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

// GET endpoint to fetch a list of all projects (used for admin purposes)
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // // Only admins/evaluators should see all projects
    // if (session.user.role !== 'ADMIN' && session.user.role !== 'EVALUATOR') {
    //   return NextResponse.json(
    //     { message: 'Forbidden' },
    //     { status: 403 }
    //   );
    // }

    // Fetch projects from database
    const projects = await db.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        group: true,
        advisor: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { message: 'Error fetching projects' },
      { status: 500 }
    );
  }
} 