"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  Home, // Keep Home for Overview tab icon
  ClipboardCheck // Keep ClipboardCheck for Projects tab icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added Card components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import EvaluatorLayout from './EvaluatorLayout';
import OverviewTab from './tabs/OverviewTab';
import CompletedTab from './tabs/CompletedTab';
import ProjectsTab from './tabs/ProjectsTab';

// Interface for Overview data (Announcements, new Stats)
interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  link?: string;
  type?: 'info' | 'warning' | 'success' | 'urgent';
}

interface EvaluatorOverviewStats {
  totalAssigned: number;
  inProgress: number; // Placeholder, to be implemented
  completedThisWeek: number;
  pendingFeedback: number;
  averageEvaluationTime: string; // e.g., "2 days", placeholder
}

interface EvaluatorDashboardData {
  evaluatorName: string | null;
  announcements: Announcement[];
  stats: EvaluatorOverviewStats;
  unreadNotificationsCount: number;
  // Potentially add data for other tabs here if fetched together
}

// Define props for EvaluatorDashboard - aligning with AdvisorDashboard structure
interface EvaluatorDashboardProps {
  // If data is fetched in a parent, it would be passed like this:
  // initialOverviewData: EvaluatorDashboardData | null;
  // onRefreshOverview: () => Promise<void>; 
  // isOverviewLoading: boolean;
  // overviewError: string | null;
}

export default function EvaluatorDashboard(/*props: EvaluatorDashboardProps*/) {
  const router = useRouter(); // Keep router if needed for navigation from dashboard itself

  // State for overall dashboard data, loading, and error
  const [dashboardData, setDashboardData] = useState<EvaluatorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Specific refreshing states, similar to AdvisorDashboard
  const [isOverviewRefreshing, setIsOverviewRefreshing] = useState(false);
  // Add more for other tabs if they have independent refresh logic, e.g.:
  // const [isProjectsRefreshing, setIsProjectsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true); // Main loading state
    setIsOverviewRefreshing(true); // Also set specific refresh state for overview
    setError(null);
    try {
      // In a real scenario, you might fetch all necessary data here or have separate fetches
      const response = await fetch('/api/dashboard/evaluator/overview'); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty obj
        throw new Error(errorData.error || `Failed to fetch overview data: ${response.statusText}`);
      }
      const data: EvaluatorDashboardData = await response.json();
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error("Failed to load dashboard data", { description: errorMessage });
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsOverviewRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefreshOverview = useCallback(async () => {
    toast.info("Refreshing overview data...");
    setIsOverviewRefreshing(true); // Set specific refreshing true
    // setError(null); // Optionally clear error before refresh
    try {
        const response = await fetch('/api/dashboard/evaluator/overview');
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to refresh overview: ${response.statusText}`);
        }
        const data: EvaluatorDashboardData = await response.json();
        setDashboardData(data); // Update dashboardData which includes overview
        toast.success("Overview data refreshed!");
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while refreshing';
        setError(errorMessage); // Set main error state if refresh fails
        toast.error("Failed to refresh overview", { description: errorMessage });
    } finally {
        setIsOverviewRefreshing(false);
    }
}, []);

  // Loading state similar to AdvisorDashboard
  if (isLoading && !dashboardData) { // Initial loading phase
    return (
      <EvaluatorLayout unreadNotifications={0}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </EvaluatorLayout>
    );
  }

  // Error state similar to AdvisorDashboard
  if (error && !dashboardData) { // Show full page error if initial load fails
    return (
      <EvaluatorLayout unreadNotifications={0}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground mb-4 text-center">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </EvaluatorLayout>
    );
  }

  // No data state (after loading attempt, if dashboardData is still null but no error string)
  if (!dashboardData && !isLoading && !error) {
    return (
      <EvaluatorLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Users className="h-16 w-16 text-muted-foreground mb-4" /> {/* Users icon for empty state */}
          <h2 className="text-xl font-semibold mb-2">No data available</h2>
          <p className="text-muted-foreground text-center mb-4">Dashboard information could not be loaded or is currently unavailable.</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </EvaluatorLayout>
    );
  }

  // If dashboardData is available (even if some parts are empty, tabs will handle that)
  return (
    <EvaluatorLayout unreadNotifications={dashboardData?.unreadNotificationsCount || 0}>
      {/* Optional: Welcome message, if evaluatorName is present */}
      {/* {dashboardData?.evaluatorName && ( 
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Welcome, {dashboardData.evaluatorName}!
        </h1>
      )} */} 

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="block w-full grid grid-cols-1 sm:grid-cols-3 h-auto bg-muted/60 rounded-md p-1">
          <TabsTrigger value="overview" className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all">
            <Home className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all">
            <ClipboardCheck className="h-4 w-4" /> Assigned Projects
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all">
            <CheckCircle className="h-4 w-4" /> Completed Evaluations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {dashboardData ? (
            <OverviewTab 
              evaluatorName={dashboardData.evaluatorName}
              announcements={dashboardData.announcements} 
              stats={dashboardData.stats}
              onRefresh={handleRefreshOverview} // Pass the specific refresh handler
              isRefreshing={isOverviewRefreshing} // Pass the specific refreshing state
              // Pass error related to this specific tab if needed, or rely on global error for now
              // error={error} // Could pass error if OverviewTab is to display its own specific errors from refresh
            />
          ) : isOverviewRefreshing || isLoading ? (
            // More specific skeleton for overview tab content if needed
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            // This case should ideally be handled by the main error/no-data block above
            // but as a fallback for the tab content itself:
            <div className="text-center py-10 text-muted-foreground">Overview data could not be loaded. Try refreshing.</div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          {/* 
            Pass relevant data and handlers to ProjectsTab. 
            Example: 
            <ProjectsTab 
              projectsData={dashboardData?.projects} // Assuming projects data is part of EvaluatorDashboardData
              isLoading={isProjectsLoading || isLoading} 
              error={projectsError || error}
              onRefresh={handleRefreshProjects}
            /> 
          */}
          <ProjectsTab /> {/* Placeholder - will need data and props */}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {/* <CompletedTab completedItems={dashboardData?.completed} ... /> */}
          <CompletedTab /> {/* Placeholder */}
        </TabsContent>
      </Tabs>
    </EvaluatorLayout>
  );
} 