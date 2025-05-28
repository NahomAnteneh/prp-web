import { useState } from 'react';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';

// Validation schema matching server-side createProjectSchema
const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(255, 'Project title is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
});

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupUserName: string;
  onProjectCreated: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, groupUserName, onProjectCreated }: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTitleError('');
    setDescriptionError('');
  };

  const handleCreateProject = async () => {
    // Reset errors
    setTitleError('');
    setDescriptionError('');

    // Validate input
    const validationResult = createProjectSchema.safeParse({
      title,
      description: description || undefined
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      if (errors.title) setTitleError(errors.title[0]);
      if (errors.description) setDescriptionError(errors.description[0]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${groupUserName}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null
        })
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
        description: `Project "${data.project.title}" created successfully.`
      });
      
      onClose();
      resetForm();
      onProjectCreated();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error creating project', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
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
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            onClose();
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
  );
} 