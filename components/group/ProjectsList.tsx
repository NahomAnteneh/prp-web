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
import { 
  Plus, 
  Edit, 
  CheckCircle, 
  Clock, 
  Calendar,
  FileCode,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  submissionDate: string | null;
  createdAt: string;
  updatedAt: string;
  milestones?: {
    title: string;
    description?: string;
    deadline: string;
    completed: boolean;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // New project form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  
  // New milestone form state
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDeadline, setMilestoneDeadline] = useState('');
  const [milestoneTitleError, setMilestoneTitleError] = useState('');
  const [milestoneDeadlineError, setMilestoneDeadlineError] = useState('');

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

      setProjects(data.projects || []);
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
    // Validation
    if (!title.trim()) {
      setTitleError('Project title is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      toast.success('Project created', {
        description: 'Your project has been created successfully.',
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

  const handleUpdateProject = async () => {
    if (!currentProject) return;
    
    // Validation
    if (!title.trim()) {
      setTitleError('Project title is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update project');
      }

      toast.success('Project updated', {
        description: 'Your project has been updated successfully.',
      });
      
      setShowEditModal(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error updating project', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!currentProject) return;
    
    // Validation
    let hasError = false;
    
    if (!milestoneTitle.trim()) {
      setMilestoneTitleError('Milestone title is required');
      hasError = true;
    }
    
    if (!milestoneDeadline) {
      setMilestoneDeadlineError('Deadline is required');
      hasError = true;
    }
    
    if (hasError) return;

    try {
      setLoading(true);
      
      // Get current milestones or initialize empty array
      const currentMilestones = currentProject.milestones || [];
      
      // Add new milestone
      const newMilestone = {
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim() || undefined,
        deadline: milestoneDeadline,
        completed: false,
      };
      
      const updatedMilestones = [...currentMilestones, newMilestone];
      
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add milestone');
      }

      toast.success('Milestone added', {
        description: 'Project milestone has been added successfully.',
      });
      
      setShowMilestoneModal(false);
      resetMilestoneForm();
      fetchProjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error adding milestone', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestoneCompletion = async (projectId: string, milestoneIndex: number, completed: boolean) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.milestones) return;
    
    try {
      setLoading(true);
      
      // Create a copy of milestones and update the specific one
      const updatedMilestones = [...project.milestones];
      updatedMilestones[milestoneIndex] = {
        ...updatedMilestones[milestoneIndex],
        completed,
      };
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update milestone');
      }

      // Update projects locally for immediate feedback
      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, milestones: updatedMilestones } 
          : p
      ));
      
      toast.success('Milestone updated', {
        description: `Milestone marked as ${completed ? 'completed' : 'incomplete'}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error updating milestone', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTitleError('');
  };

  const resetMilestoneForm = () => {
    setMilestoneTitle('');
    setMilestoneDescription('');
    setMilestoneDeadline('');
    setMilestoneTitleError('');
    setMilestoneDeadlineError('');
  };

  const openEditModal = (project: Project) => {
    setCurrentProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setShowEditModal(true);
  };

  const openAddMilestoneModal = (project: Project) => {
    setCurrentProject(project);
    setShowMilestoneModal(true);
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
  
  const getMilestoneStatusColor = (deadline: string, completed: boolean) => {
    if (completed) return 'text-green-500';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    // If deadline is in the past and not completed
    if (deadlineDate < now) return 'text-red-500';
    
    // If deadline is within the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    if (deadlineDate <= sevenDaysFromNow) return 'text-amber-500';
    
    return 'text-blue-500';
  };

  if (loading && projects.length === 0) {
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
              Your group doesn&apos;t have any projects yet. 
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
                      Created on {formatDate(project.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProjectStatusBadge(project.status)}
                    
                    {isLeader && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditModal(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAddMilestoneModal(project)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Add Milestone
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {project.description ? (
                  <p className="text-sm">{project.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided</p>
                )}
                
                {project.milestones && project.milestones.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Milestones
                    </h4>
                    <div className="space-y-2">
                      {project.milestones.map((milestone, index) => (
                        <div key={index} className="bg-muted/30 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div className={getMilestoneStatusColor(milestone.deadline, milestone.completed)}>
                              <div className="flex items-center">
                                {milestone.completed ? (
                                  <CheckCircle className="h-4 w-4 mr-1.5" />
                                ) : (
                                  <Clock className="h-4 w-4 mr-1.5" />
                                )}
                                <h5 className="text-sm font-medium">{milestone.title}</h5>
                              </div>
                              <p className="text-xs ml-5.5 mt-0.5">
                                Due: {formatDate(milestone.deadline)}
                              </p>
                            </div>
                            
                            {isLeader && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={milestone.completed ? "text-muted-foreground" : "text-green-600"}
                                onClick={() => toggleMilestoneCompletion(project.id, index, !milestone.completed)}
                              >
                                {milestone.completed ? "Mark Incomplete" : "Mark Complete"}
                              </Button>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground mt-1 ml-5.5">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Project Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project goals and scope"
                rows={3}
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
      
      {/* Edit Project Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the details of your project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Project Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the project goals and scope"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowEditModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateProject} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Milestone Modal */}
      <Dialog open={showMilestoneModal} onOpenChange={(open) => {
        setShowMilestoneModal(open);
        if (!open) resetMilestoneForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Milestone</DialogTitle>
            <DialogDescription>
              Add a milestone or deadline to track project progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="milestone-title"
                value={milestoneTitle}
                onChange={(e) => {
                  setMilestoneTitle(e.target.value);
                  setMilestoneTitleError('');
                }}
                placeholder="e.g., 'Complete initial design', 'Submit draft report'"
                className={milestoneTitleError ? 'border-red-500' : ''}
              />
              {milestoneTitleError && (
                <p className="text-sm text-red-500">{milestoneTitleError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                value={milestoneDescription}
                onChange={(e) => setMilestoneDescription(e.target.value)}
                placeholder="Add any additional details about this milestone"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="milestone-deadline">
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="milestone-deadline"
                type="date"
                value={milestoneDeadline}
                onChange={(e) => {
                  setMilestoneDeadline(e.target.value);
                  setMilestoneDeadlineError('');
                }}
                className={milestoneDeadlineError ? 'border-red-500' : ''}
              />
              {milestoneDeadlineError && (
                <p className="text-sm text-red-500">{milestoneDeadlineError}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowMilestoneModal(false);
              resetMilestoneForm();
            }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddMilestone} disabled={loading}>
              {loading ? 'Adding...' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 