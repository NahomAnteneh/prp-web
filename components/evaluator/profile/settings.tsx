'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lock, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface EvaluatorProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  profileInfo: {
    department: string;
    specialization: string;
    expertise?: string[];
    bio?: string;
  };
}

interface EvaluatorSettingsProps {
  userId: string;
  isOwner?: boolean;
  initialData: EvaluatorProfile | null;
}

export default function EvaluatorSettings({ userId, isOwner = false, initialData }: EvaluatorSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [formData, setFormData] = useState({
    department: initialData?.profileInfo?.department || '',
    specialization: initialData?.profileInfo?.specialization || '',
    expertise: initialData?.profileInfo?.expertise?.join(', ') || '',
    bio: initialData?.profileInfo?.bio || '',
    email: initialData?.email || '',
    name: initialData?.name || '',
    emailNotifications: true,
    projectNotifications: true,
    feedbackNotifications: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOwner) {
      toast.error('You do not have permission to update these settings');
      return;
    }

    try {
      setIsLoading(true);
      
      // Transform data for API
      const apiData = {
        profileInfo: {
          department: formData.department,
          specialization: formData.specialization,
          expertise: formData.expertise.split(',').map(item => item.trim()).filter(Boolean),
          bio: formData.bio,
        },
        name: formData.name,
        email: formData.email,
        notificationSettings: {
          emailNotifications: formData.emailNotifications,
          projectNotifications: formData.projectNotifications,
          feedbackNotifications: formData.feedbackNotifications,
        }
      };
      
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast.success('Profile settings updated successfully', {
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile settings', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsLoading(true);
      setShowDeactivateDialog(false);
      
      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate account');
      }
      
      toast.success('Account deactivated', {
        description: 'Your account has been deactivated successfully.',
      });
      
      // Redirect to logout after a short delay
      setTimeout(() => {
        window.location.href = '/auth/logout';
      }, 2000);
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error('Failed to deactivate account', {
        description: 'Please try again later or contact support.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your evaluator profile settings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Lock className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Restricted Access</h3>
            <p className="text-muted-foreground mt-2">
              You don't have permission to view or modify these settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your evaluator profile settings and preferences
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email address"
                  />
                </div>
              </div>
            </div>
            
            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Your department"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Your area of specialization"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expertise">Areas of Expertise</Label>
                <Input
                  id="expertise"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleInputChange}
                  placeholder="Enter comma-separated areas of expertise"
                />
                <p className="text-sm text-muted-foreground">
                  Separate each area of expertise with a comma (e.g., "Machine Learning, Data Science, AI Ethics")
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write a brief description about yourself and your evaluation approach"
                  rows={5}
                />
              </div>
            </div>
            
            {/* Notification Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="projectNotifications">Project Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about project updates
                    </p>
                  </div>
                  <Switch
                    id="projectNotifications"
                    checked={formData.projectNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('projectNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="feedbackNotifications">Feedback Responses</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when someone responds to your feedback
                    </p>
                  </div>
                  <Switch
                    id="feedbackNotifications"
                    checked={formData.feedbackNotifications}
                    onCheckedChange={(checked) => handleSwitchChange('feedbackNotifications', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setShowDeactivateDialog(true)}
              disabled={isLoading}
            >
              Deactivate Account
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate your account? This will remove your access to the platform and all your evaluator assignments.
              <br /><br />
              <Badge variant="destructive" className="mt-2">
                <AlertCircle className="mr-1 h-3 w-3" />
                This action cannot be undone
              </Badge>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Processing...' : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Deactivation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 