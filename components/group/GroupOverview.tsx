'use client';

import { useState } from 'react';
import { Users, Edit, X, Mail, Copy, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface GroupMember {
  user: {
    id: string;
    name: string;
    username: string;
  };
  userId: string;
  joinedAt: string;
}

interface GroupOverviewProps {
  group: {
    id: string;
    name: string;
    description: string;
    leaderId: string;
    createdAt: string;
    members: GroupMember[];
  };
  maxGroupSize: number;
  isLeader: boolean;
  onUpdate: () => void;
}

export default function GroupOverview({ group, maxGroupSize, isLeader, onUpdate }: GroupOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const [editedDescription, setEditedDescription] = useState(group.description || '');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [emailInviteStatus, setEmailInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailInviteError, setEmailInviteError] = useState('');

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update group');
      }

      toast.success('Group updated', {
        description: 'Group details have been successfully updated.',
      });
      
      setIsEditing(false);
      onUpdate();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error('Error updating group', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteCode = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.id}/invite-code`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate invite code');
      }

      const data = await response.json();
      setInviteCode(data.inviteCode);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error('Error generating invite code', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailInvitation = async () => {
    // Validate email
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setEmailInviteError('Please enter a valid email address');
      return;
    }
    
    setEmailInviteStatus('loading');
    setEmailInviteError('');
    
    try {
      // Generate invite code if it doesn't exist
      if (!inviteCode) {
        await generateInviteCode();
      }
      
      // Send invitation email
      const response = await fetch(`/api/groups/${group.id}/invite-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          inviteCode: inviteCode,
          groupName: group.name
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      setEmailInviteStatus('success');
      toast.success('Invitation sent', {
        description: `Invitation email has been sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error: unknown) {
      setEmailInviteStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setEmailInviteError(errorMessage);
      toast.error('Error sending invitation', {
        description: errorMessage,
      });
    } finally {
      setEmailInviteStatus('idle');
    }
  };

  const removeMember = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.id}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove member');
      }

      toast.success('Member removed', {
        description: 'The member has been removed from the group.',
      });
      
      onUpdate();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error('Error removing member', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Copied to clipboard', {
      description: 'Invite code copied to clipboard.',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="max-w-md"
              />
            </div>
          ) : (
            <CardTitle className="text-2xl flex items-center">
              <Users className="mr-2 h-6 w-6" />
              {group.name}
            </CardTitle>
          )}
          
          {isEditing ? (
            <div className="mt-4 space-y-2">
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="max-w-md"
                rows={3}
              />
            </div>
          ) : (
            <CardDescription className="mt-1">
              {group.description || "No description provided."}
            </CardDescription>
          )}

          {isEditing && (
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        {isLeader && !isEditing && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Group
            </Button>

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="flex items-center gap-1"
                  disabled={group.members.length >= maxGroupSize}
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Invite New Members</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-6">
                    {/* Email Invitation Section */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Invite by Email</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Send an invitation email directly to a student
                      </p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="inviteEmail">Student Email</Label>
                          <div className="flex gap-2">
                            <Input
                              id="inviteEmail"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="student@university.edu"
                              type="email"
                            />
                            <Button 
                              onClick={sendEmailInvitation}
                              disabled={emailInviteStatus === 'loading' || !inviteEmail || group.members.length >= maxGroupSize}
                              size="sm"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </div>
                          {emailInviteError && (
                            <p className="text-sm text-destructive">{emailInviteError}</p>
                          )}
                          {emailInviteStatus === 'success' && (
                            <p className="text-sm text-green-600">Invitation sent successfully!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    {/* Invite Code Section */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Share Invite Code</h3>
                      {inviteCode ? (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Share this code with students you want to invite to your group:
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={inviteCode}
                              readOnly
                              className="font-mono text-center"
                            />
                            <Button onClick={copyInviteCode} size="icon" variant="outline">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This code will expire in 24 hours.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Generate an invitation code to let others join your group.
                          </p>
                          <Button 
                            onClick={generateInviteCode} 
                            disabled={isLoading || group.members.length >= maxGroupSize}
                            variant="outline"
                            className="w-full"
                          >
                            {isLoading ? "Generating..." : "Generate Invite Code"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Members ({group.members.length}/{maxGroupSize})</h3>
            <Badge variant={group.members.length >= maxGroupSize ? "destructive" : "outline"}>
              {group.members.length >= maxGroupSize ? "Full" : `${maxGroupSize - group.members.length} spots available`}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {group.members.map((member) => (
              <div 
                key={member.userId} 
                className="flex items-center justify-between p-3 border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <Link 
                  href={`/${member.user.username}`} 
                  className="flex items-center gap-2 flex-1"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {member.user.name ? member.user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">@{member.user.username}</p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-2">
                  {member.userId === group.leaderId && (
                    <Badge variant="secondary" className="ml-2">Leader</Badge>
                  )}
                  
                  {isLeader && member.userId !== group.leaderId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeMember(member.userId)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 