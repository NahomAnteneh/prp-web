import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: { groupUserName: string } }
) {
  try {
    const { groupUserName } = context.params;

    // Find the group to make sure it exists
    const group = await db.group.findUnique({
      where: { groupUserName },
      include: {
        leader: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      }
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Get group-related project creations
    const projects = await db.project.findMany({
      where: { 
        groupUserName 
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get group-related repositories
    const repositories = await db.repository.findMany({
      where: { 
        groupUserName
      },
      select: {
        name: true,
        description: true,
        createdAt: true,
        ownerId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get member additions
    const members = await db.groupMember.findMany({
      where: { 
        groupUserName
      },
      select: {
        userId: true,
        joinedAt: true,
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    });

    // Transform and combine activities
    const projectActivities = projects.map(project => ({
      id: `project_${project.id}`,
      type: 'project_created',
      timestamp: project.createdAt,
      actor: {
        userId: group.leader.userId,
        firstName: group.leader.firstName,
        lastName: group.leader.lastName,
      },
      entityName: project.title,
      entityId: project.id,
    }));

    const repositoryActivities = repositories.map((repo) => ({
      id: `repo_${repo.name}`,
      type: 'repository_created',
      timestamp: repo.createdAt,
      actor: {
        userId: repo.ownerId,
        firstName: '',
        lastName: '',
      },
      entityName: repo.name,
      entityId: repo.name,
    }));

    const memberActivities = members.map(member => ({
      id: `member_${member.userId}`,
      type: 'member_added',
      timestamp: member.joinedAt,
      actor: {
        userId: group.leader.userId,
        firstName: group.leader.firstName,
        lastName: group.leader.lastName,
      },
      entityName: `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.userId,
      entityId: member.userId,
    }));

    // Combine all activities and sort by most recent
    const allActivities = [
      ...projectActivities,
      ...repositoryActivities,
      ...memberActivities,
    ].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return the activities
    return NextResponse.json(allActivities);

  } catch (error) {
    console.error('Error fetching group activities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 