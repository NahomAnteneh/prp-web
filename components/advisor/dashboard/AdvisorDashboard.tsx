"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Book, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart2,
  ChevronRight,
  Calendar,
  MessageSquare,
  RefreshCw,
  Filter,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
}

interface ProjectTask {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  submissionDate: string | null;
  updatedAt: string;
  groupUserName: string;
  group: {
    groupUserName: string;
    name: string;
  };
  tasks?: ProjectTask[];
}

interface GroupWithProjects {
  groupName: string;
  groupUserName: string;
  groupDescription: string | null;
  projects: Project[];
}

interface Activity {
  type: 'feedback' | 'task';
  id: string;
  createdAt?: string;
  updatedAt?: string;
  content?: string;
  title?: string;
  status?: string;
  project: {
    id: string;
    title: string;
    group: {
      groupUserName: string;
      name: string;
    };
  };
}

interface DashboardData {
  advisor: {
    id: string;
    name: string | null;
    username: string;
  };
  projectStats: ProjectStats;
  projectsByGroup: GroupWithProjects[];
  recentActivities: Activity[];
  unreadNotificationsCount: number;
}

interface AdvisorDashboardProps {
  initialData: DashboardData | null;
  onRefreshProjects: () => Promise<void>;
  onRefreshActivities: () => Promise<void>;
  isProjectsRefreshing: boolean;
  isActivitiesRefreshing: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function AdvisorDashboard({
  initialData,
  onRefreshProjects,
  onRefreshActivities,
  isProjectsRefreshing,
  isActivitiesRefreshing,
  isLoading,
  error
}: AdvisorDashboardProps) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  useEffect(() => {
    setDashboardData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (dashboardData?.projectsByGroup && dashboardData.projectsByGroup.length > 0) {
      const currentActiveGroupExists = dashboardData.projectsByGroup.some(g => g.groupUserName === activeTabId);
      if (!currentActiveGroupExists) {
        setActiveTabId(dashboardData.projectsByGroup[0].groupUserName);
      }
    } else {
      setActiveTabId(null);
    }
  }, [dashboardData, activeTabId]);

  const refreshProjects = async () => {
    await onRefreshProjects();
  };

  const refreshActivities = async () => {
    await onRefreshActivities();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load dashboard data</h2>
        <p className="text-muted-foreground mb-4 text-center">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No data available</h2>
        <p className="text-muted-foreground">Dashboard information could not be loaded.</p>
      </div>
    );
  }

  const { advisor, projectStats, recentActivities } = dashboardData;

  const allProjects = dashboardData.projectsByGroup.flatMap(group => 
    group.projects.map(project => ({ ...project, groupName: group.groupName, groupUserName: group.groupUserName }))
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Book className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.total}</div>
            <p className="text-xs text-gray-500">Projects under your advisement</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.active}</div>
            <p className="text-xs text-gray-500">Currently in progress</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.completed}</div>
            <p className="text-xs text-gray-500">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest activities across your advised projects.
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshActivities}
              disabled={isActivitiesRefreshing}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isActivitiesRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isActivitiesRefreshing ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const date = activity.type === 'feedback' 
                  ? new Date(activity.createdAt!) 
                  : new Date(activity.updatedAt!);
                  
                return (
                  <div 
                    key={`${activity.type}-${activity.id}`} 
                    className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/${activity.project.group.groupUserName}/projects/${activity.project.id}`)}
                  >
                    <div className="mr-4">
                      <Avatar className={`h-10 w-10 ${activity.type === 'feedback' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {activity.type === 'feedback' ? (
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                        ) : (
                          <BarChart2 className="h-5 w-5 text-green-500" />
                        )}
                        <AvatarFallback>{activity.type === 'feedback' ? 'FB' : 'TS'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {activity.type === 'feedback' 
                            ? 'New Feedback' 
                            : `Task Status: ${activity.status}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {activity.type === 'feedback' 
                          ? activity.content
                          : activity.title}
                      </p>
                      <div className="flex items-center space-x-1 text-xs">
                        <Badge variant="outline" className="px-2 py-0 text-xs font-normal">
                          {activity.project.title}
                        </Badge>
                        <span>•</span>
                        <span className="text-gray-500">{activity.project.group.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activities to display.</p>
            </div>
          )}
        </CardContent>
        {recentActivities && recentActivities.length > 0 && (
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/advisor/activities')}>
              View All Activities
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 