'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Project } from './project-card';

interface ProjectSettingsProps {
  ownerId: string;
  projectId: string;
}

export function ProjectSettings({ ownerId, projectId }: ProjectSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.statusText}`);
        }
        
        const data = await response.json();
        setProject(data);
        setForm({
          title: data.title,
          description: data.description || '',
          status: data.status,
        });
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [ownerId, projectId]);

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      toast.success('Project settings updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to update project');
      toast.error('Error updating project', {
        description: error instanceof Error ? error.message : 'Failed to update project',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to archive project: ${response.statusText}`);
      }

      toast.success('Project archived successfully');
      setIsArchiveDialogOpen(false);
      
      // Refresh the project data
      const updatedProject = await response.json();
      setProject(updatedProject);
      setForm(prev => ({
        ...prev,
        status: 'ARCHIVED',
      }));
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Error archiving project', {
        description: error instanceof Error ? error.message : 'Failed to archive project',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }

      toast.success('Project deleted successfully');
      setIsDeleteDialogOpen(false);
      
      // Redirect to projects list
      router.push(`/dashboard/${ownerId}/projects`);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project', {
        description: error instanceof Error ? error.message : 'Failed to delete project',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="h-8 w-40 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"></CardTitle>
          <CardDescription className="h-6 w-60 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>
            Manage project settings and configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input 
                  id="title" 
                  value={form.title} 
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={form.description} 
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={form.status} 
                  onValueChange={(value) => handleFormChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </form>

          <Separator className="my-8" />
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Actions here cannot be easily undone.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => setIsArchiveDialogOpen(true)}
                disabled={form.status === 'ARCHIVED' || isSaving}
              >
                Archive Project
              </Button>
              
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isSaving}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this project?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will make this project read-only. Team members will no longer be able to make changes.
              You can restore an archived project later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleArchiveProject();
              }}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? 'Archiving...' : 'Archive Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProject();
              }}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 