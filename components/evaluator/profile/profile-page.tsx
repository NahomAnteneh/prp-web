"use client"

import { useEffect, useState } from "react"
import { Users, Star, CheckSquare, History, Settings, FileText, MessageSquare, Folder, Database } from "lucide-react"
import { useSession } from "next-auth/react"
import Navbar from "../../student/navbar"
import { Navbar as NavBar } from "../../navbar"
import Footer from "../../student/footer"
import { Footer as FooterComponent } from "../../footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileAvatar from "@/components/evaluator/profile/profile-avatar"
import ProfileOverview from "@/components/evaluator/profile/profile-overview"
import EvaluatedProjects from "@/components/evaluator/profile/evaluated-projects"
import EvaluatorSettings from "@/components/evaluator/profile/settings"
import CurrentEvaluations from "@/components/evaluator/profile/current-evaluations"
import ProjectFeedback from "@/components/evaluator/profile/project-feedback"

interface EvaluatorProfile {
  userId: string
  name: string
  email: string
  role: string
  imageUrl?: string
  profileInfo: {
    department: string
    specialization: string
    expertise: string[]
    bio: string
  }
  viewerHasFullAccess?: boolean
}

interface EvaluatorProfilePageProps {
  userId?: string
  username: string
  visitor: boolean
}

export default function EvaluatorProfilePage({ userId: propUserId, username: propUsername, visitor: isVisitor }: EvaluatorProfilePageProps) {
  const userId = propUserId 
  const username = propUsername
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<EvaluatorProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  
  // Check if the current user is the profile owner
  const isOwner = session?.user?.userId === userId;
  // Use viewerHasFullAccess from API response when available, otherwise fallback to session check
  const canEdit = profileData?.viewerHasFullAccess || isOwner
  
  // Check if the user is also an advisor
  const isAdvisor = profileData?.role === "advisor" || profileData?.role === "ADVISOR"

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
            <Tabs defaultValue="overview" className="w-full">
              <div className="w-full border-b">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="current-evaluations" className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" /> Current Evaluations
                  </TabsTrigger>
                  <TabsTrigger value="evaluated-projects" className="flex items-center gap-2">
                    <History className="h-4 w-4" /> Evaluation History
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Project Feedback
                  </TabsTrigger>
                  {isAdvisor && (
                    <TabsTrigger value="advised-projects" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Advised Projects
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </TabsTrigger>
                </TabsList>
              </div>
              
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
              
              <TabsContent value="current-evaluations" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <CurrentEvaluations userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="evaluated-projects" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <EvaluatedProjects userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <ProjectFeedback userId={username} isOwner={canEdit} />
                  </div>
                </div>
              </TabsContent>
              
              {isAdvisor && (
                <TabsContent value="advised-projects" className="mt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4">
                      <ProfileAvatar user={profileData} isOwner={canEdit} />
                    </div>
                    <div className="md:w-3/4">
                      {/* Reusing the advisor component if the evaluator is also an advisor */}
                      <div className="rounded-lg border p-6">
                        <h2 className="text-xl font-semibold mb-4">Advised Projects</h2>
                        <p className="text-gray-600">
                          You can view your advised projects on your advisor profile page.
                        </p>
                        <button 
                          className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                          onClick={() => window.location.href = `/advisor/${username}`}
                        >
                          <Folder className="mr-2 h-4 w-4" />
                          Go to Advisor Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="settings" className="mt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <ProfileAvatar user={profileData} isOwner={canEdit} />
                  </div>
                  <div className="md:w-3/4">
                    <EvaluatorSettings userId={username} isOwner={canEdit} initialData={profileData} />
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