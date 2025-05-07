"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Loader2, Lock, Mail, Building, Clock, Briefcase, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SettingsProps {
  userId: string;
  isOwner: boolean;
  initialData?: any;
}

export default function AdvisorSettings({ userId, isOwner, initialData }: SettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: initialData?.email || "",
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    department: initialData?.profileInfo?.department || "",
    officeNumber: initialData?.profileInfo?.officeNumber || "",
    officeHours: initialData?.profileInfo?.officeHours || "",
    specialization: initialData?.profileInfo?.specialization || "",
    bio: initialData?.profileInfo?.bio || "",
    researchInterests: initialData?.profileInfo?.researchInterests?.join(", ") || "",
    emailNotifications: initialData?.profileInfo?.emailNotifications !== false,
    publicProfile: initialData?.profileInfo?.publicProfile !== false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      toast.error("You don't have permission to update this profile");
      return;
    }

    try {
      setIsLoading(true);

      // Format profileInfo
      const profileInfo = {
        department: formData.department,
        officeNumber: formData.officeNumber,
        officeHours: formData.officeHours,
        specialization: formData.specialization,
        bio: formData.bio,
        researchInterests: formData.researchInterests
          ? formData.researchInterests.split(",").map((item: string) => item.trim())
          : [],
        emailNotifications: formData.emailNotifications,
        publicProfile: formData.publicProfile,
      };

      // Make API call to update user data
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          profileInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // If not the owner, show a message
  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </CardTitle>
          <CardDescription>Manage your advisor profile settings</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Access Restricted</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You don't have permission to modify these settings. Only the profile owner can make changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Profile Settings
        </CardTitle>
        <CardDescription>Manage your advisor profile information and preferences</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Professional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Professional Information</h3>
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" /> Department
              </Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Specialization
              </Label>
              <Input
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="officeNumber" className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" /> Office Number
                </Label>
                <Input
                  id="officeNumber"
                  name="officeNumber"
                  value={formData.officeNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeHours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Office Hours
                </Label>
                <Input
                  id="officeHours"
                  name="officeHours"
                  value={formData.officeHours}
                  onChange={handleInputChange}
                  placeholder="e.g., Mon, Wed 2-4pm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" /> Biography
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Share your professional background and experience..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="researchInterests">Research Interests</Label>
              <Textarea
                id="researchInterests"
                name="researchInterests"
                value={formData.researchInterests}
                onChange={handleInputChange}
                rows={2}
                placeholder="Enter research interests separated by commas"
              />
              <p className="text-xs text-muted-foreground">
                Separate different research interests with commas
              </p>
            </div>
          </div>

          <Separator />

          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profile Preferences</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications about your advised projects
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={formData.emailNotifications}
                onCheckedChange={(checked: boolean) => handleSwitchChange("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="publicProfile">Public Profile</Label>
                <p className="text-xs text-muted-foreground">
                  Make your profile visible to students looking for advisors
                </p>
              </div>
              <Switch
                id="publicProfile"
                checked={formData.publicProfile}
                onCheckedChange={(checked: boolean) => handleSwitchChange("publicProfile", checked)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 