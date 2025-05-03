'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Plus, FileCode } from 'lucide-react';
import { z } from 'zod';

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

interface ProjectsListProps {
  groupId: string;
  isLeader: boolean;
}

export default function ProjectsList({ groupId, isLeader }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New project form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [groupId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/projects`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects');
      }

      setProjects(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching projects', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
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
      setLoading(true);
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
      fetchProjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error creating project', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
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
  
  const getProjectStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-purple-500">Completed</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading projects...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {isLeader && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Project
          </Button>
        </div>
      )}
      
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
              Your group doesn't have any projects yet. 
              {isLeader ? ' Start by creating your first project above.' : ' The group leader can create a project.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Created on {formatDate(project.createdAt)} | Group: {project.group.groupUserName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProjectStatusBadge(project.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {project.description ? (
                  <p className="text-sm">{project.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided</p>
                )}
                {project.advisor && (
                  <p className="text-sm mt-2">
                    Advisor: {project.advisor.name}
                  </p>
                )}
                <div className="mt-2 text-sm text-muted-foreground">
                  Stats: {project.stats.tasks} tasks, {project.stats.evaluations} evaluations, {project.stats.feedback} feedback items
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
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
            
            <div className="space-y-2">
              <Label htmlFor="advisorId">Advisor ID (Optional)</Label>
              <Input
                id="advisorId"
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
                placeholder="Enter advisor ID"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateProject} disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}