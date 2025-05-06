'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText, FolderGit2, MessageSquare, GitCommit, Loader2 } from 'lucide-react';
import { Project } from './project-card';

type ActivityType = 'document' | 'repository' | 'feedback' | 'commit' | 'task';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
  };
  timestamp: string;
}

interface ProjectStats {
  repositories: number;
  tasks: number;
  feedback: number;
  evaluations: number;
}

interface ProjectOverviewProps {
  ownerId: string;
  projectId: string;
}

export function ProjectOverview({ ownerId, projectId }: ProjectOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    repositories: 0,
    tasks: 0,
    feedback: 0,
    evaluations: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        // Fetch recent activities
        const activitiesResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/activities`);
        
        if (!activitiesResponse.ok) {
          throw new Error(`Failed to fetch activities: ${activitiesResponse.statusText}`);
        }
        
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
        
        // Fetch project stats
        const statsResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/stats`);
        
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch project stats: ${statsResponse.statusText}`);
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching project overview data:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [ownerId, projectId]);

  // Function to get appropriate icon based on activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'document':
      case 'task':
        return <FileText className="h-4 w-4" />;
      case 'repository':
        return <FolderGit2 className="h-4 w-4" />;
      case 'feedback':
        return <MessageSquare className="h-4 w-4" />;
      case 'commit':
        return <GitCommit className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>
          Recent activity and general information about this project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="mt-4 text-sm text-muted-foreground">Loading project overview...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2">
              <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activities found for this project.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description} by {activity.user.firstName} {activity.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.timestamp), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">Project Stats</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Repositories</p>
                  <p className="text-2xl font-bold">{stats.repositories}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Tasks</p>
                  <p className="text-2xl font-bold">{stats.tasks}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Feedback Items</p>
                  <p className="text-2xl font-bold">{stats.feedback}</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Evaluations</p>
                  <p className="text-2xl font-bold">{stats.evaluations}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 