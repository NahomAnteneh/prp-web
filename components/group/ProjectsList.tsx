'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Folder, ExternalLink, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import CreateProjectModal from './CreateProjectModal';

// Validation schema matching server-side createProjectSchema
const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(255, 'Project title is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  advisorId: z.string().min(1, 'Advisor ID is required').optional(),
});

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  submissionDate: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  group: {
    id: string;
    name: string;
    groupUserName: string;
  };
  advisor: {
    id: string;
    name: string;
  } | null;
  stats: {
    tasks: number;
    repositories: number;
    evaluations: number;
    feedback: number;
  };
  evaluations: {
    id: string;
    score: number;
    createdAt: string;
  }[];
  feedback: {
    id: string;
    title: string;
    createdAt: string;
    authorId: string;
    status: string;
  }[];
}

interface ProjectResponse {
  projects: Project[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface ProjectsListProps {
  groupId: string;
  isLeader: boolean;
}

export default function ProjectsList({ groupId, isLeader }: ProjectsListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [projectData, setProjectData] = useState<ProjectResponse>({
    projects: [],
    pagination: { total: 0, limit: 5, offset: 0, hasMore: false }
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create project form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const fetchProjects = async (offset: number, limit: number, append: boolean = false) => {
    try {
      setIsLoadingMore(true);
      const url = `/api/groups/${groupId}/projects?offset=${offset}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects');
      }

      // Ensure data has the expected structure
      const normalizedData: ProjectResponse = {
        projects: Array.isArray(data.projects) ? data.projects.slice(0, limit) : Array.isArray(data) ? data.slice(0, limit) : [],
        pagination: data.pagination || {
          total: Array.isArray(data.projects) ? data.projects.length : Array.isArray(data) ? data.length : 0,
          limit,
          offset,
          hasMore: (Array.isArray(data.projects) ? data.projects.length : Array.isArray(data) ? data.length : 0) > offset + limit
        }
      };

      if (append) {
        setProjectData({
          projects: [...projectData.projects, ...normalizedData.projects],
          pagination: normalizedData.pagination
        });
      } else {
        setProjectData(normalizedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching projects', {
        description: errorMessage,
      });
      setProjectData({
        projects: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProjects(0, 5); // Fetch only 5 projects initially
  }, [groupId]);

  const handleLoadMore = () => {
    if (projectData.pagination.hasMore) {
      const newOffset = projectData.pagination.offset + projectData.pagination.limit;
      fetchProjects(newOffset, projectData.pagination.limit, true);
    }
  };

  const handleCreateProject = async () => {
    // Reset errors
    setTitleError('');
    setDescriptionError('');

    // Validate input
    const validationResult = createProjectSchema.safeParse({
      title,
      description: description || undefined,
      advisorId: advisorId || undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      if (errors.title) setTitleError(errors.title[0]);
      if (errors.description) setDescriptionError(errors.description[0]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${groupId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          ...(advisorId && { advisorId }),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          const errors = data.errors;
          if (errors.title) setTitleError(errors.title[0]);
          if (errors.description) setDescriptionError(errors.description[0]);
          throw new Error('Invalid input');
        }
        throw new Error(data.message || 'Failed to create project');
      }

      toast.success('Project created', {
        description: `Project "${data.project.title}" created for group "${data.project.group.groupUserName}".`,
      });
      
      setShowCreateModal(false);
      resetForm();
      // Refetch projects from the beginning
      fetchProjects(0, 5);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error creating project', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAdvisorId('');
    setTitleError('');
    setDescriptionError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" /> Projects
          </CardTitle>
          <CardDescription>Loading projects...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading projects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projectData.projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" /> Projects
          </CardTitle>
          <CardDescription>No projects found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="mb-4 text-muted-foreground">
              {isLeader ? "Your group hasn't started any projects yet." : "This group hasn't started any projects yet."}
            </p>
            {isLeader && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Project
              </Button>
            )}
          </div>
        </CardContent>
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          groupId={groupId}
          onProjectCreated={() => fetchProjects(0, 5)}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" /> Projects
            </CardTitle>
            <CardDescription>
              {isLeader ? "Your group's current and past projects" : 'Current and past projects'}
            </CardDescription>
          </div>
          {isLeader && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              New Project
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projectData.projects.map((project) => (
            <div 
              key={project.id}
              className="rounded-lg border hover:border-primary transition-colors overflow-hidden"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-lg font-semibold">
                        <Link href={`/groups/${project.group.id}/projects/${project.id}`} className="hover:text-primary transition-colors">
                          {project.title}
                        </Link>
                      </h3>
                      <Badge className={`${getStatusColor(project.status)} border`}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {project.description || 'No description provided'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Group: {project.group.groupUserName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Advisor: {project.advisor ? project.advisor.name : 'None'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Last updated: {formatDate(project.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Stats: {project.stats.tasks} tasks, {project.stats.evaluations} evaluations</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${project.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" /> View Project
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {projectData.pagination.hasMore && (
          <div className="text-center mt-6">
            <Button 
              variant="outline" 
              onClick={handleLoadMore} 
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        groupId={groupId}
        onProjectCreated={() => fetchProjects(0, 5)}
      />
    </Card>
  );
}