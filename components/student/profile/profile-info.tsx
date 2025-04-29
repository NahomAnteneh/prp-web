"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, School, Hash } from "lucide-react"

interface ProfileInfoProps {
  user: {
    id: string
    username: string
    name: string
    role: string
    profileInfo: {
      idNumber: string
      email: string
      department: string
      batchYear: string
    }
  } | null
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
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
  
  const { name, username, role, profileInfo } = user
  const { idNumber, email, department, batchYear} = profileInfo
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-2xl">{name}</CardTitle>
            <CardDescription>@{username}</CardDescription>
          </div>
          <Badge className="bg-blue-500 hover:bg-blue-600">{role}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* <div>
          <h3 className="text-lg font-semibold mb-2">Bio</h3>
          <p className="text-muted-foreground">
            {bio || "No bio available."}
          </p>
        </div> */}
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Student Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">ID Number:</dt>
              <dd className="font-medium">{idNumber}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Email:</dt>
              <dd className="font-medium">{email}</dd>
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
        </div>
        
        {/* <div>
          <h3 className="text-lg font-semibold mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Web Development</Badge>
            <Badge variant="secondary">React.js</Badge>
            <Badge variant="secondary">Next.js</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Python</Badge>
            <Badge variant="secondary">UI/UX</Badge>
          </div>
        </div> */}
      </CardContent>
    </Card>
  )
} 