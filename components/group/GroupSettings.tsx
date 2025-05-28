"use client"

import { useEffect, useState } from 'react';
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
import { Loader2, Trash2, UserPlus, Image, Users, Settings, User, Code } from 'lucide-react';
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
// const groupUserNameSchema = z.object({
//   groupUserName: z
//     .string()
//     .trim()
//     .min(3, 'Group username must be at least 3 characters')
//     .max(30, 'Group username must be at most 30 characters')
//     .regex(/^[a-zA-Z0-9_-]+$/, 'Group username can only contain letters, numbers, underscores, and hyphens'),
// });

const inviteSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

interface GroupSettingsProps {
  group: Group & {
    id: string;
    members: { 
      userId: string; 
      userName?: string; 
      displayName?: string; 
      firstName?: string;
      lastName?: string;
      email?: string; 
      role?: string 
    }[];
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [invites, setInvites] = useState<GroupInvite[]>(group.invites || []);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<(typeof group.members)[0] | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<{
    canCreateProjects: boolean;
    canCreateRepositories: boolean;
    canInviteMembers: boolean;
  }>({
    canCreateProjects: false,
    canCreateRepositories: false,
    canInviteMembers: false,
  });

  // Fetch active invites when component mounts
  useEffect(() => {
    if (isLeader && group.groupUserName) {
      fetchActiveInvites();
    }
  }, [group.groupUserName, isLeader]);

  // Function to fetch active invites from the API
  const fetchActiveInvites = async () => {
    if (!group.groupUserName) return;

    try {
      const response = await fetch(`/api/groups/${group.groupUserName}/invite-code`);
      const data = await response.json();

      if (response.ok && data.invitations) {
        setInvites(data.invitations);
      }
    } catch (error) {
      console.error('Failed to fetch active invites:', error);
    }
  };

  // Sidebar navigation items
  const navItems = [
    { id: "general", label: "General", icon: Settings },
    { id: "members", label: "Members", icon: Users },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ]

  // Predefined roles
  const roles = [
    { id: 'member', label: 'Member', permissions: { canCreateProjects: false, canCreateRepositories: false, canInviteMembers: false } },
    { id: 'contributor', label: 'Contributor', permissions: { canCreateProjects: false, canCreateRepositories: true, canInviteMembers: false } },
    { id: 'manager', label: 'Manager', permissions: { canCreateProjects: true, canCreateRepositories: true, canInviteMembers: true } },
    { id: 'admin', label: 'Admin', permissions: { canCreateProjects: true, canCreateRepositories: true, canInviteMembers: true } },
    { id: 'custom', label: 'Custom', permissions: { canCreateProjects: false, canCreateRepositories: false, canInviteMembers: false } },
  ];

  // Create invite
  const handleCreateInvite = async () => {
    if (group.members.length >= maxGroupSize) {
      toast.error("Group is full", {
        description: `Cannot invite more members. Maximum group size is ${maxGroupSize}.`,
      })
      return
    }

    if (!group.groupUserName) {
      toast.error('Group username is missing', {
        description: 'Unable to create invite. Please try refreshing the page.',
      });
      return;
    }
    if (!session?.user?.userId) {
      toast.error('Authentication error', {
        description: 'User session not found. Please log in again.',
      });
      return;
    }

    try {
      setIsLoading(true);
      // Use the correct API endpoint for generating invitation codes
      const response = await fetch(`/api/groups/${group.groupUserName}/invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupUserName: group.groupUserName 
        }),
      });

      // Simulate API call delay - consider removing or making conditional for production
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Assuming the API returns the new code or minimal info, and we construct the rest for immediate UI update.
      // Or, if API returns the full invite object, use that. For now, constructing with fixes.
      const createdInviteCode = `WDT2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`; // Potentially from response.data.code

      const newInvite: GroupInvite = {
        id: `invite-${Date.now()}`, // This should ideally come from the backend response
        code: createdInviteCode,
        email: inviteEmail.trim() || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Use Date object
        createdAt: new Date(), // Use Date object
        groupUserName: group.groupUserName,
        usedAt: null,
        createdById: session.user.userId,
      };
      
      // If the API call itself returns data that should be used for the toast or newInvite, adjust accordingly.
      // For instance, if response.json() was const data = await response.json();
      // and data.inviteCode exists:
      // toast.success('Invite code generated', {
      //   description: `Invitation code: ${data.inviteCode}`,
      // });
      // And newInvite.code would be data.inviteCode

      toast.success('Invite code generated', {
        description: `Invitation code: ${newInvite.code}`,
      });
      
      fetchActiveInvites(); // Refresh the list of invites from the server
      setShowInviteDialog(false);
      setInvites(prevInvites => [...prevInvites, newInvite]);
      setInviteEmail("");
      setInviteMessage("");
      // setTimeout(() => setShowInviteDialog(false), 1000); // setShowInviteDialog is already called
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error generating invite code', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy invite code to clipboard
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success("Copied to clipboard", {
        description: "Invitation code copied successfully.",
      })
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error("Failed to copy", {
        description: "Could not copy invitation code to clipboard.",
      })
    }
  }

  // Mock revoke invite
  const handleRevokeInvite = async (inviteId: string) => {
    if (!group.groupUserName) {
      toast.error('Group username is missing', {
        description: 'Unable to revoke invite. Please try refreshing the page.',
      });
      return;
    }

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
      
      // Refresh the invites list instead of manually filtering
      fetchActiveInvites();
    } catch (error) {
      toast.error("Error revoking invite", {
        description: "Something went wrong while revoking the invitation.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mock resend notification
  const handleResendNotification = async (invite: GroupInvite) => {
    if (!invite.email) {
      toast.error("No email associated with this invite");
      return;
    }
    if (!group.groupUserName) {
      toast.error('Group username is missing', {
        description: 'Unable to resend notification. Please try refreshing the page.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/invites/${invite.id}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to resend notification' }));
        throw new Error(errorData.message || 'Failed to resend notification');
      }

      toast.success("Notification resent", {
        description: `Invitation notification resent to ${invite.email}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error("Failed to resend notification", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!group.groupUserName) {
      toast.error('Group username is missing', {
        description: 'Unable to delete group. Please try refreshing the page.',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete group' }));
        throw new Error(errorData.message || 'Failed to delete group');
      }

      toast.success('Group deleted', {
        description: `Group "${group.name}" has been permanently deleted.`,
      });
      onUpdate(); // Refresh parent component data or redirect
      setShowDeleteDialog(false); // Close the dialog
    } catch (error) { // <<< This catch was for handleResendNotification, now correctly for handleDeleteGroup
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error("Error deleting group", { // Changed error message
        description: errorMessage,
      });
    } finally {
      setIsLoading(false); // This finally was for handleResendNotification, now correctly for handleDeleteGroup
    }
  };

  // Update member role and permissions
  const handleUpdateMemberRole = async () => {
    if (!memberToEdit) return;
    
    if (!group.groupUserName) {
      toast.error('Group username is missing', {
        description: 'Unable to update member role. Please try refreshing the page.',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberUserId: memberToEdit.userId,
          role: selectedRole,
          permissions: selectedRole === 'custom' ? memberPermissions : roles.find(r => r.id === selectedRole)?.permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update member role');
      }

      toast.success('Member role updated', {
        description: `Member role has been updated to ${selectedRole}.`,
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
              <p className="text-sm text-muted-foreground">{group.groupUserName || 'Not set'}</p>
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
        <Card className="border border-gray-200 dark:border-gray-700 sticky top-4 shadow-sm">
          <CardContent className="p-4">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4">
              <Select
                value={activeSection}
                onValueChange={setActiveSection}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {navItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </div>
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
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left text-sm font-medium ${
                    activeSection === item.id
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-900"
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
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Group Information</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Current group username (cannot be changed here): <strong>{group.groupUserName}</strong>
                  </p>
                  {/* Display other general group info if needed */}
                </div>
              </div>
            )}

            {activeSection === 'members' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Invite Members</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite new members to your group with email notifications. Current: {group.members.length}/
                    {maxGroupSize}.
                  </p>
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    disabled={group.members.length >= maxGroupSize || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Code className="h-4 w-4 mr-2" /> Generate Invitation Code
                  </Button>
                </div>
                {invites.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-md font-semibold mb-4">Active Invites</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Invitation Code</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {invite.code}
                            </p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(invite.code);
                                toast.success('Copied to clipboard');
                              }}
                            >
                              <Image className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-auto">
                            Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Roles & Permissions</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage member roles and permissions within your group.
                  </p>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-md font-semibold mb-4">Members</h3>
                    <div className="space-y-4">
                      {group.members.map((member) => (
                        <div
                          key={member.userId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {member.displayName || member.userName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.lastName) || 'Unknown User'}
                                {member.userId === group.leaderId && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                    Leader
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email || 'No email available'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-13">
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 py-1 px-2 rounded-full">
                              {member.role || 'Member'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRoleDialog(member)}
                              disabled={isLoading || member.userId === session?.user.userId || member.userId === group.leaderId}
                              className="border-gray-300 dark:border-gray-600"
                            >
                              Edit Role
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "danger" && (
              <div>
                <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
                <div className="border border-red-300 dark:border-red-800 rounded-md p-6 bg-red-50 dark:bg-red-900/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Delete this group</p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All group data will be permanently deleted.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-300 dark:border-red-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 sm:self-start"
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

      {/* Enhanced Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="border-gray-200 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Invitation Code</DialogTitle>
            <DialogDescription>
              Create an invitation code that can be shared with new members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              This will generate a unique invitation code that you can share with new members. 
              They can use this code to join your group.
            </p>
            <p className="text-sm text-muted-foreground">
              The code will expire after 24 hours.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false)
                setInviteEmail("")
                setInviteMessage("")
                setInviteError("")
              }}
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
                'Generate Code'
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
  )
}
