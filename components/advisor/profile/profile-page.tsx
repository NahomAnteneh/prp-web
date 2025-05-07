"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, Star, MapPin, Clock, Folder, FileText, ListChecks } from "lucide-react"
import { useSession } from "next-auth/react"
import Navbar from "../../student/navbar"
import { Navbar as NavBar } from "../../navbar"
import Footer from "../../student/footer"
import { Footer as FooterComponent } from "../../footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileAvatar from "@/components/advisor/profile/profile-avatar"
import ProfileOverview from "@/components/advisor/profile/profile-overview"
import AdviseesList from "@/components/advisor/profile/advisees-list"
import RatingsReviews from "@/components/advisor/profile/ratings-reviews"
import AdvisedProjects from "@/components/advisor/profile/advised-projects"

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
        {isVisitor ? <NavBar /> : <Navbar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
            <p className="mb-6">{error}</p>
          </div>
        </div>
        {isVisitor ? <FooterComponent /> : <Footer />}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isVisitor ? <NavBar /> : <Navbar />}
      
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="advisees" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Advisees
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Projects
                </TabsTrigger>
                <TabsTrigger value="ratings" className="flex items-center gap-2">
                  <Star className="h-4 w-4" /> Ratings
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
              
              <TabsContent value="advisees" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <AdviseesList userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="projects" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <AdvisedProjects userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ratings" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <RatingsReviews userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      {isVisitor ? <FooterComponent /> : <Footer />}
    </div>
  )
} 