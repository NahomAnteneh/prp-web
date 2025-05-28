"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Trash2, UserPlus, Users, Settings, User, Mail, Copy, Check, Send } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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

  // Mock invite creation with notification functionality
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
      setIsLoading(true)

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
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
            {activeSection === "members" && (
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
