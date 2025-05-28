'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FolderGit2, GitFork, CalendarPlus, UserPlus } from 'lucide-react';

// Extended group interface to include the nested properties
interface ExtendedGroup {
  name: string;
  groupUserName: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  leaderId: string;
  repositories?: Array<{
    id?: string;
    name: string;
    description?: string;
    groupUserName?: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  members?: Array<{
    userId: string;
    user?: {
      userId: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

// Activity interface
interface Activity {
  id: string;
  type: 'project_created' | 'repository_created' | 'member_added' | 'other';
  timestamp: Date;
  actor?: {
    userId: string;
    firstName?: string;
    lastName?: string;
  };
  entityName?: string;
  entityId?: string;
}

export default function GroupOverview({
  group,
}: {
  group: ExtendedGroup;
  maxGroupSize?: number;
  isLeader?: boolean;
  onUpdate?: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format the creation date
  const formattedCreatedAt = new Date(group.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/groups/${group.groupUserName}/activities`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Convert string timestamps to Date objects
        const formattedData = data.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        
        setActivities(formattedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [group.groupUserName]);

  // Function to render activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <CalendarPlus className="h-4 w-4 text-blue-500" />;
      case 'repository_created':
        return <GitFork className="h-4 w-4 text-green-500" />;
      case 'member_added':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      default:
        return <FolderGit2 className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to format activity text
  const getActivityText = (activity: Activity) => {
    const actorName = activity.actor?.firstName ? 
      `${activity.actor.firstName} ${activity.actor.lastName || ''}` : 
      'Someone';
    
    switch (activity.type) {
      case 'project_created':
        return (
          <span>
            <span className="font-medium">{actorName}</span> created a new project{' '}
            <Link href={`/projects/${activity.entityId}`} className="font-medium text-blue-600 hover:underline">
              {activity.entityName}
            </Link>
          </span>
        );
      case 'repository_created':
        return (
          <span>
            <span className="font-medium">{actorName}</span> created a new repository{' '}
            <Link href={`/groups/${group.groupUserName}/repositories/${activity.entityName}`} className="font-medium text-green-600 hover:underline">
              {activity.entityName}
            </Link>
          </span>
        );
      case 'member_added':
        return (
          <span>
            <span className="font-medium">{actorName}</span> added{' '}
            <Link href={`/${activity.entityId}`} className="font-medium text-purple-600 hover:underline">
              {activity.entityName}
            </Link>{' '}
            to the group
          </span>
        );
      default:
        return <span>Unknown activity</span>;
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHour = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHour / 24);

    if (diffInDay > 30) {
      return date.toLocaleDateString();
    } else if (diffInDay > 0) {
      return `${diffInDay} day${diffInDay > 1 ? 's' : ''} ago`;
    } else if (diffInHour > 0) {
      return `${diffInHour} hour${diffInHour > 1 ? 's' : ''} ago`;
    } else if (diffInMin > 0) {
      return `${diffInMin} minute${diffInMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Content (Profile and Recent Activities) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Group Profile Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-6">
            <Avatar className="h-20 w-20 bg-blue-50">
              <AvatarFallback>
                {group.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl font-bold">{group.name}</CardTitle>
              <p className="text-gray-500 text-sm">@{group.groupUserName}</p>
              <p className="text-gray-500 text-sm mt-2">{group.description || "No description provided."}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-blue-600 font-medium">{group.projects?.length || 0}</span>
                  <span className="text-gray-600">Projects</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-green-600 font-medium">{group.repositories?.length || 0}</span>
                  <span className="text-gray-600">Repositories</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-purple-600 font-medium">{group.members?.length || 0}</span>
                  <span className="text-gray-600">Members</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-600 font-medium">{formattedCreatedAt}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-medium">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="border border-dashed rounded-md bg-gray-50 p-6">
                <p className="text-sm text-gray-500 italic text-center">
                  Loading activities...
                </p>
              </div>
            ) : error ? (
              <div className="border border-dashed rounded-md bg-gray-50 p-6">
                <p className="text-sm text-gray-500 italic text-center">
                  {error}
                </p>
              </div>
            ) : !activities.length ? (
              <div className="border border-dashed rounded-md bg-gray-50 p-6">
                <p className="text-sm text-gray-500 italic text-center">
                  No recent activities found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Section: Members */}
      <div className="lg:col-span-1">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {group.members?.map((member) => (
                <Link
                  key={member.userId}
                  href={`/${member.user?.userId || '#'}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-10 w-10 bg-gray-100">
                    <AvatarFallback>
                      {member.user?.firstName
                        ? member.user.firstName.charAt(0).toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user?.firstName} {member.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{member.userId}</p>
                  </div>
                  {member.userId === group.leaderId && (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
                      Leader
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}