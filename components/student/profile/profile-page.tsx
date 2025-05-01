"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { User, Users, BookOpen, Clock, Folder, ListChecks } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import Navbar from "../navbar"
import Footer from "../footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileAvatar from "./profile-avatar"
import ProfileOverview from "./profile-overview"
import ProjectsList from "./projects-list"
import RecentActivities from "./recent-activities"
import TasksList from "./tasks-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UserProfile {
  id: string
  username: string
  name: string
  role: string
  profileInfo: {
    idNumber: string
    email: string
    department: string
    batchYear: string
    bio?: string
  }
  viewerHasFullAccess?: boolean
}

interface StudentProfilePageProps {
  userId?: string
  username: string
  owner: boolean
}

export default function StudentProfilePage({ userId: propUserId, username: propUsername, owner: propOwner }: StudentProfilePageProps) {
  const userId = propUserId 
  const username = propUsername
  const owner = propOwner
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  
  // Check if the current user is the profile owner or an admin
  const isOwner = session?.user?.id === userId || session?.user?.username === username
  const isAdmin = session?.user?.role === "ADMINISTRATOR"
  // Use viewerHasFullAccess from API response when available, otherwise fallback to session check
  const canEdit = profileData?.viewerHasFullAccess || isOwner || isAdmin

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;

      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/users/${username}`, {
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
  }, [username]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
            <p className="mb-6">{error}</p>
            
            {error.includes("permission") && (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-red-100 p-3 text-red-500">
                  <User className="w-6 h-6" />
                </div>
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
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
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
            {/* Public View Banner */}
            {profileData && !profileData.viewerHasFullAccess && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm flex items-center justify-between dark:bg-blue-900/20 dark:border-blue-800">
                <span className="font-medium text-blue-700 dark:text-blue-400">You are viewing a limited public profile</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login?returnTo=back">Sign in for full access</Link>
                </Button>
              </div>
            )}
            
            {/* Profile ownership indicator (only visible to owner/admin) */}
            {canEdit && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex items-center justify-between">
                <span className="font-medium">You are viewing your own profile</span>
                <span className="text-xs text-muted-foreground">You can see private content and edit options</span>
              </div>
            )}
            
            {/* Tabs for different sections */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Projects
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Tasks
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Activities
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Documents
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4 h-fit">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4 space-y-6">
                    <ProfileOverview userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="projects" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <ProjectsList userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <TasksList userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activities" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <RecentActivities userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Resources</CardTitle>
                    <CardDescription>View and manage your documents and resources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {canEdit ? (
                      <>
                        <p className="text-muted-foreground text-center py-4">
                          No documents available at this time
                        </p>
                        <div className="flex justify-center mt-4">
                          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            Upload New Document
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No public documents available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}