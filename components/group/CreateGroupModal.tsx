'use client';

import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  maxGroupSize: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ maxGroupSize, onClose, onSuccess }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!groupName.trim()) {
      setNameError('Group name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      toast.success('Group created', {
        description: 'Your group has been successfully created.',
      });
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      
      toast.error('Error creating group', {
        description: errorMessage,
      });
      
      if (errorMessage.includes('already exists')) {
        setNameError('This group name is already taken');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setNameError('');
              }}
              placeholder="Enter group name"
              className={nameError ? 'border-red-500' : ''}
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your group or project focus"
              rows={3}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>By creating a group:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>You will be the group leader</li>
              <li>Maximum members allowed: {maxGroupSize}</li>
              <li>You will need to request an advisor for your project</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 