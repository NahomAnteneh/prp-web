"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, Calendar, Edit, Hash, School, MapPin, Clock, Briefcase } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ProfileAvatarProps {
  user: {
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
  } | null
  isOwner?: boolean
}

export default function ProfileAvatar({ user, isOwner = false }: ProfileAvatarProps) {
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
  const { department, officeNumber, officeHours, specialization } = profileInfo

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
          <Avatar className="w-full h-full">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt={`${name}'s profile picture`} />
            ) : (
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription>@{userId}</CardDescription>
          <Badge className="bg-indigo-500 hover:bg-indigo-600">Advisor</Badge>
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
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <dt className="text-muted-foreground w-24">Office:</dt>
            <dd className="font-medium truncate">{officeNumber}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <dt className="text-muted-foreground w-24">Office Hours:</dt>
            <dd className="font-medium truncate">{officeHours}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <dt className="text-muted-foreground w-24">Specialization:</dt>
            <dd className="font-medium truncate">{specialization}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
} 