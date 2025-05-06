"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { User, Users, BookOpen, Clock, Folder, ListChecks } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import Navbar from "../navbar";
import { Navbar as NavBar } from "../../navbar";
import Footer from "../footer"
import {Footer as FooterComponent } from "../../footer"
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
  userId: string
    name: string
    email: string
    role: string
    imageUrl?: string
    profileInfo: {
      department: string
      batchYear: string
    }
  viewerHasFullAccess?: boolean
}

interface StudentProfilePageProps {
  userId?: string
  username: string
  visitor: boolean
}

export default function StudentProfilePage({ userId: propUserId, username: propUsername, visitor: isVisitor }: StudentProfilePageProps) {
  const userId = propUserId 
  const username = propUsername
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  
  // Check if the current user is the profile owner
  const isOwner = session?.user?.userId === userId;
  // Use viewerHasFullAccess from API response when available, otherwise fallback to session check
  const canEdit = profileData?.viewerHasFullAccess || isOwner

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
    {isVisitor ? (
      <NavBar />
    ): (
      <Navbar />
    )}
      
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
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3"> {/* Adjusted grid-cols to 3 */}
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Projects
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Tasks
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
            </Tabs>
          </div>
        )}
      </main>
      
      {isVisitor ? (
      <FooterComponent />
    ): (
      <Footer />
    )}
    </div>
  )
}