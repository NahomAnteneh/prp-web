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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import AdvisorLayout from './AdvisorLayout';

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  submissionDate: string | null;
  updatedAt: string;
  group: {
    id: string;
    name: string;
  };
}

interface GroupWithProjects {
  groupId: string;
  groupName: string;
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
      id: string;
      name: string;
    };
  };
}

interface AdvisorRequest {
  id: string;
  status: string;
  requestMessage: string | null;
  createdAt: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    leader: {
      id: string;
      name: string | null;
      username: string;
    };
    project?: {
      id: string;
      title: string;
      description: string | null;
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
  pendingRequests: AdvisorRequest[];
  unreadNotificationsCount: number;
}

export default function AdvisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/advisor');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/advisor-requests/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'accept',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept request');
      }

      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/advisor-requests/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action: 'reject',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request. Please try again.');
    }
  };

  if (loading) {
    return (
      <AdvisorLayout>
        <div className="flex items-center justify-center h-screen">
          <Spinner className="h-12 w-12" />
        </div>
      </AdvisorLayout>
    );
  }

  if (error) {
    return (
      <AdvisorLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </AdvisorLayout>
    );
  }

  if (!dashboardData) {
    return (
      <AdvisorLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-4">We couldn&apos;t find any data for your dashboard.</p>
          <Button onClick={fetchDashboardData}>Refresh</Button>
        </div>
      </AdvisorLayout>
    );
  }

  const { projectStats, projectsByGroup, recentActivities, pendingRequests, unreadNotificationsCount } = dashboardData;

  return (
    <AdvisorLayout unreadNotifications={unreadNotificationsCount}>
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {dashboardData.advisor.name || 'Advisor'}</h1>
            <p className="text-gray-500">Here&apos;s what&apos;s happening with the projects you&apos;re advising.</p>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Book className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.total}</div>
              <p className="text-xs text-gray-500">Projects under your advisement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.active}</div>
              <p className="text-xs text-gray-500">Currently in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.completed}</div>
              <p className="text-xs text-gray-500">Successfully completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Student Groups</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectsByGroup.length}</div>
              <p className="text-xs text-gray-500">Under your advisement</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          {/* Groups and Projects */}
          <Card className="md:col-span-8">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">Groups & Projects</CardTitle>
              <CardDescription>
                Overview of the student groups and their projects under your advisement.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {projectsByGroup.length > 0 ? (
                <Tabs defaultValue={projectsByGroup[0].groupId} className="w-full">
                  <div className="border-b bg-gray-50 p-2">
                    <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-1">
                      {projectsByGroup.map((group) => (
                        <TabsTrigger 
                          key={group.groupId} 
                          value={group.groupId}
                          className="min-w-[120px] data-[state=active]:bg-white data-[state=active]:shadow-sm py-2"
                        >
                          {group.groupName}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  
                  {projectsByGroup.map((group) => (
                    <TabsContent key={group.groupId} value={group.groupId} className="p-0 m-0">
                      <div className="p-4 bg-blue-50 border-b">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-blue-900">{group.groupName}</h3>
                            <p className="text-sm text-blue-700">{group.groupDescription || 'No description available'}</p>
                          </div>
                          <Badge variant="outline" className="mt-1 bg-white">
                            {group.projects.length} {group.projects.length === 1 ? 'Project' : 'Projects'}
                          </Badge>
                        </div>
                      </div>
                      
                      {group.projects.length > 0 ? (
                        <div className="divide-y">
                          {group.projects.map((project) => (
                            <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-lg">{project.title}</h4>
                                    <Badge variant={
                                      project.status === 'Active' ? 'default' :
                                      project.status === 'Completed' ? 'secondary' :
                                      'outline'
                                    }>
                                      {project.status || 'Unknown Status'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{project.description || 'No description available'}</p>
                                </div>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="ml-2"
                                  onClick={() => router.push(`/dashboard/advisor/projects/${project.id}`)}
                                >
                                  View Details <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                  <span>
                                    {project.submissionDate ? 
                                      <>Due: <span className="font-medium">{new Date(project.submissionDate).toLocaleDateString()}</span></> : 
                                      'No deadline set'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                  <span>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-gray-500">This group doesn&apos;t have any projects yet.</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-center py-12 px-4">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Groups Under Your Advisement</h3>
                  <p className="text-gray-500 max-w-md mx-auto">You currently don&apos;t advise any groups or projects. Groups will appear here once you accept advisor requests.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advisor Requests */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>
                Groups requesting you as their advisor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests && pendingRequests.length > 0 ? (
                  pendingRequests.map(request => (
                    <div key={request.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{request.group.name}</h4>
                          <p className="text-sm text-gray-500">
                            {request.group.project ? `Project: ${request.group.project.title}` : 'No associated project'}
                          </p>
                        </div>
                      </div>
                      
                      {request.requestMessage && (
                        <div className="border-l-2 border-gray-200 pl-2 text-sm italic">
                          {request.requestMessage}
                        </div>
                      )}
                      
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full" 
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          className="w-full" 
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No pending advisor requests.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest activities across your advised projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const date = activity.type === 'feedback' 
                    ? new Date(activity.createdAt!) 
                    : new Date(activity.updatedAt!);
                    
                  return (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-start pb-4 border-b last:border-b-0 last:pb-0">
                      <div className="mr-4">
                        <Avatar className="h-10 w-10">
                          {activity.type === 'feedback' ? (
                            <MessageSquare className="h-5 w-5" />
                          ) : (
                            <BarChart2 className="h-5 w-5" />
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
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>{activity.project.title}</span>
                          <span>•</span>
                          <span>{activity.project.group.name}</span>
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
        </Card>
      </div>
    </AdvisorLayout>
  );
} 