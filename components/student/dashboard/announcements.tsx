"use client"

import { useState } from "react"
import Link from "next/link"
import { MegaphoneIcon, ChevronRight, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
  priority: number
}

interface AnnouncementsProps {
  announcements: Announcement[]
}

export default function Announcements({ announcements }: AnnouncementsProps) {
  const [expandedAnnouncementId, setExpandedAnnouncementId] = useState<string | null>(null)

  const toggleAnnouncement = (id: string) => {
    if (expandedAnnouncementId === id) {
      setExpandedAnnouncementId(null)
    } else {
      setExpandedAnnouncementId(id)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  // Sort announcements by priority (highest first) and then by date (newest first)
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MegaphoneIcon className="mr-2 h-5 w-5" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No announcements at this time.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MegaphoneIcon className="mr-2 h-5 w-5" />
          Announcements
        </CardTitle>
        <CardDescription>Important updates from administrators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedAnnouncements.map((announcement) => (
          <div 
            key={announcement.id} 
            className="border rounded-lg overflow-hidden"
          >
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => toggleAnnouncement(announcement.id)}
            >
              <div className="flex items-center space-x-2">
                <div>
                  <h3 className="font-medium">{announcement.title}</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(announcement.createdAt)}
                    </span>
                    {announcement.priority > 0 && (
                      <Badge 
                        variant={announcement.priority > 1 ? "destructive" : "secondary"} 
                        className="ml-2"
                      >
                        {announcement.priority > 1 ? 'Important' : 'Notice'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {expandedAnnouncementId === announcement.id ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </div>
            {expandedAnnouncementId === announcement.id && (
              <div className="p-3 pt-0 border-t">
                <p className="text-sm whitespace-pre-line">{announcement.content}</p>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex justify-center pt-2">
          <Link href="/announcements">
            <Button variant="outline" size="sm" className="w-full">
              View All Announcements
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 