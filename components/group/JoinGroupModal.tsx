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
import { toast } from 'sonner';

interface JoinGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinGroupModal({ onClose, onSuccess }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join group');
      }

      toast.success('Group joined', {
        description: `You have successfully joined the group "${data.groupName}".`,
      });
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      toast.error('Error joining group', {
        description: errorMessage,
      });
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">
              Invitation Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setInviteCode(e.target.value);
                setError('');
              }}
              placeholder="Enter invitation code"
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Get an invitation code from a group leader to join their group.</p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}