'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, FileText, FolderGit2, UserCheck, LayoutDashboard, MessageSquare, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Navbar from '@/components/student/navbar';
import Footer from '@/components/student/footer';
import {
  ProjectOverview,
  ProjectRepositories,
  ProjectDocuments,
  ProjectAdvisor,
  ProjectFeedback,
  ProjectSettings,
  ProjectTasks
} from '@/components/projects';

// Define proper interface for the project data
interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  group: {
    name: string;
    groupUserName: string;
  };
  advisor?: {
    userId: string;
    firstName: string;
    lastName: string;
  };
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const ownerId = params?.ownerId as string;
  const projectId = params?.projectId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Error fetching project data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        setError(errorMessage);
        toast.error('Error loading project', { 
          description: errorMessage 
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (ownerId && projectId) {
      fetchProjectData();
    }
  }, [ownerId, projectId]);

  // Helper function to get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !project ? (
          <div className="container max-w-6xl mx-auto py-10 text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                Error Loading Project
              </h2>
              <p className="text-red-600 dark:text-red-300">
                {error || "Project not found. Please check the URL and try again."}
              </p>
            </div>
          </div>
        ) : (
          <div className="container max-w-6xl mx-auto py-10">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-3xl font-bold">{project.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {project.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(project.status)}`}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Group</span>
                    <span className="font-medium">{project.group.name}</span>
                  </div>
                  {project.advisor && (
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Advisor</span>
                      <span className="font-medium">{project.advisor.firstName} {project.advisor.lastName}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {format(new Date(project.createdAt), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full grid grid-cols-7">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="repositories" className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Repositories</span>
                  <span className="sm:hidden">Repos</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                  <span className="sm:hidden">Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="advisor" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Advisor</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <ProjectOverview ownerId={ownerId} projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="repositories" className="mt-6">
                <ProjectRepositories ownerId={ownerId} projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6">
                <ProjectTasks ownerId={ownerId} projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="advisor" className="mt-6">
                <ProjectAdvisor ownerId={ownerId} projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                <ProjectDocuments ownerId={ownerId} projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="feedback" className="mt-6">
                <ProjectFeedback ownerId={ownerId} projectId={projectId} />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <ProjectSettings ownerId={ownerId} projectId={projectId} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 