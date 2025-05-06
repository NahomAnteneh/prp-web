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

// Validation schema for project creation
const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(255, 'Project title is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  groupId: z.string().min(1, 'Group ID is required'),
  advisorId: z.string().min(1, 'Advisor ID is required').optional(),
});

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' | 'ARCHIVED';
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
  userId: string;
  isOwner?: boolean;
}

export default function ProjectsList({ userId, isOwner = false }: ProjectsListProps) {
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
  const [groupId, setGroupId] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [titleError, setTitleError] = useState('');
  const [groupIdError, setGroupIdError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const fetchProjects = async (offset: number, limit: number, append: boolean = false) => {
    try {
      setIsLoadingMore(true);
      const url = `/api/users/${userId}/projects?offset=${offset}&limit=${limit}`;
      console.log('Fetching projects:', url); // Debug: Log the API URL
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API response:', data); // Debug: Log the API response

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
      console.error('Fetch projects error:', error); // Debug: Log the error
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
  }, [userId]);

  const handleLoadMore = () => {
    if (projectData.pagination.hasMore) {
      const newOffset = projectData.pagination.offset + projectData.pagination.limit;
      fetchProjects(newOffset, projectData.pagination.limit, true);
    }
  };

  const handleCreateProject = async () => {
    // Reset errors
    setTitleError('');
    setGroupIdError('');
    setDescriptionError('');

    // Validate input
    const validationResult = createProjectSchema.safeParse({
      title,
      description: description || undefined,
      groupId,
      advisorId: advisorId || undefined,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      if (errors.title) setTitleError(errors.title[0]);
      if (errors.groupId) setGroupIdError(errors.groupId[0]);
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
    setGroupId('');
    setAdvisorId('');
    setTitleError('');
    setGroupIdError('');
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
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default:
        return '';
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
              {isOwner ? "You haven't started any projects yet." : "This user hasn't started any projects yet."}
            </p>
            {isOwner && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Project
              </Button>
            )}
          </div>
        </CardContent>
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
              {isOwner ? 'Your current and past projects' : 'Current and past projects'}
            </CardDescription>
          </div>
          {isOwner && (
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
              key={project.id} // Use project.id as the unique key
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

      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project for your group to work on.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupId">
                Group ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="groupId"
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  setGroupIdError('');
                }}
                placeholder="Enter group ID"
                className={groupIdError ? 'border-red-500' : ''}
              />
              {groupIdError && <p className="text-sm text-red-500">{groupIdError}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">
                Project Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError('');
                }}
                placeholder="Enter project title"
                className={titleError ? 'border-red-500' : ''}
              />
              {titleError && <p className="text-sm text-red-500">{titleError}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setDescriptionError('');
                }}
                placeholder="Describe the project goals and scope"
                rows={3}
                className={descriptionError ? 'border-red-500' : ''}
              />
              {descriptionError && <p className="text-sm text-red-500">{descriptionError}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateProject} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}