'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Trash2, UserPlus,  Users, Settings, User } from 'lucide-react';
import { z } from 'zod';
import { Group, GroupInvite } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Validation schemas
const groupUserNameSchema = z.object({
  groupUserName: z
    .string()
    .trim()
    .min(3, 'Group username must be at least 3 characters')
    .max(30, 'Group username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Group username can only contain letters, numbers, underscores, and hyphens'),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

interface GroupSettingsProps {
  group: Group & {
    members: { userId: string; userName?: string; displayName?: string; email?: string; role?: string }[];
    invites: GroupInvite[];
  };
  maxGroupSize: number;
  isLeader: boolean;
  onUpdate: () => void;
}

export default function GroupSettings({ group, maxGroupSize, isLeader, onUpdate }: GroupSettingsProps) {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [groupUserName, setGroupUserName] = useState(group.groupUserName);
  const [groupUserNameError, setGroupUserNameError] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [invites, setInvites] = useState<GroupInvite[]>(group.invites || []);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<(typeof group.members)[0] | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [memberPermissions, setMemberPermissions] = useState<{
    canCreateProjects: boolean;
    canCreateRepositories: boolean;
    canInviteMembers: boolean;
  }>({
    canCreateProjects: false,
    canCreateRepositories: false,
    canInviteMembers: false,
  });

  // Sidebar navigation items
  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: User },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  // Predefined roles
  const roles = [
    { id: 'member', label: 'Member', permissions: { canCreateProjects: false, canCreateRepositories: false, canInviteMembers: false } },
    { id: 'contributor', label: 'Contributor', permissions: { canCreateProjects: false, canCreateRepositories: true, canInviteMembers: false } },
    { id: 'manager', label: 'Manager', permissions: { canCreateProjects: true, canCreateRepositories: true, canInviteMembers: true } },
    { id: 'admin', label: 'Admin', permissions: { canCreateProjects: true, canCreateRepositories: true, canInviteMembers: true } },
    { id: 'custom', label: 'Custom', permissions: { canCreateProjects: false, canCreateRepositories: false, canInviteMembers: false } },
  ];

  // Handle profile picture selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Invalid file type', {
          description: 'Only JPEG, PNG, or GIF images are allowed.',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Image size must be less than 5MB.',
        });
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  // Update group username
  const handleUpdateGroupUserName = async () => {
    setGroupUserNameError('');
    const validationResult = groupUserNameSchema.safeParse({ groupUserName });

    if (!validationResult.success) {
      setGroupUserNameError(validationResult.error.flatten().fieldErrors.groupUserName?.[0] || '');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupUserName: groupUserName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update group username');
      }

      toast.success('Group username updated', {
        description: `Group username changed to "${groupUserName}".`,
      });
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error updating group username', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile picture
  const handleUpdateProfilePicture = async () => {
    if (!profilePicture) {
      toast.error('No image selected', {
        description: 'Please select an image to upload.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const response = await fetch(`/api/groups/${group.groupUserName}/profile-picture`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile picture');
      }

      toast.success('Profile picture updated', {
        description: 'Group profile picture has been updated.',
      });
      setProfilePicture(null);
      setProfilePicturePreview(null);
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error updating profile picture', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create invite
  const handleCreateInvite = async () => {
    setInviteError('');
    const validationResult = inviteSchema.safeParse({ email: inviteEmail || undefined });

    if (!validationResult.success) {
      setInviteError(validationResult.error.flatten().fieldErrors.email?.[0] || '');
      return;
    }

    if (group.members.length >= maxGroupSize) {
      toast.error('Group is full', {
        description: `Cannot invite more members. Maximum group size is ${maxGroupSize}.`,
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create invite');
      }

      toast.success('Invite created', {
        description: inviteEmail
          ? `Invitation sent to ${inviteEmail}.`
          : `Invitation code generated: ${data.code}`,
      });
      setInvites([...invites, data]);
      setInviteEmail('');
      setShowInviteDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error creating invite', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke invite
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/invites/${inviteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to revoke invite');
      }

      toast.success('Invite revoked', {
        description: 'The invitation has been revoked.',
      });
      setInvites(invites.filter((invite) => invite.id !== inviteId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error revoking invite', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete group');
      }

      toast.success('Group deleted', {
        description: 'The group has been successfully deleted.',
      });
      onUpdate();
      // Redirect to group page to show "no group" state
      window.location.href = '/group';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error deleting group', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Update member role and permissions
  const handleUpdateMemberRole = async () => {
    if (!memberToEdit) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/members/${memberToEdit.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: selectedRole,
          permissions: selectedRole === 'custom' ? memberPermissions : roles.find(r => r.id === selectedRole)?.permissions
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update member role');
      }

      toast.success('Member role updated', {
        description: `Member role has been updated.`,
      });
      onUpdate();
      setShowRoleDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error updating member role', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open role dialog with current member permissions
  const handleOpenRoleDialog = (member: (typeof group.members)[0]) => {
    setMemberToEdit(member);
    setSelectedRole(member.role || 'member');
    // Set permissions based on member's current role
    if (member.role === 'custom') {
      // If we had stored custom permissions, we would set them here
      setMemberPermissions({
        canCreateProjects: false,
        canCreateRepositories: false,
        canInviteMembers: false,
      });
    } else {
      // Set permissions based on predefined role
      const rolePermissions = roles.find(r => r.id === member.role)?.permissions;
      setMemberPermissions(rolePermissions || {
        canCreateProjects: false,
        canCreateRepositories: false,
        canInviteMembers: false,
      });
    }
    setShowRoleDialog(true);
  };

  // Handle role selection
  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    if (roleId !== 'custom') {
      const rolePermissions = roles.find(r => r.id === roleId)?.permissions;
      setMemberPermissions(rolePermissions || {
        canCreateProjects: false,
        canCreateRepositories: false,
        canInviteMembers: false,
      });
    }
  };

  // Non-leaders see a read-only view
  if (!isLeader) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5 text-primary" /> Group Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Only group leaders can modify group settings.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Group Username</Label>
              <p className="text-sm text-muted-foreground">{group.groupUserName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Members</Label>
              <p className="text-sm text-muted-foreground">
                {group.members.length} / {maxGroupSize} members
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4">
              <Select
                value={activeSection}
                onValueChange={setActiveSection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {navItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Desktop Sidebar */}
            <nav className="hidden md:block space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'secondary' : 'ghost'}
                  className={`w-full justify-start text-left text-sm font-medium ${
                    activeSection === item.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Group Username</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your groups unique username.
                  </p>
                  <div className="max-w-md space-y-2">
                    <Input
                      value={groupUserName}
                      onChange={(e) => {
                        setGroupUserName(e.target.value);
                        setGroupUserNameError('');
                      }}
                      placeholder="Enter group username"
                      className={`border-gray-300 dark:border-gray-600 ${
                        groupUserNameError ? 'border-red-500' : ''
                      }`}
                    />
                    {groupUserNameError && (
                      <p className="text-sm text-red-500">{groupUserNameError}</p>
                    )}
                    <Button
                      onClick={handleUpdateGroupUserName}
                      disabled={isLoading || groupUserName === group.groupUserName}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        'Update Username'
                      )}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-lg font-semibold mb-2">Profile Picture</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a profile picture for your group (JPEG, PNG, or GIF, max 5MB).
                  </p>
                  <div className="flex items-center gap-4 max-w-md">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleProfilePictureChange}
                        className="border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        onClick={handleUpdateProfilePicture}
                        disabled={!profilePicture || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          'Upload Picture'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'members' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Invite Members</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite new members to your group. Current: {group.members.length}/{maxGroupSize}.
                  </p>
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    disabled={group.members.length >= maxGroupSize || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Invite Member
                  </Button>
                </div>
                {invites.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-md font-semibold mb-2">Active Invites</h3>
                    <ul className="space-y-4">
                      {invites.map((invite) => (
                        <li
                          key={invite.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {invite.email
                                ? `Email: ${invite.email}`
                                : `Code: ${invite.code}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite.id)}
                            disabled={isLoading}
                            className="border-gray-300 dark:border-gray-600 text-red-600 hover:text-red-700"
                          >
                            Revoke
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'roles' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Roles & Permissions</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage member roles and permissions within your group.
                  </p>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-md font-semibold mb-4">Members</h3>
                    <ul className="space-y-4">
                      {group.members.map((member) => (
                        <li
                          key={member.userId}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {member.displayName || member.userName || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email || 'No email available'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 py-1 px-2 rounded-full">
                              {member.role || 'Member'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRoleDialog(member)}
                              disabled={isLoading || member.userId === session?.user.userId}
                              className="border-gray-300 dark:border-gray-600"
                            >
                              Edit Role
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'danger' && (
              <div>
                <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
                <div className="border border-red-300 dark:border-red-800 rounded-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Delete this group</p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All group data, including projects and repositories, will be permanently deleted.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-300 dark:border-red-800 text-red-600 hover:text-red-700"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Group
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Invite a Member</DialogTitle>
            <DialogDescription>
              Invite a new member by email or generate an invitation code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email (Optional)</Label>
              <Input
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError('');
                }}
                placeholder="Enter email address"
                className={`border-gray-300 dark:border-gray-600 ${inviteError ? 'border-red-500' : ''}`}
              />
              {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
              <p className="text-sm text-muted-foreground">
                Leave blank to generate an invitation code that can be shared manually.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvite}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Create Invite'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the group "{group.name}"? This action cannot be undone, and all associated data (projects, repositories, etc.) will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-300 dark:border-red-800 text-red-600 hover:text-red-700"
              onClick={handleDeleteGroup}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Delete Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Manage Member Role</DialogTitle>
            <DialogDescription>
              Update role and permissions for {memberToEdit?.displayName || memberToEdit?.userName || 'this member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'custom' && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold">Custom Permissions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="createProjects" className="flex-1">Can create projects</Label>
                    <input
                      type="checkbox"
                      id="createProjects"
                      checked={memberPermissions.canCreateProjects}
                      onChange={(e) => setMemberPermissions({...memberPermissions, canCreateProjects: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="createRepositories" className="flex-1">Can create repositories</Label>
                    <input
                      type="checkbox"
                      id="createRepositories"
                      checked={memberPermissions.canCreateRepositories}
                      onChange={(e) => setMemberPermissions({...memberPermissions, canCreateRepositories: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inviteMembers" className="flex-1">Can invite members</Label>
                    <input
                      type="checkbox"
                      id="inviteMembers"
                      checked={memberPermissions.canInviteMembers}
                      onChange={(e) => setMemberPermissions({...memberPermissions, canInviteMembers: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMemberRole}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}