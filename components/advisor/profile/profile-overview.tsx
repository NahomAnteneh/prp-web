'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Award, UserCheck, BookOpen, MessageSquare, BarChart2, ExternalLink, Activity as ActivityIcon, Info, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";

interface AdvisorStats {
  currentAdvisees: number;
  completedProjects: number;
  avgRating: number;
  evaluatedProjects: number;
}

interface Activity {
  type: 'feedback' | 'task' | 'submission' | 'comment' | 'evaluation';
  id: string;
  createdAt: string;
  content?: string;
  title?: string;
  status?: string;
  link?: string;
  project?: {
    id: string;
    title: string;
  };
  student?: {
    id: string;
    name: string;
  };
}

interface ProfileOverviewProps {
  userId: string;
  isOwner?: boolean;
}

export default function ProfileOverview({ userId, isOwner = false }: ProfileOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [advisorInfo, setAdvisorInfo] = useState<any | null>(null);
  const [stats, setStats] = useState<AdvisorStats>({
    currentAdvisees: 0,
    completedProjects: 0,
    avgRating: 0,
    evaluatedProjects: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const advisorResponse = await fetch(`/api/users/${userId}/details`);
        const advisorData = await advisorResponse.json();
        if (!advisorResponse.ok) throw new Error(advisorData.message || 'Failed to fetch advisor details');
        setAdvisorInfo(advisorData);

        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        const statsData = await statsResponse.json();
        if (!statsResponse.ok) throw new Error(statsData.message || 'Failed to fetch stats');
        setStats({
          currentAdvisees: statsData.currentAdvisees || 0,
          completedProjects: statsData.completedProjects || 0,
          avgRating: statsData.avgRating || 0,
          evaluatedProjects: statsData.evaluatedProjects || 0
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        toast.error('Error fetching advisor details', { description: errorMessage });
        setAdvisorInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchActivities = async () => {
      try {
        setIsActivitiesLoading(true);
        const activitiesResponse = await fetch(`/api/users/${userId}/activities?limit=5`);
        const activitiesData = await activitiesResponse.json();
        if (!activitiesResponse.ok) throw new Error(activitiesData.message || 'Failed to fetch recent activities');
        setRecentActivities(activitiesData.activities || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        toast.error('Error fetching recent activities', { description: errorMessage });
        setRecentActivities([]);
      } finally {
        setIsActivitiesLoading(false);
      }
    };

    fetchInitialData();
    fetchActivities();
  }, [userId]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'feedback': return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'task': return <BarChart2 className="h-5 w-5 text-green-500" />;
      case 'submission': return <BookOpen className="h-5 w-5 text-purple-500" />;
      case 'comment': return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      case 'evaluation': return <UserCheck className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-2 bg-muted rounded-full h-9 w-9"></div>
                  <div className="h-7 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{stats.currentAdvisees}</div>
              <div className="text-sm text-muted-foreground">Current Advisees</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-100 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <BookOpen className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <div className="text-sm text-muted-foreground">Completed Projects</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/20 dark:to-lime-950/20 border-green-100 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                <ListChecks className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold">{stats.evaluatedProjects}</div>
              <div className="text-sm text-muted-foreground">Evaluated Projects</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <Award className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isActivitiesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
          ) : recentActivities.length > 0 ? (
            <ul className="space-y-3">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.title || activity.content || `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} Update`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {activity.project && (
                        <> • <Link href={`/projects/${activity.project.id}`} className="hover:underline text-primary/80">{activity.project.title}</Link></>
                      )}
                      {activity.student && (
                         <> • <Link href={`/${activity.student.id}`} className="hover:underline text-primary/80">{activity.student.name}</Link></>
                      )}
                    </p>
                  </div>
                  {activity.link && (
                    <Button variant="ghost" size="icon" asChild className="ml-auto self-center">
                        <Link href={activity.link} target="_blank" rel="noopener noreferrer" aria-label="View details">
                            <ExternalLink className="h-4 w-4 text-muted-foreground"/>
                        </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent activities to display.</p>
          )}
        </CardContent>
        {recentActivities.length > 0 && (
           <CardFooter className="border-t pt-3">
            <Button variant="link" size="sm" asChild className="mx-auto">
                <Link href={`/users/${userId}/activities`}>View All Activities</Link>
            </Button>
           </CardFooter>
        )}
      </Card>
    </div>
  );
} 