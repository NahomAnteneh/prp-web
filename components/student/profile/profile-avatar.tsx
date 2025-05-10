"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, Calendar, Edit, Hash, School, Camera } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface ProfileAvatarProps {
  user: {
    userId: string
    name: string
    email: string
    role: string
    imageUrl?: string
    profileInfo: {
      department: string
      batchYear: string
    }
  } | null
  isOwner?: boolean
}

export default function ProfileAvatar({ user, isOwner = false }: ProfileAvatarProps) {
  const { update: updateSession } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>User data unavailable</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  const { name, userId, role, email, profileInfo, imageUrl } = user
  const { department, batchYear } = profileInfo

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Show preview
    setProfileImagePreview(URL.createObjectURL(file))

    // Upload the file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/users/${userId}/profile-photo`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload profile image")
      }

      // Update session to reflect changes
      await updateSession()
      toast.success("Profile photo updated")

      // Clean up preview URL
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview)
      }
      setProfileImagePreview(null)
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload profile photo", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
          <Avatar className="w-full h-full">
            {profileImagePreview || imageUrl ? (
              <AvatarImage src={profileImagePreview || imageUrl} alt={`${name}'s profile picture`} />
            ) : (
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          {isOwner && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </Button>
              </label>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription>@{userId}</CardDescription>
          {/* <Badge className="bg-blue-500 hover:bg-blue-600">{role}</Badge> */}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isOwner && (
          <div className="mb-4">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
          </div>
        )}
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <dt className="text-muted-foreground w-24">ID:</dt>
            <dd className="font-medium truncate">{userId}</dd>
          </div>
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <dt className="text-muted-foreground w-24">Department:</dt>
            <dd className="font-medium truncate">{department}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <dt className="text-muted-foreground w-24">Batch Year:</dt>
            <dd className="font-medium truncate">{batchYear}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}