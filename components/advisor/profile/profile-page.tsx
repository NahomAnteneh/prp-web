"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, Star, MapPin, Clock, Folder, FileText, ListChecks, Settings, CheckSquare, History } from "lucide-react"
import { useSession } from "next-auth/react"
import AdvisorLayout from "@/components/advisor/dashboard/AdvisorLayout"
import { Navbar as GeneralNavbar } from "../../navbar"
import { Footer as GeneralFooter } from "../../footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileAvatar from "@/components/advisor/profile/profile-avatar"
import ProfileOverview from "@/components/advisor/profile/profile-overview"
import AdviseesList from "@/components/advisor/profile/advisees-list"
import AdvisedProjects from "@/components/advisor/profile/advised-projects"
import AdvisorSettings from "@/components/advisor/profile/settings"
import EvaluatedProjects from "@/components/advisor/profile/evaluated-projects"
import CurrentEvaluations from "./current-evaluations"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AdvisorProfile {
  userId: string
  name: string
  email: string
  role: string
  imageUrl?: string
  profileInfo: {
    department: string
    officeNumber: string
    officeHours: string
    specialization: string
  }
  viewerHasFullAccess?: boolean
  unreadNotificationsCount?: number
}

interface AdvisorProfilePageProps {
  userId?: string
  username: string
  visitor: boolean
}

export default function AdvisorProfilePage({ userId: propUserId, username: propUsername, visitor: isVisitor }: AdvisorProfilePageProps) {
  const userId = propUserId 
  const username = propUsername
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<AdvisorProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  
  // Check if the current user is the profile owner
  const isOwner = session?.user?.userId === userId;
  // Use viewerHasFullAccess from API response when available, otherwise fallback to session check
  const canEdit = profileData?.viewerHasFullAccess || isOwner
  
  // Check if the user is currently an evaluator
  const isEvaluator = profileData?.role === "evaluator"

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/users/${userId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          // Handle specific status codes
          if (response.status === 401 || response.status === 403) {
            throw new Error(errorData.error || "Not authorized to view this profile");
          }
          throw new Error(errorData.error || "Failed to fetch profile data");
        }
        
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        if (err instanceof Error && err.message.includes("Not authorized")) {
          setError("You don't have permission to view this profile. Please sign in or contact an administrator.");
        } else {
          setError("User not found");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        {isOwner ? <AdvisorLayout unreadNotifications={0}><div/></AdvisorLayout> : <GeneralNavbar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
            <p className="mb-6">{error}</p>
            {error.includes("permission") && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  You need to be signed in as an authorized user to view this profile
                </p>
                <Button asChild className="mt-2">
                  <Link href="/login?returnTo=back">Sign in</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        {isOwner ? null : <GeneralFooter />}
      </div>
    )
  }

  const ProfileContent = () => (
    <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="h-64 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="md:w-2/3">
              <div className="h-64 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{profileData?.name || username}\'s Profile</h1>
            <p className="text-muted-foreground mt-1">Advisor at {profileData?.profileInfo?.department || 'University'}</p>
          </div>
          */}
          
          <Tabs defaultValue="overview" className="w-full space-y-6">
            <TabsList 
              className={cn(
                "grid w-full h-auto p-1",
                `grid-cols-${4 + (isOwner && isEvaluator ? 1 : 0) + (canEdit ? 1 : 0)}`
              )}
            >
              <TabsTrigger value="overview" className="flex items-center gap-2 py-1">
                <Users className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="advisees" className="flex items-center gap-2 py-1">
                <BookOpen className="h-4 w-4" /> Advisees
              </TabsTrigger>
              <TabsTrigger value="advised-projects" className="flex items-center gap-2 py-1">
                <FileText className="h-4 w-4" /> Advised Projects
              </TabsTrigger>
              <TabsTrigger value="evaluated-projects" className="flex items-center gap-2 py-1">
                <History className="h-4 w-4" /> Evaluation History
              </TabsTrigger>
              {isOwner && isEvaluator && (
                <TabsTrigger value="current-evaluations" className="flex items-center gap-2 py-1">
                  <CheckSquare className="h-4 w-4" /> Current Evaluations
                </TabsTrigger>
              )}
              {canEdit && (
                <TabsTrigger value="settings" className="flex items-center gap-2 py-1">
                  <Settings className="h-4 w-4" /> Settings
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="overview" className="mt-0">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 lg:w-1/4">
                  <ProfileAvatar user={profileData} isOwner={canEdit} />
                </div>
                <div className="md:w-2/3 lg:w-3/4 space-y-6">
                  <ProfileOverview userId={username} isOwner={canEdit} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advisees" className="mt-0">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 lg:w-1/4">
                  <ProfileAvatar user={profileData} isOwner={canEdit} />
                </div>
                <div className="md:w-2/3 lg:w-3/4">
                  <AdviseesList userId={username} isOwner={canEdit} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advised-projects" className="mt-0">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 lg:w-1/4">
                  <ProfileAvatar user={profileData} isOwner={canEdit} />
                </div>
                <div className="md:w-2/3 lg:w-3/4">
                  <AdvisedProjects userId={username} isOwner={canEdit} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="evaluated-projects" className="mt-0">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 lg:w-1/4">
                  <ProfileAvatar user={profileData} isOwner={canEdit} />
                </div>
                <div className="md:w-2/3 lg:w-3/4">
                  <EvaluatedProjects userId={username} isOwner={canEdit} />
                </div>
              </div>
            </TabsContent>
            
            {isOwner && isEvaluator && (
              <TabsContent value="current-evaluations" className="mt-0">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 lg:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-2/3 lg:w-3/4">
                    <CurrentEvaluations userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
            )}
            
            {canEdit && (
              <TabsContent value="settings" className="mt-0">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 lg:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-2/3 lg:w-3/4">
                    <AdvisorSettings userId={username} isOwner={canEdit} initialData={profileData} />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </main>
  );

  if (isOwner) {
    return (
      <AdvisorLayout unreadNotifications={profileData?.unreadNotificationsCount || 0}>
        <ProfileContent />
      </AdvisorLayout>
    );
  } else {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <GeneralNavbar />
        <ProfileContent />
        <GeneralFooter />
      </div>
    );
  }
} 