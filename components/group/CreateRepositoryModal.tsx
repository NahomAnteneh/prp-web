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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Validation schema for creating a repository
const createRepositorySchema = z.object({
  name: z.string().trim().min(1, 'Repository name is required').max(255, 'Repository name is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional(),
  visibility: z.enum(['public', 'private'], { message: 'Visibility must be public or private' }),
});

interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupUserName: string;
  onRepositoryCreated: () => void;
}

export default function CreateRepositoryModal({ isOpen, onClose, groupId, groupUserName, onRepositoryCreated }: CreateRepositoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [visibilityError, setVisibilityError] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setVisibility('public');
    setNameError('');
    setDescriptionError('');
    setVisibilityError('');
  };

  const handleCreateRepository = async () => {
    // Reset errors
    setNameError('');
    setDescriptionError('');
    setVisibilityError('');

    // Validate input
    const validationResult = createRepositorySchema.safeParse({
      name,
      description: description || undefined,
      visibility,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      if (errors.name) setNameError(errors.name[0]);
      if (errors.description) setDescriptionError(errors.description[0]);
      if (errors.visibility) setVisibilityError(errors.visibility[0]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${groupId}/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          visibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          const errors = data.errors;
          if (errors.name) setNameError(errors.name[0]);
          if (errors.description) setDescriptionError(errors.description[0]);
          if (errors.visibility) setVisibilityError(errors.visibility[0]);
          throw new Error('Invalid input');
        }
        throw new Error(data.message || 'Failed to create repository');
      }

      toast.success('Repository created', {
        description: `Repository "${data.name}" created successfully.`,
      });

      onClose();
      resetForm();
      onRepositoryCreated();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error creating repository', {
        description: errorMessage,
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
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Create a new repository</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); handleCreateRepository(); }}>
          <div className="space-y-4 py-2">
            {/* Owner and Repo Name */}
            <div className="flex flex-row items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="owner">Owner</Label>
                <Input id="owner" value={groupUserName} readOnly className="bg-muted" />
              </div>
              <span className="text-2xl font-bold pb-2">/</span>
              <div className="flex-1">
                <Label htmlFor="name">Repository name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => { setName(e.target.value); setNameError(''); }}
                  placeholder="Enter repository name"
                  className={nameError ? 'border-red-500' : ''}
                  required
                />
                {nameError && <p className="text-sm text-red-500 mt-1">{nameError}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => { setDescription(e.target.value); setDescriptionError(''); }}
                placeholder="Describe the repository purpose"
                rows={2}
                className={descriptionError ? 'border-red-500' : ''}
              />
              {descriptionError && <p className="text-sm text-red-500 mt-1">{descriptionError}</p>}
            </div>

            {/* Visibility */}
            <div>
              <Label>Visibility</Label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                  />
                  <div>
                    <span className="font-medium">Public</span>
                    <p className="text-xs text-muted-foreground">Anyone can see this repository</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                  />
                  <div>
                    <span className="font-medium">Private</span>
                    <p className="text-xs text-muted-foreground">Only you and collaborators can see this repository</p>
                  </div>
                </label>
              </div>
              {visibilityError && <p className="text-sm text-red-500 mt-1">{visibilityError}</p>}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create repository'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 