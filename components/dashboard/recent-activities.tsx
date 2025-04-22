"use client"

import Link from "next/link"
import { 
  HistoryIcon, 
  GitMergeIcon, 
  GitCommitIcon, 
  MessageSquareIcon,
  GitPullRequestIcon,
  FileTextIcon
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type ActivityType = 
  | 'commit' 
  | 'merge_request' 
  | 'feedback' 
  | 'task_update' 
  | 'evaluation' 
  | 'repository'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  timestamp: Date
  link?: string
  entityId?: string
}

interface RecentActivitiesProps {
  activities: Activity[]
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    }
    
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date)
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'commit':
        return <GitCommitIcon className="h-4 w-4" />
      case 'merge_request':
        return <GitMergeIcon className="h-4 w-4" />
      case 'feedback':
        return <MessageSquareIcon className="h-4 w-4" />
      case 'task_update':
        return <FileTextIcon className="h-4 w-4" />
      case 'evaluation':
        return <FileTextIcon className="h-4 w-4" />
      case 'repository':
        return <GitPullRequestIcon className="h-4 w-4" />
      default:
        return <HistoryIcon className="h-4 w-4" />
    }
  }

  if (activities.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-center">
            <HistoryIcon className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No recent activity to display.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center pb-3">
        <CardTitle className="flex items-center justify-center">
          <HistoryIcon className="mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex p-3 rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div className="flex-shrink-0 mr-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-semibold truncate pr-2">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-medium ml-2">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                    {activity.description}
                  </p>
                )}
                {activity.link && (
                  <Link 
                    href={activity.link} 
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center"
                  >
                    View details
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3 ml-1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 