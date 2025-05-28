"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  BarChart2,
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  Filter,
  Search,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import EvaluatorLayout from './EvaluatorLayout';
import AssignedProjects from './AssignedProjects';
import EvaluationForms from './EvaluationForms';
import ProjectFeedback from './ProjectFeedback';
import CompletedEvaluations from './CompletedEvaluations';

// Interface for project evaluation stats
interface EvaluationStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  pendingFeedback: number;
}

// Interface for evaluator dashboard data
interface DashboardData {
  evaluator: {
    id: string;
    name: string | null;
    username: string;
  };
  evaluationStats: EvaluationStats;
  unreadNotificationsCount: number;
}

export default function EvaluatorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState("assigned");
  
  // Section loading states
  const [refreshingDashboard, setRefreshingDashboard] = useState(false);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/dashboard/evaluator');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Dashboard API response:", data);
      setDashboardData(data);
      setLoading(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshingDashboard(true);
    await fetchDashboardData();
    setRefreshingDashboard(false);
    toast.success('Dashboard refreshed');
  };

  if (loading) {
    return (
      <EvaluatorLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <Spinner className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-xl font-bold">Loading Dashboard</h2>
          <p className="text-gray-500">Fetching your evaluation data...</p>
        </div>
      </EvaluatorLayout>
    );
  }

  if (error) {
    return (
      <EvaluatorLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </EvaluatorLayout>
    );
  }

  if (!dashboardData) {
    return (
      <EvaluatorLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-4">We couldn&apos;t find any data for your dashboard.</p>
          <Button onClick={fetchDashboardData}>Refresh</Button>
        </div>
      </EvaluatorLayout>
    );
  }

  const { evaluationStats, unreadNotificationsCount } = dashboardData;

  return (
    <EvaluatorLayout unreadNotifications={unreadNotificationsCount}>
      <div className="space-y-6">
        {/* Header with welcome message and refresh button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {dashboardData.evaluator.name || 'Evaluator'}</h1>
            <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your assigned evaluations.</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-3 md:mt-0"
            onClick={handleRefresh}
            disabled={refreshingDashboard}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshingDashboard ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluationStats.totalAssigned}</div>
              <p className="text-xs text-gray-500">Projects assigned for evaluation</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluationStats.inProgress}</div>
              <p className="text-xs text-gray-500">Evaluations in progress</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BarChart2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluationStats.completed}</div>
              <p className="text-xs text-gray-500">Completed evaluations</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluationStats.pendingFeedback}</div>
              <p className="text-xs text-gray-500">Projects awaiting feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Main tabbed interface */}
        <Tabs defaultValue="assigned" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="assigned">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Assigned Projects
              </TabsTrigger>
              <TabsTrigger value="evaluation-forms">
                <FileText className="h-4 w-4 mr-2" />
                Evaluation Forms
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="completed">
                <BarChart2 className="h-4 w-4 mr-2" />
                Completed
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden md:flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search projects..." 
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TabsContent value="assigned" className="space-y-4">
            <AssignedProjects />
          </TabsContent>
          
          <TabsContent value="evaluation-forms" className="space-y-4">
            <EvaluationForms />
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            <ProjectFeedback />
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            <CompletedEvaluations />
          </TabsContent>
        </Tabs>
      </div>
    </EvaluatorLayout>
  );
} 