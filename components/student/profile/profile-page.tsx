"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { User, Users, BookOpen, Clock, Folder } from "lucide-react"
import Image from "next/image"
import Navbar from "../navbar"
import Footer from "../footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileAvatar from "./profile-avatar"
import ProfileInfo from "./profile-info"
import GroupOverview from "./group-overview"
import ProjectsList from "./projects-list"
import RecentActivities from "./recent-activities"

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
}

interface StudentProfilePageProps {
  userId?: string
}

export default function StudentProfilePage({ userId: propUserId }: StudentProfilePageProps) {
  const params = useParams()
  const userId = propUserId || (params?.userId as string)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        // In a real implementation, this would call your API
        // e.g., const response = await fetch(`/api/users/${userId}`)
        
        // For now, using mock data
        setTimeout(() => {
          setProfileData({
            id: userId,
            username: "student123",
            name: "John Doe",
            role: "STUDENT",
            profileInfo: {
              idNumber: "BDU1234/12",
              email: "john.doe@bdu.edu.et",
              department: "Software Engineering",
              batchYear: "2021",
              bio: "Final year Software Engineering student passionate about web development and AI."
            }
          })
          setIsLoading(false)
        }, 1000)
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setError("Failed to load profile data. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [userId])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar unreadNotifications={0} userName={profileData?.name} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar unreadNotifications={0} userName={profileData?.name} />
      
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
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <ProfileAvatar 
                  name={profileData?.name || "Student"} 
                  department={profileData?.profileInfo.department || ""}
                  imageUrl="/placeholder-avatar.jpg"
                />
              </div>
              <div className="md:w-2/3">
                <ProfileInfo user={profileData} />
              </div>
            </div>
            
            {/* Tabs for different sections */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Projects
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Activities
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Documents
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <GroupOverview userId={userId} />
              </TabsContent>
              
              <TabsContent value="projects" className="mt-6">
                <ProjectsList userId={userId} />
              </TabsContent>
              
              <TabsContent value="activities" className="mt-6">
                <RecentActivities userId={userId} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Resources</CardTitle>
                    <CardDescription>View and manage your documents and resources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      No documents available at this time
                    </p>
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