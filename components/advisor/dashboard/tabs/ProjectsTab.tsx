"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Book, 
  ChevronRight,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";

// Interfaces (mirroring structure from AdvisorDashboard/AdvisorDashboardTabs)
interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  submissionDate: string | null;
  updatedAt: string;
  groupUserName: string; // Added to align with parent component and API
  group: {
    // id: string; // Replaced by groupUserName for consistency
    groupUserName: string; // Align with parent and API structure
    name: string;
  };
  // tasks?: any[]; // If tasks need to be shown here, define their structure too
}

interface GroupWithProjects {
  // groupId: string; // Replaced by groupUserName
  groupName: string;
  groupUserName: string; // This is the primary identifier from parent
  groupDescription: string | null;
  projects: Project[];
}

interface ProjectsTabProps {
  projectsByGroup: GroupWithProjects[];
  isLoading: boolean; // Represents isProjectsRefreshing from parent
  onRefreshProjects: () => Promise<void>;
  // onProjectSelect?: (projectId: string, groupId: string, groupUserName: string) => void; // Optional: if needed for other actions
}

export default function ProjectsTab({ 
  projectsByGroup, 
  isLoading, 
  onRefreshProjects 
}: ProjectsTabProps) {
  const router = useRouter();

  if (isLoading && (!projectsByGroup || projectsByGroup.length === 0)) {
    return (
      <Card>
        <CardHeader className="border-b flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">Advised Projects</CardTitle>
            <CardDescription>
              Overview of student projects under your advisement.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Refresh Projects
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalProjects = projectsByGroup.reduce((acc, group) => acc + group.projects.length, 0);

  return (
    <Card>
      <CardHeader className="border-b flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Advised Projects</CardTitle>
          <CardDescription>
            {totalProjects > 0 
              ? `Displaying ${totalProjects} project(s) under your advisement.`
              : "No projects currently under your advisement."}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefreshProjects}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Projects
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
            <div className="p-6 space-y-4"> {/* Show skeleton if loading even if there's old data */}
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : totalProjects > 0 ? (
          <div className="divide-y">
            {projectsByGroup.map((group) => (
              group.projects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(`/${group.groupUserName}/projects/${project.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-lg hover:text-primary transition-colors">{project.title}</h4>
                        <Badge variant={
                          project.status === 'Active' ? 'default' :
                          project.status === 'Completed' ? 'secondary' :
                          project.status === 'Pending' ? 'outline' :
                          'outline' // Default or for other statuses
                        }>
                          {project.status || 'Unknown Status'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Group: {group.groupName} {group.groupDescription ? `- ${group.groupDescription}` : ''}
                      </p>
                      <p className="text-sm text-foreground/80 mt-1 line-clamp-2">{project.description || 'No description available'}</p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="ml-2 rounded-full text-muted-foreground hover:text-primary hover:bg-accent-foreground/10"
                      aria-label="View project details"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {project.submissionDate ? 
                          <>Due: <span className="font-medium text-foreground/90">{new Date(project.submissionDate).toLocaleDateString()}</span></> : 
                          'No deadline set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Last updated: <span className="font-medium text-foreground/90">{new Date(project.updatedAt).toLocaleDateString()}</span></span>
                    </div>
                  </div>
                </div>
              ))
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <Book className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Projects Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              There are currently no projects under your advisement. Check back later or try refreshing.
            </p>
            <Button 
              variant="ghost" 
              className="mt-6"
              onClick={onRefreshProjects}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Try Refreshing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 