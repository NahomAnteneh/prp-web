"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, GitCommit, GitPullRequest, MessageSquare, CheckCircle, Circle } from "lucide-react"

interface RecentActivitiesProps {
  userId: string
}

interface Activity {
  id: string
  type: "commit" | "pull_request" | "comment" | "task" | "milestone"
  title: string
  description: string
  timestamp: string
  project?: string
  relatedTo?: string
}

export default function RecentActivities({ userId }: RecentActivitiesProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/activities/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch activities data");
        }
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recent Activities
          </CardTitle>
          <CardDescription>Loading activities...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded-lg animate-pulse" />
            <div className="h-20 bg-muted rounded-lg animate-pulse" />
            <div className="h-20 bg-muted rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Recent Activities
          </CardTitle>
          <CardDescription>No recent activities found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No activities to display at this time.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Function to render appropriate icon based on activity type
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4" />
      case "pull_request":
        return <GitPullRequest className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "task":
        return <CheckCircle className="h-4 w-4" />
      case "milestone":
        return <Circle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Function to render appropriate color based on activity type
  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "commit":
        return "bg-green-100 text-green-800"
      case "pull_request":
        return "bg-purple-100 text-purple-800"
      case "comment":
        return "bg-blue-100 text-blue-800"
      case "task":
        return "bg-amber-100 text-amber-800"
      case "milestone":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Recent Activities
            </CardTitle>
            <CardDescription>Your recent activities across projects</CardDescription>
          </div>
          <Button size="sm" variant="outline">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex gap-4 p-3 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className={`rounded-full p-2 ${getActivityColor(activity.type)} self-start`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.timestamp}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {activity.project && (
                    <Badge variant="outline" className="text-xs">
                      {activity.project}
                    </Badge>
                  )}
                  {activity.relatedTo && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.relatedTo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}