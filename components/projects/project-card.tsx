'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FolderGit2, FileText, MessageSquare } from 'lucide-react';

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT' | 'ADVISOR' | 'EVALUATOR' | 'ADMINISTRATOR';
  profileInfo?: {
    department?: string;
    position?: string;
    expertise?: string[];
    bio?: string;
  };
}

export interface Group {
  id: string;
  groupUserName: string;
  name: string;
  description?: string;
  leaderId: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  department?: string;
  batchYear?: string;
  advisor?: string;
  profileInfo?: {
    id: string;
    name: string;
    username: string;
    profileInfo?: any;
  };
}

interface FetchProjectsParams {
  search?: string;
  status?: string[];
  departments?: string[];
  batchYears?: string[];
  advisors?: string[];
}

export async function fetchProjects(params: FetchProjectsParams = {}): Promise<Project[]> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.status?.length) queryParams.append('status', params.status.join(','));
  if (params.departments?.length) queryParams.append('departments', params.departments.join(','));
  if (params.batchYears?.length) queryParams.append('batchYears', params.batchYears.join(','));
  if (params.advisors?.length) queryParams.append('advisors', params.advisors.join(','));

  const response = await fetch(`/api/projects?${queryParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
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
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold line-clamp-1">{project.title}</CardTitle>
          <Badge className={getStatusColor(project.status || '')}>
            {project.status || 'No Status'}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {project.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-sm">
          <div className="flex items-center mb-1">
            <span className="text-muted-foreground mr-2">Group:</span>
            <span className="font-medium">{project.group?.name || 'No Group'}</span>
          </div>
          {project.advisor && (
            <div className="flex items-center mb-1">
              <span className="text-muted-foreground mr-2">Advisor:</span>
              <span className="font-medium">{project.advisor.firstName} {project.advisor.lastName}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>{project._count?.repositories || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{project._count?.tasks || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{project._count?.feedback || 0}</span>
          </div>
        </div>
        <div>
          {format(new Date(project.updatedAt || project.createdAt), 'MMM d, yyyy')}
        </div>
      </CardFooter>
    </Card>
  );
} 