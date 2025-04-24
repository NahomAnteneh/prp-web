"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Mail, MessageSquare } from "lucide-react"

interface ProfileAvatarProps {
  name: string
  department: string
  imageUrl?: string
}

export default function ProfileAvatar({ name, department, imageUrl }: ProfileAvatarProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-primary/20">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${name}'s profile picture`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-5xl font-bold text-primary/40">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-1">{name}</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">{department}</p>
        
        <div className="flex flex-wrap gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <Mail className="h-4 w-4" /> Message
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <MessageSquare className="h-4 w-4" /> Chat
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
            <Edit className="h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 