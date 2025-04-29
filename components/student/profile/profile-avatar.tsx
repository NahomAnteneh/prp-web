"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, Calendar, Edit, Hash, Mail, School } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  user: {
    id: string
    username: string
    name: string
    role: string
    imageUrl?: string
    profileInfo: {
      idNumber: string
      email: string
      department: string
      batchYear: string
    }
  } | null
}

export default function ProfileAvatar({ user}: ProfileAvatarProps) {
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
  const { name, username, role, profileInfo, imageUrl } = user
  const { idNumber, email, department, batchYear } = profileInfo

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col items-center">
      <div className="relative w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-primary/20">
          <Avatar className="w-full h-full">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt={`${name}'s profile picture`} />
            ) : (
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-2xl">{name}</CardTitle>
            <CardDescription className="flex flex-col items-center">@{username}</CardDescription>
          </div>
          {/* <Badge className="bg-blue-500 hover:bg-blue-600">{role}</Badge> */}
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="flex flex-wrap gap-2 w-full mb-4">
          <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">ID:</dt>
              <dd className="font-medium">{idNumber}</dd>
            </div>
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Department:</dt>
              <dd className="font-medium">{department}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Batch Year:</dt>
              <dd className="font-medium">{batchYear}</dd>
            </div>
          </dl>
      </CardContent>
    </Card>
  )
}