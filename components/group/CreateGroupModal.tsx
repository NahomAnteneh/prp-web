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

// Utility function to generate a base groupUserName
const generateBaseGroupUserName = (groupName: string): string => {
  // Convert to lowercase, remove special characters, and replace spaces with hyphens
  let baseName = groupName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .slice(0, 20); // Limit to 20 to allow for suffix and padding

  // If baseName is empty, use a fallback
  if (!baseName) {
    baseName = 'group';
  }

  // If baseName is less than 6 characters, pad with random numbers
  if (baseName.length < 6) {
    const paddingLength = 6 - baseName.length;
    const randomNumbers = Math.floor(Math.random() * Math.pow(10, paddingLength))
      .toString()
      .padStart(paddingLength, '0');
    baseName = `${baseName}${randomNumbers}`;
  }

  return baseName;
};

// Async function to generate and check for a unique groupUserName
const generateUniqueGroupUserName = async (groupName: string): Promise<string> => {
  const maxAttempts = 5;
  let attempt = 0;
  const baseName = generateBaseGroupUserName(groupName);

  while (attempt < maxAttempts) {
    // Generate a candidate groupUserName
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    let candidateUserName = attempt === 0 ? baseName : `${baseName}-${randomSuffix}`;

    // Ensure the candidate is not longer than 24 characters
    candidateUserName = candidateUserName.slice(0, 24);

    // Ensure the candidate is still at least 6 characters (pad if needed)
    if (candidateUserName.length < 6) {
      const paddingLength = 6 - candidateUserName.length;
      const randomNumbers = Math.floor(Math.random() * Math.pow(10, paddingLength))
        .toString()
        .padStart(paddingLength, '0');
      candidateUserName = `${candidateUserName}${randomNumbers}`.slice(0, 24);
    }

    try {
      // Check if the groupUserName is available via API
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupUserName: candidateUserName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check username availability');
      }

      if (data.isAvailable) {
        return candidateUserName; // Return the unique groupUserName
      }
    } catch (error) {
      console.error('Error checking username:', error);
      // Continue to the next attempt if the check fails
    }

    attempt++;
  }

  throw new Error('Unable to generate a unique group username. Please try a different group name.');
};

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

      // Generate a unique groupUserName
      const groupUserName = await generateUniqueGroupUserName(groupName);

      // Submit the group creation request
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          groupUserName,
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
      
      if (errorMessage.includes('already exists') || errorMessage.includes('unique group username')) {
        setNameError('This group name or username is already taken');
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