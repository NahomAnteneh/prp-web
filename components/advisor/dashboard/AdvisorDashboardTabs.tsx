"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Book, Activity, BellPlus } from 'lucide-react';
import AdvisorLayout from './AdvisorLayout';
import AdvisorDashboard from './AdvisorDashboard';
import ProjectsTab from './tabs/ProjectsTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import RequestsTab from './tabs/RequestsTab';
import { toast } from "sonner";

// Consistent Type Definitions

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
  groupUserName: string; // Added for direct access if needed from project context
  group: {
    groupUserName: string;
    name: string;
  };
  tasks?: ProjectTask[];
}

interface GroupWithProjects {
  groupUserName: string;
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
      groupUserName: string;
      name: string;
    };
  };
}

interface AdvisorRequestProject {
    id: string;
    title: string;
    description: string | null;
}

interface AdvisorRequest {
  id: string;
  status: string;
  requestMessage: string | null;
  createdAt: string;
  groupUserName: string; // Ensure API provides this directly on the request
  group: {
    groupUserName: string;
    name: string;
    description: string | null;
    leader: {
      userId: string;
      name: string | null; // Display name
      // username: string; // From session, might not be needed here if name is sufficient
    };
    projects?: AdvisorRequestProject[]; // If requests can be for specific projects
  };
}

interface DashboardData {
  advisor: {
    id: string; // This is likely the userId of the advisor
    name: string | null;
    username: string; // This is likely the actual username from auth
  };
  projectStats: ProjectStats;
  projectsByGroup: GroupWithProjects[];
  recentActivities: Activity[];
  pendingRequests: AdvisorRequest[];
  unreadNotificationsCount: number;
}

export default function AdvisorDashboardTabs() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  // Ensure userId is consistently typed, default to undefined if not available
  const userId: string | undefined = session?.user?.userId as string | undefined;


  const fetchData = async (isRefresh: boolean = false) => {
    if (!userId) {
      // If no userId, and we are trying to fetch, it's an issue.
      // Could set an error or simply not proceed.
      // For now, if !userId, don't fetch and ensure loading states are handled.
      if (!isRefresh) setIsLoading(false); // Stop initial load if no user
      setIsRefreshing(false);
      // setError("User not authenticated."); // Optional: set an error
      // toast.error("User not authenticated.");
      return;
    }
    if (!isRefresh) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      // The API endpoint does not need userId in the path as it uses server session
      const res = await fetch('/api/dashboard/advisor');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch dashboard data (${res.status})`);
      }
      const data: DashboardData = await res.json();
      setDashboardData(data);
      if (isRefresh) {
        toast.success("Dashboard refreshed");
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast.error(isRefresh ? "Failed to refresh dashboard" : "Failed to load dashboard data", { description: errorMessage });
    } finally {
      if (!isRefresh) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) { // Only fetch if userId is available
        fetchData();
    } else {
        // Handle case where session or userId might not be immediately available
        // or if the user is not logged in.
        setIsLoading(false); // Ensure loading stops if no user
    }
  }, [userId]);

  const refreshAllDashboardData = async () => {
    await fetchData(true);
  };

  const refreshProjects = async () => {
    await refreshAllDashboardData();
  };

  const refreshActivities = async () => {
    await refreshAllDashboardData();
  };

  const refreshRequests = async () => {
    await refreshAllDashboardData();
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!userId) return; // Should be covered by session check, but good practice
    setProcessingRequestId(requestId);
    try {
      const response = await fetch('/api/advisor/requests', { // This POST endpoint is correct
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to accept request');
      }
      const acceptedRequest = dashboardData?.pendingRequests?.find(r => r.id === requestId);
      const groupName = acceptedRequest?.group.name || 'Group';
      toast.success('Request accepted', { description: `You are now the advisor for ${groupName}.` });
      await refreshAllDashboardData(); 
    } catch (err: any) {
      console.error('Error accepting request:', err);
      toast.error('Action failed', { description: err.message || "Failed to accept request." });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!userId) return;
    setProcessingRequestId(requestId);
    try {
      const response = await fetch('/api/advisor/requests', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject request');
      }
      const rejectedRequest = dashboardData?.pendingRequests?.find(r => r.id === requestId);
      const groupName = rejectedRequest?.group.name || 'Group';
      toast.success('Request declined', { description: `You have declined the advisor request from ${groupName}.` });
      await refreshAllDashboardData();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      toast.error('Action failed', { description: err.message || "Failed to decline request." });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleViewProject = (projectId: string, groupUserName?: string) => { // Added groupUserName for context
    console.log(`View project: ${projectId} in group: ${groupUserName}`);
    // Example navigation: if (groupUserName) router.push(`/${groupUserName}/projects/${projectId}`);
  };

  const handleViewGroup = (groupUserName: string) => {
    console.log(`View group: ${groupUserName}`);
    // Example navigation: router.push(`/${groupUserName}`);
  };

  const handleViewActivity = (activityId: string, type: string, projectId: string, groupUserName?: string) => { // Added groupUserName
    console.log(`View activity: ${activityId} of type ${type} for project ${projectId} in group ${groupUserName}`);
    // Example navigation: if (groupUserName) router.push(`/${groupUserName}/projects/${projectId}#activity-${activityId}`);
  };

  return (
    <AdvisorLayout unreadNotifications={dashboardData?.unreadNotificationsCount || 0}>
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-1">
            <Home className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2 py-1">
            <Book className="h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2 py-1">
            <Activity className="h-4 w-4" /> Activities
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2 py-1">
            <BellPlus className="h-4 w-4" /> Requests
            {dashboardData && dashboardData.pendingRequests && dashboardData.pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {dashboardData.pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdvisorDashboard 
            initialData={dashboardData}
            onRefreshProjects={refreshProjects} 
            onRefreshActivities={refreshActivities} 
            isProjectsRefreshing={isRefreshing} 
            isActivitiesRefreshing={isRefreshing} 
            isLoading={isLoading} 
            error={error}
            // Pass handler for project clicks if AdvisorDashboard needs to navigate
            // onViewProject={handleViewProject} 
          />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsTab 
            projectsByGroup={dashboardData?.projectsByGroup || []}
            isLoading={isRefreshing} 
            onRefreshProjects={refreshProjects}
            // Pass handler for project clicks
            // onProjectSelect={(projectId, groupUserName) => handleViewProject(projectId, groupUserName)}
          />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesTab 
            initialActivities={dashboardData?.recentActivities || []} 
            onRefreshActivities={refreshActivities} 
            isRefreshing={isRefreshing} 
            onActivitySelect={(activityId, type, projectId, groupUserName) => handleViewActivity(activityId, type, projectId, groupUserName)} 
          />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsTab 
            pendingRequests={dashboardData?.pendingRequests || []} 
            isLoading={isRefreshing} 
            isProcessingRequest={processingRequestId}
            onRefreshRequests={refreshRequests} 
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            // Pass handler for viewing group/project details if needed from requests
            // onViewGroup={(groupUserName) => handleViewGroup(groupUserName)}
            // onNavigateToProject={(projectId, groupUserName) => handleViewProject(projectId, groupUserName)}
          />
        </TabsContent>
      </Tabs>
    </AdvisorLayout>
  );
} 