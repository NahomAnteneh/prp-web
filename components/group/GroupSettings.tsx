"use client"

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
  group: {
    id: string
    name: string
    groupUserName: string
    leaderId: string
    members: { userId: string; userName?: string; displayName?: string; email?: string; role?: string }[]
    invites: { id: string; code: string; email: string | null; expiresAt: string; createdAt: string }[]
  }
  maxGroupSize: number
  isLeader: boolean
  onUpdate: () => void
}

export default function EnhancedGroupSettings({ group, maxGroupSize, isLeader, onUpdate }: GroupSettingsProps) {
  const [activeSection, setActiveSection] = useState("members")
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [invites, setInvites] = useState(group.invites)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [notificationSent, setNotificationSent] = useState(false)

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
    setInviteError("")
    setNotificationSent(false)

    if (!inviteEmail && !inviteMessage) {
      setInviteError("Please provide an email address")
      return
    }

    if (group.members.length >= maxGroupSize) {
      toast.error("Group is full", {
        description: `Cannot invite more members. Maximum group size is ${maxGroupSize}.`,
      })
      return
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() || null }),
      });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock successful invite creation
      const newInvite = {
        id: `invite-${Date.now()}`,
        code: `WDT2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        email: inviteEmail.trim() || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      }

      if (inviteEmail.trim()) {
        setNotificationSent(true)
        toast.success("Invite created and notification sent!", {
          description: `Invitation sent to ${inviteEmail} with email notification.`,
        })
      } else {
        toast.success("Invite created", {
          description: `Invitation code generated: ${newInvite.code}`,
        })
      }

      setInvites([...invites, newInvite])
      setInviteEmail("")
      setInviteMessage("")
      setTimeout(() => setShowInviteDialog(false), 1000)
    } catch (error) {
      toast.error("Error creating invite", {
        description: "Something went wrong while creating the invitation.",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}/invites/${inviteId}`, {
        method: 'DELETE',
      });

      toast.success("Invite revoked", {
        description: "The invitation has been revoked.",
      })
      setInvites(invites.filter((invite) => invite.id !== inviteId))
    } catch (error) {
      toast.error("Error revoking invite", {
        description: "Something went wrong while revoking the invitation.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Mock resend notification
  const handleResendNotification = async (invite: any) => {
    if (!invite.email) {
      toast.error("No email associated with this invite")
      return
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.groupUserName}`, {
        method: 'DELETE',
      });

      toast.success("Notification resent", {
        description: `Invitation notification resent to ${invite.email}.`,
      })
    } catch (error) {
      toast.error("Failed to resend notification", {
        description: "Could not resend the invitation notification.",
      })
    } finally {
      setIsLoading(false)
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
              <Select value={activeSection} onValueChange={setActiveSection}>
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
                    Invite new members to your group with email notifications. Current: {group.members.length}/
                    {maxGroupSize}.
                  </p>
                  <Button
                    onClick={() => setShowInviteDialog(true)}
                    disabled={group.members.length >= maxGroupSize || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Invite Member
                  </Button>
                </div>

                {/* Current Members */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-md font-semibold mb-4">Current Members</h3>
                  <div className="space-y-3">
                    {group.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {member.displayName || member.userName || "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === "leader" ? "default" : "secondary"}>
                            {member.role || "Member"}
                          </Badge>
                          {member.userId === group.leaderId && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Leader
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Invites */}
                {invites.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-md font-semibold mb-4">Active Invites</h3>
                    <div className="space-y-4">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {invite.email ? (
                                  <Mail className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-600" />
                                )}
                                <p className="text-sm font-medium">
                                  {invite.email ? `Email: ${invite.email}` : "Manual Invite Code"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                  {invite.code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCode(invite.code)}
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedCode === invite.code ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {invite.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendNotification(invite)}
                                  disabled={isLoading}
                                  className="text-xs"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Resend
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeInvite(invite.id)}
                                disabled={isLoading}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Revoke
                              </Button>
                            </div>
                          </div>
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
                  <h2 className="text-lg font-semibold mb-2">Group Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Group Name</Label>
                      <p className="text-sm text-muted-foreground">{group.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Group Username</Label>
                      <p className="text-sm text-muted-foreground">@{group.groupUserName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Members</Label>
                      <p className="text-sm text-muted-foreground">
                        {group.members.length} / {maxGroupSize} members
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "danger" && (
              <div>
                <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
                <div className="border border-red-300 dark:border-red-800 rounded-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Delete this group</p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All group data will be permanently deleted.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-300 dark:border-red-800 text-red-600 hover:text-red-700"
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
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite a Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation with email notification or generate a shareable code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  setInviteError("")
                }}
                placeholder="member@example.com"
                className={`border-gray-300 dark:border-gray-600 ${inviteError ? "border-red-500" : ""}`}
              />
              {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
              <p className="text-xs text-muted-foreground">
                We'll send an email notification with the invitation details.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteMessage">Personal Message (Optional)</Label>
              <Textarea
                id="inviteMessage"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                className="border-gray-300 dark:border-gray-600 min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{inviteMessage.length}/500 characters</p>
            </div>

            {notificationSent && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-200">Notification sent successfully! 🎉</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false)
                setInviteEmail("")
                setInviteMessage("")
                setInviteError("")
                setNotificationSent(false)
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
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
