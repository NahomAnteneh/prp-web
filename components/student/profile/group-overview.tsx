"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ExternalLink, Clock } from "lucide-react"
import Link from "next/link"

interface GroupOverviewProps {
  userId: string
}

interface GroupMember {
  id: string
  name: string
  role: string
  imageUrl?: string
}

interface GroupData {
  id: string
  name: string
  description: string
  progress: number
  status: string
  members: GroupMember[]
  projectTitle: string
  advisor: string
}

export default function GroupOverview({ userId }: GroupOverviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [groupData, setGroupData] = useState<GroupData | null>(null)

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`/api/groups/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch group data");
        }
        const data = await response.json();
        setGroupData(data);
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Group Overview
          </CardTitle>
          <CardDescription>Loading group information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!groupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Group Overview
          </CardTitle>
          <CardDescription>No group information available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="mb-4 text-muted-foreground">You are not currently part of any project group.</p>
            <Button>Create or Join a Group</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> {groupData.name}
            </CardTitle>
            <CardDescription>{groupData.description}</CardDescription>
          </div>
          <Badge variant={
            groupData.status === "Completed" ? "outline" :
            groupData.status === "In Progress" ? "default" :
            "secondary"
          }>
            {groupData.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Project Progress</h4>
            <span className="text-sm font-medium">{groupData.progress}%</span>
          </div>
          <Progress value={groupData.progress} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Project Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Project: </span>
              <span className="font-medium">{groupData.projectTitle}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Advisor: </span>
              <span className="font-medium">{groupData.advisor}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total Members: </span>
              <span className="font-medium">{groupData.members.length}</span>
            </div>
            <div className="text-sm flex items-center">
              <span className="text-muted-foreground mr-1">Last Activity: </span>
              <span className="font-medium flex items-center">
                <Clock className="h-3 w-3 mr-1" /> 2 days ago
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Group Members</h4>
          <div className="flex flex-wrap gap-2">
            {groupData.members.map(member => (
              <div key={member.id} className="flex items-center gap-2 border rounded-full pl-1 pr-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.imageUrl} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
                {member.role === "Leader" && (
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">Lead</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/group/${groupData.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" /> View Group Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}