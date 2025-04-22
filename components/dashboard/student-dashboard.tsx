"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import Navbar from "./navbar"
import Announcements, { Announcement } from "./announcements"
import StatusOverview, { ProjectSummary, TaskSummary } from "./status-overview"
import RecentActivities, { Activity } from "./recent-activities"
import Footer from "./footer"

// Define interface for API data objects
interface AnnouncementData extends Omit<Announcement, 'createdAt'> {
  createdAt: string
}

interface TaskDeadlineData {
  id: string
  title: string
  deadline: string
  daysRemaining: number
}

interface ActivityData extends Omit<Activity, 'timestamp'> {
  timestamp: string
}

// Define the shape of the dashboard data
interface DashboardData {
  user: {
    id: string
    name: string
    unreadNotifications: number
    hasGroup: boolean
    groupName: string | null
  }
  announcements: AnnouncementData[]
  projectSummary: ProjectSummary
  taskSummary: TaskSummary & {
    upcomingDeadlines: TaskDeadlineData[]
  }
  recentActivities: ActivityData[]
}

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<{
    user: { 
      id: string
      name: string
      unreadNotifications: number
      hasGroup: boolean
      groupName: string | null
    };
    announcements: Announcement[];
    projectSummary: ProjectSummary;
    taskSummary: TaskSummary;
    recentActivities: Activity[];
  } | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/dashboard')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
        }
        
        const data = await response.json() as DashboardData
        console.log("Dashboard API response:", data) // Add logging to debug
        console.log("User data received:", data.user) // Log specific user data
        console.log("Username value:", data.user?.name) // Specifically log the username
        
        // Ensure data has all required properties
        if (!data || !data.user || !data.projectSummary || !data.taskSummary) {
          throw new Error("Invalid data format received from API")
        }
        
        // Transform the data with null checks
        const transformedData = {
          user: {
            id: data.user.id,
            name: data.user.name || "Student", // Provide a default name if none exists
            unreadNotifications: data.user.unreadNotifications || 0,
            hasGroup: data.user.hasGroup || false,
            groupName: data.user.groupName || null
          },
          announcements: Array.isArray(data.announcements) ? data.announcements.map(announcement => ({
            ...announcement,
            createdAt: new Date(announcement.createdAt)
          })) : [],
          projectSummary: data.projectSummary,
          taskSummary: {
            ...data.taskSummary,
            upcomingDeadlines: Array.isArray(data.taskSummary.upcomingDeadlines) 
              ? data.taskSummary.upcomingDeadlines.map(task => ({
                  ...task,
                  deadline: new Date(task.deadline)
                }))
              : []
          },
          recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities.map(activity => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          })) : []
        }
        
        console.log("Transformed data:", transformedData) // Add logging to debug
        console.log("Username after transformation:", transformedData.user.name) // Check username after transformation
        setDashboardData(transformedData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Debug username value that's being passed to Navbar
  console.log("Rendering with username:", dashboardData?.user?.name)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar 
        unreadNotifications={dashboardData?.user?.unreadNotifications || 0}
        userName={dashboardData?.user?.name || "Student"} // Provide a default name
      />
      
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:px-12">
        <h1 className="text-3xl font-bold text-center mb-8">Student Dashboard</h1>
        
        {isLoading ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <div className="h-[300px] w-full rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="grid gap-8 md:grid-cols-2 mb-8">
              <div className="h-[250px] w-full rounded-xl bg-muted animate-pulse" />
              <div className="h-[250px] w-full rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-[350px] w-full rounded-xl bg-muted animate-pulse" />
          </div>
        ) : error ? (
          <div className="max-w-5xl mx-auto p-8 text-center rounded-xl border">
            <p className="text-destructive text-lg font-medium mb-2">Error Loading Dashboard</p>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : dashboardData ? (
          <div className="max-w-5xl mx-auto space-y-8">
            {!dashboardData.user.hasGroup && (
              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Group Required</h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>You are not currently a member of any group. All students must be part of a group to participate in projects.</p>
                      <p className="mt-2">
                        <Link 
                          href="/group" 
                          className="font-medium underline text-yellow-700 hover:text-yellow-600 dark:text-yellow-200 dark:hover:text-yellow-100"
                        >
                          Go to Group Page &rarr;
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Announcements announcements={dashboardData.announcements || []} />
            
            <StatusOverview 
              projectSummary={dashboardData.projectSummary}
              taskSummary={dashboardData.taskSummary}
            />
            
            <RecentActivities activities={dashboardData.recentActivities || []} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-8 text-center rounded-xl border">
            <p className="text-muted-foreground text-lg">No dashboard data available. Please try again later.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
