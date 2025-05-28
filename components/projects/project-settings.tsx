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
import { 
  Settings, 
  Info, 
  Archive, 
  Trash2, 
  Users, 
  Shield, 
  Bell 
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  isPrivate: boolean;
  [key: string]: any; // Allow for other properties
}

interface ProjectSettingsProps {
  ownerId: string;
  projectId: string;
}

type SettingsTab = 'general' | 'permissions' | 'notifications' | 'team' | 'danger';

export function ProjectSettings({ ownerId, projectId }: ProjectSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
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
      router.push(`/${ownerId}/projects`);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
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
        );
      case 'permissions':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Project Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Configure who can view and edit this project.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Project Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Control whether this project is visible to others
                  </p>
                </div>
                <Select defaultValue={project?.isPrivate ? "private" : "public"}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Team Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage team members and their roles.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Team management features coming soon.
              </p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure how you receive notifications for this project.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Notification settings coming soon.
              </p>
            </div>
          </div>
        );
      case 'danger':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                These actions are irreversible. Please proceed with caution.
              </p>
            </div>
            
            <div className="space-y-4">
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-base">Archive Project</CardTitle>
                  <CardDescription>
                    Archiving will make the project read-only and hide it from active projects.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700"
                    onClick={() => setIsArchiveDialogOpen(true)}
                    disabled={form.status === 'ARCHIVED'}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Project
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-base">Delete Project</CardTitle>
                  <CardDescription>
                    Permanently delete this project and all its data. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="space-y-1 py-2">
                <Button
                  variant={activeTab === 'general' ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-none"
                  onClick={() => setActiveTab('general')}
                >
                  <Info className="mr-2 h-4 w-4" />
                  General
                </Button>
                <Button
                  variant={activeTab === 'permissions' ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-none"
                  onClick={() => setActiveTab('permissions')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Permissions
                </Button>
                <Button
                  variant={activeTab === 'team' ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-none"
                  onClick={() => setActiveTab('team')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
                <Button
                  variant={activeTab === 'notifications' ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-none"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
                <Separator />
                <Button
                  variant={activeTab === 'danger' ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-none text-red-600 dark:text-red-400"
                  onClick={() => setActiveTab('danger')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Danger Zone
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'general' && 'General Settings'}
                {activeTab === 'permissions' && 'Permission Settings'}
                {activeTab === 'team' && 'Team Settings'}
                {activeTab === 'notifications' && 'Notification Settings'}
                {activeTab === 'danger' && 'Danger Zone'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'general' && 'Manage basic project information'}
                {activeTab === 'permissions' && 'Control access to your project'}
                {activeTab === 'team' && 'Manage team members and roles'}
                {activeTab === 'notifications' && 'Configure project notifications'}
                {activeTab === 'danger' && 'Critical project actions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTabContent()}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this project? It will be marked as archived and become read-only.
              You can unarchive it later by changing the status back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchiveProject}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated data including tasks, feedback, and evaluations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 