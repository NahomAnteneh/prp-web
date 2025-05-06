'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema matching server-side createProjectSchema
const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(255, 'Project title is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  advisorId: z.string().min(1, 'Advisor ID is required').optional(),
});

interface CreateProjectModalProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectModal({ 
  groupId, 
  open, 
  onClose, 
  onProjectCreated 
}: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAdvisorId('');
    setTitleError('');
    setDescriptionError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        description: `Project "${data.project.title}" created successfully.`,
      });
      
      resetForm();
      onProjectCreated();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error creating project', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your group. Fill in the details below to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="flex justify-between">
              <span>Project Title</span>
              {titleError && (
                <span className="text-red-500 text-sm">{titleError}</span>
              )}
            </Label>
            <Input
              id="title"
              placeholder="Enter project title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={titleError ? "border-red-500" : ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="flex justify-between">
              <span>Description</span>
              {descriptionError && (
                <span className="text-red-500 text-sm">{descriptionError}</span>
              )}
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the project (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={descriptionError ? "border-red-500" : ""}
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="advisorId">
              <span>Advisor ID (optional)</span>
            </Label>
            <Input
              id="advisorId"
              placeholder="Enter advisor ID if assigning"
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateProject} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 