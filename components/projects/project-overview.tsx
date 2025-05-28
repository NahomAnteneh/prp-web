'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText, FolderGit2, MessageSquare, GitCommit, Loader2, BarChart } from 'lucide-react';
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
        // Fetch activities and stats in parallel
        const [activitiesResponse, statsResponse] = await Promise.all([
          fetch(`/api/groups/${ownerId}/projects/${projectId}/activities`),
          fetch(`/api/groups/${ownerId}/projects/${projectId}/stats`)
        ]);

        if (!activitiesResponse.ok) {
          throw new Error(`Failed to fetch activities: ${activitiesResponse.statusText}`);
        }

        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch project stats: ${statsResponse.statusText}`);
        }

        const activitiesData = await activitiesResponse.json();
        const statsData = await statsResponse.json();
        
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
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

  const StatCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
    <div className="flex items-center p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
          <p className="mt-4 text-sm text-muted-foreground">Loading project overview...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-red-500">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Please try again later or contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Project Statistics</CardTitle>
          <CardDescription>
            Key metrics and statistics for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Repositories" 
              value={stats.repositories} 
              icon={<FolderGit2 className="h-5 w-5" />} 
            />
            <StatCard 
              label="Tasks" 
              value={stats.tasks} 
              icon={<FileText className="h-5 w-5" />} 
            />
            <StatCard 
              label="Feedback Items" 
              value={stats.feedback} 
              icon={<MessageSquare className="h-5 w-5" />} 
            />
            <StatCard 
              label="Evaluations" 
              value={stats.evaluations} 
              icon={<BarChart className="h-5 w-5" />} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes in this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-background/50">
              <p className="text-muted-foreground">No recent activities found for this project.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description} by {activity.user.firstName} {activity.user.lastName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}