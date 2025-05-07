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
  X
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
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  // Section loading states
  const [refreshingProjects, setRefreshingProjects] = useState(false);
  const [refreshingActivities, setRefreshingActivities] = useState(false);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  
  // Action loading states
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  
  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    requestId: string | null;
    action: 'accept' | 'reject' | null;
    groupName: string;
  }>({
    open: false,
    requestId: null,
    action: null,
    groupName: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Set active tab when dashboard data loads
    if (dashboardData?.projectsByGroup.length) {
      setActiveTabId(dashboardData.projectsByGroup[0].groupId);
    }
  }, [dashboardData]);

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

  const refreshProjects = async () => {
    try {
      setRefreshingProjects(true);
      const response = await fetch('/api/dashboard/advisor/projects');
      
      if (!response.ok) {
        throw new Error('Failed to refresh projects data');
      }
      
      const data = await response.json();
      
      // Update only the projects part of the dashboard data
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          projectStats: data.projectStats,
          projectsByGroup: data.projectsByGroup
        });
      }
      
      toast.success('Projects refreshed', {
        description: "The projects data has been updated."
      });
    } catch (err) {
      console.error('Error refreshing projects:', err);
      toast.error('Refresh failed', {
        description: "Could not refresh projects data. Please try again."
      });
    } finally {
      setRefreshingProjects(false);
    }
  };

  const refreshActivities = async () => {
    try {
      setRefreshingActivities(true);
      const response = await fetch('/api/dashboard/advisor/activities');
      
      if (!response.ok) {
        throw new Error('Failed to refresh activities data');
      }
      
      const data = await response.json();
      
      // Update only the activities part of the dashboard data
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          recentActivities: data.recentActivities
        });
      }
      
      toast.success('Activities refreshed', {
        description: "The activities data has been updated."
      });
    } catch (err) {
      console.error('Error refreshing activities:', err);
      toast.error('Refresh failed', {
        description: "Could not refresh activities data. Please try again."
      });
    } finally {
      setRefreshingActivities(false);
    }
  };

  const refreshRequests = async () => {
    try {
      setRefreshingRequests(true);
      const response = await fetch('/api/dashboard/advisor/requests');
      
      if (!response.ok) {
        throw new Error('Failed to refresh requests data');
      }
      
      const data = await response.json();
      
      // Update only the requests part of the dashboard data
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          pendingRequests: data.pendingRequests
        });
      }
      
      toast.success('Requests refreshed', {
        description: "The pending requests data has been updated."
      });
    } catch (err) {
      console.error('Error refreshing requests:', err);
      toast.error('Refresh failed', {
        description: "Could not refresh requests data. Please try again."
      });
    } finally {
      setRefreshingRequests(false);
    }
  };

  const openConfirmDialog = (requestId: string, action: 'accept' | 'reject', groupName: string) => {
    setConfirmDialog({
      open: true,
      requestId,
      action,
      groupName
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      requestId: null,
      action: null,
      groupName: ''
    });
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId);
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

      // Find the group name for the toast
      const groupName = dashboardData?.pendingRequests.find(r => r.id === requestId)?.group.name || 'Group';
      
      // Close the dialog
      closeConfirmDialog();
      
      // Show success toast
      toast.success('Request accepted', {
        description: `You are now the advisor for ${groupName}.`
      });
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      console.error('Error accepting request:', err);
      toast.error('Action failed', {
        description: "Failed to accept request. Please try again."
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId);
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

      // Find the group name for the toast
      const groupName = dashboardData?.pendingRequests.find(r => r.id === requestId)?.group.name || 'Group';
      
      // Close the dialog
      closeConfirmDialog();
      
      // Show success toast
      toast.success('Request declined', {
        description: `You have declined the advisor request from ${groupName}.`
      });
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error('Action failed', {
        description: "Failed to decline request. Please try again."
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.requestId || !confirmDialog.action) return;
    
    if (confirmDialog.action === 'accept') {
      handleAcceptRequest(confirmDialog.requestId);
    } else {
      handleRejectRequest(confirmDialog.requestId);
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
        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmDialog.action === 'accept' 
                  ? 'Accept advisor request?' 
                  : 'Decline advisor request?'
                }
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.action === 'accept' 
                  ? `You are about to become the advisor for ${confirmDialog.groupName}. This action cannot be undone.`
                  : `You are about to decline the request from ${confirmDialog.groupName}. This action cannot be undone.`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex items-center">
              <Button 
                variant="outline" 
                onClick={closeConfirmDialog}
                disabled={!!processingRequestId}
              >
                Cancel
              </Button>
              <Button 
                variant={confirmDialog.action === 'accept' ? 'default' : 'destructive'}
                onClick={handleConfirmAction}
                disabled={!!processingRequestId}
              >
                {processingRequestId && <Spinner className="mr-2 h-4 w-4" />}
                {confirmDialog.action === 'accept' ? 'Accept' : 'Decline'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Welcome message */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {dashboardData.advisor.name || 'Advisor'}</h1>
            <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with the projects you&apos;re advising.</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-3 md:mt-0"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <Card className="border-l-4 border-l-orange-500">
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
            <CardHeader className="border-b flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl">Groups & Projects</CardTitle>
                <CardDescription>
                  Overview of the student groups and their projects under your advisement.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshProjects}
                disabled={refreshingProjects}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshingProjects ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {refreshingProjects ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : projectsByGroup.length > 0 ? (
                <Tabs value={activeTabId || projectsByGroup[0].groupId} className="w-full">
                  <div className="border-b bg-gray-50 p-2">
                    <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-1">
                      {projectsByGroup.map((group) => (
                        <TabsTrigger 
                          key={group.groupId} 
                          value={group.groupId}
                          className="min-w-[120px] data-[state=active]:bg-white data-[state=active]:shadow-sm py-2"
                          onClick={() => setActiveTabId(group.groupId)}
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
                            <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/advisor/projects/${project.id}`)}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-lg">{project.title}</h4>
                                    <Badge variant={
                                      project.status === 'Active' ? 'default' :
                                      project.status === 'Completed' ? 'secondary' :
                                      project.status === 'Pending' ? 'outline' :
                                      'outline'
                                    }>
                                      {project.status || 'Unknown Status'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{project.description || 'No description available'}</p>
                                </div>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="ml-2 rounded-full hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/advisor/projects/${project.id}`);
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
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
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Groups requesting you as their advisor.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshRequests}
                disabled={refreshingRequests}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshingRequests ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {refreshingRequests ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests && pendingRequests.length > 0 ? (
                    pendingRequests.map(request => (
                      <div key={request.id} className="border rounded-lg p-3 space-y-2 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{request.group.name}</h4>
                            <p className="text-sm text-gray-500">
                              {request.group.project ? `Project: ${request.group.project.title}` : 'No associated project'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Requested: {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {request.requestMessage && (
                          <div className="border-l-2 border-gray-200 pl-3 py-1 text-sm italic bg-gray-50 rounded-r-md">
                            "{request.requestMessage}"
                          </div>
                        )}
                        
                        <div className="flex space-x-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full" 
                            onClick={() => openConfirmDialog(request.id, 'reject', request.group.name)}
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id && confirmDialog.action === 'reject' ? (
                              <Spinner className="h-4 w-4 mr-2" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 mr-2" />
                            )}
                            Decline
                          </Button>
                          <Button 
                            size="sm" 
                            className="w-full" 
                            onClick={() => openConfirmDialog(request.id, 'accept', request.group.name)}
                            disabled={processingRequestId === request.id}
                          >
                            {processingRequestId === request.id && confirmDialog.action === 'accept' ? (
                              <Spinner className="h-4 w-4 mr-2" />
                            ) : (
                              <ThumbsUp className="h-4 w-4 mr-2" />
                            )}
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <X className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No pending advisor requests.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
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
                disabled={refreshingActivities}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshingActivities ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {refreshingActivities ? (
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
                      onClick={() => router.push(`/dashboard/advisor/projects/${activity.project.id}`)}
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
    </AdvisorLayout>
  );
} 