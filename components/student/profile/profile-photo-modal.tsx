"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Camera, User } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useSession } from "next-auth/react"

interface ProfilePhotoModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess?: () => void
}

export default function ProfilePhotoModal({
  isOpen,
  onClose,
  userId,
  onSuccess
}: ProfilePhotoModalProps) {
  const { update: updateSession } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please upload an image file"
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Image must be less than 5MB"
      })
      return
    }

    setProfileImage(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!profileImage) return
    
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", profileImage)

      const response = await fetch(`/api/users/${userId}/profile-photo`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error("Failed to upload profile image")
      }

      // Update session to reflect changes
      await updateSession()
      toast.success("Profile photo uploaded successfully")
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      // Close the modal
      handleClose()
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload profile photo", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    toast.info("Profile photo skipped")
    handleClose()
    
    // Redirect to home page if needed
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleClose = () => {
    // Clean up any preview URLs to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setProfileImage(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set profile photo</DialogTitle>
          <DialogDescription>
            Upload a photo to personalize your profile
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
            {previewUrl ? (
              <Image 
                src={previewUrl} 
                alt="Profile preview" 
                fill 
                className="object-cover"
                sizes="(max-width: 128px) 100vw, 128px"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="space-y-2 w-full">
            <label 
              htmlFor="profile-upload" 
              className="flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-lg border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Camera className="h-5 w-5 text-gray-500" />
              <span>{profileImage ? "Change photo" : "Choose a photo"}</span>
            </label>
            <Input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-center text-muted-foreground">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="sm:order-1 order-2"
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!profileImage || isLoading}
            className="sm:order-2 order-1"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 