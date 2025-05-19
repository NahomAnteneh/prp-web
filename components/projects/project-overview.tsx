'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileText, FolderGit2, MessageSquare, GitCommit, Loader2, BarChart, CheckSquare } from 'lucide-react';
import { Project } from './project-card';

// Activity types from the API
type ActivityAPIType = 'TASK' | 'EVALUATION' | 'FEEDBACK' | 'MERGE_REQUEST' | 'COMMIT';

// Mapping to our component's activity types
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

interface APIActivity {
  id: string;
  type: ActivityAPIType;
  title: string;
  status?: string;
  content?: string;
  comments?: string;
  message?: string;
  createdAt: string;
  creator: string;
}

interface ProjectStats {
  repositories: number;
  tasks: number;
  feedback: number;
  evaluations: number;
}

interface APIStats {
  stats: {
    tasks: {
      total: number;
      byStatus: Record<string, number>;
    };
    evaluations: {
      total: number;
    };
    feedback: {
      total: number;
      byStatus: Record<string, number>;
    };
    mergeRequests: {
      total: number;
      byStatus: Record<string, number>;
    };
    commits: {
      total: number;
    };
    members: {
      total: number;
    };
  };
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

  // Map API activity type to component activity type
  const mapActivityType = (apiType: ActivityAPIType): ActivityType => {
    switch (apiType) {
      case 'TASK':
        return 'task';
      case 'EVALUATION':
        return 'document';
      case 'FEEDBACK':
        return 'feedback';
      case 'MERGE_REQUEST':
        return 'repository';
      case 'COMMIT':
        return 'commit';
      default:
        return 'document';
    }
  };

  // Transform API activity to component activity
  const transformActivity = (apiActivity: APIActivity): Activity => {
    // Extract first and last name from creator string
    const nameParts = apiActivity.creator.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: apiActivity.id,
      type: mapActivityType(apiActivity.type),
      title: apiActivity.title,
      description: apiActivity.content || apiActivity.message || apiActivity.comments || 
                 `${apiActivity.type.toLowerCase()} ${apiActivity.status ? '- ' + apiActivity.status : ''}`,
      user: {
        userId: 'unknown', // API doesn't provide this
        firstName,
        lastName,
      },
      timestamp: apiActivity.createdAt,
    };
  };

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
        const statsData = await statsResponse.json() as APIStats;
        
        // Transform API activities to component activities
        if (activitiesData.activities && Array.isArray(activitiesData.activities)) {
          const transformedActivities = activitiesData.activities.map(transformActivity);
          setActivities(transformedActivities);
        } else {
          console.warn('Unexpected activities data format:', activitiesData);
          setActivities([]);
        }

        // Transform API stats to component stats
        if (statsData.stats) {
          setStats({
            repositories: statsData.stats.mergeRequests.total, // Using merge requests count as repository activity
            tasks: statsData.stats.tasks.total,
            feedback: statsData.stats.feedback.total,
            evaluations: statsData.stats.evaluations.total
          });
        } else {
          console.warn('Unexpected stats data format:', statsData);
        }
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
        return <FileText className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
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
              icon={<CheckSquare className="h-5 w-5" />} 
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