"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, Camera } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"

export default function ProfileSettings() {
  const { data: session, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [profileInfo, setProfileInfo] = useState({
    department: "",
    batchYear: "",
  })

  useEffect(() => {
    if (session?.user?.imageUrl) {
      setProfileImagePreview(session.user.imageUrl)
    }
    if (session?.user?.profileInfo) {
      setProfileInfo({
        department: session.user.profileInfo.department || "",
        batchYear: session.user.profileInfo.batchYear || "",
      })
    }
  }, [session])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Image must be less than 5MB",
      })
      return
    }

    setProfileImage(file)
    setProfileImagePreview(URL.createObjectURL(file))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.userId) {
      toast.error("User not found")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Update profile info if changed
      const profileUpdated = await updateProfileInfo()
      
      // Update profile image if changed
      let imageUpdated = false
      if (profileImage) {
        imageUpdated = await updateProfileImage()
      }

      if (profileUpdated || imageUpdated) {
        // Update the session to reflect changes
        await updateSession()
        toast.success("Profile updated successfully")
      } else {
        toast.info("No changes to update")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfileInfo = async () => {
    // Check if profile info has changed
    if (
      session?.user?.profileInfo?.department === profileInfo.department &&
      session?.user?.profileInfo?.batchYear === profileInfo.batchYear
    ) {
      return false
    }

    try {
      const response = await fetch(`/api/users/${session?.user?.userId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileInfo: {
            ...session?.user?.profileInfo,
            ...profileInfo,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile information")
      }

      return true
    } catch (error) {
      throw error
    }
  }

  const updateProfileImage = async () => {
    if (!profileImage) return false

    try {
      const formData = new FormData()
      formData.append("file", profileImage)

      const response = await fetch(`/api/users/${session?.user?.userId}/profile-photo`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to update profile image")
      }

      // Clear the file input
      setProfileImage(null)

      return true
    } catch (error) {
      throw error
    }
  }

  const departments = [
    { value: "computer-science", label: "Computer Science" },
    { value: "information-technology", label: "Information Technology" },
    { value: "software-engineering", label: "Software Engineering" },
    { value: "information-systems", label: "Information Systems" },
    { value: "computer-engineering", label: "Computer Engineering" },
  ]

  const currentYear = new Date().getFullYear()
  const batchYears = Array.from({ length: 7 }, (_, i) => (currentYear - 5 + i).toString())

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and avatar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="avatar">Profile Photo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={profileInfo.department}
                    onValueChange={(value) => setProfileInfo(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="batchYear">Batch Year</Label>
                  <Select
                    value={profileInfo.batchYear}
                    onValueChange={(value) => setProfileInfo(prev => ({ ...prev, batchYear: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch year" />
                    </SelectTrigger>
                    <SelectContent>
                      {batchYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="avatar" className="space-y-6">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative w-40 h-40">
                <Avatar className="w-full h-full">
                  {profileImagePreview ? (
                    <AvatarImage src={profileImagePreview} alt="Profile preview" />
                  ) : (
                    <AvatarFallback className="text-4xl">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <span className="sr-only">Upload profile picture</span>
                </label>
                <Input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a photo of yourself. PNG or JPG, max 5MB.
                </p>
                {profileImage && (
                  <Button 
                    onClick={updateProfileImage}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Photo
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 