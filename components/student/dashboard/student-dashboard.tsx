"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../navbar";
import Announcements from "./announcements";
import StatusOverview, { ProjectSummary, TaskSummary } from "./status-overview";
import RecentActivities, { Activity } from "./recent-activities";
import Footer from "../footer";

// Define interface for API data objects from /api/dashboard/student
interface StudentDashboardApiResponse {
  user: {
    id: string; 
    name: string; 
    unreadNotifications: number;
    hasGroup: boolean;
    groupName: string | null;
  };
  announcements: {
    id: string;
    title: string;
    content: string;
    priority: number;
    createdAt: string; // API sends string, will be converted to Date
  }[];
  projectSummary: ProjectSummary;
  taskSummary: TaskSummary & {
    upcomingDeadlines: {
      id: string;
      title: string;
      deadline: string; // API sends string, will be converted to Date
      daysRemaining: number;
    }[];
  };
  // recentActivities is removed here, will be fetched from a different endpoint
}

// Interface for individual activity item from /api/users/[userId]/activities
interface UserActivityApiResponseItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string; // Formatted string e.g., "X seconds ago"
  timestamp_raw: string; // ISO Date string
  link?: string;
  // other fields like project, projectId etc. can be added if RecentActivities component uses them
}

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    user: {
      userId: string;
      unreadNotifications: number;
      hasGroup: boolean;
      groupName: string | null;
    };
    announcements: (Omit<StudentDashboardApiResponse['announcements'][0], 'createdAt'> & { createdAt: Date })[];
    projectSummary: ProjectSummary;
    taskSummary: Omit<TaskSummary, 'upcomingDeadlines'> & {
      upcomingDeadlines: (Omit<StudentDashboardApiResponse['taskSummary']['upcomingDeadlines'][0], 'deadline'> & { deadline: Date })[];
    };
    recentActivities: Activity[]; // This will be populated from the new activities API
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Fetch main dashboard data
        const dashboardResponse = await fetch("/api/dashboard/student");
        if (!dashboardResponse.ok) {
          const errorData = await dashboardResponse.json().catch(() => ({ message: "Failed to fetch main dashboard data"}));
          throw new Error(errorData.message || `HTTP error! status: ${dashboardResponse.status}`);
        }
        const mainApiData: StudentDashboardApiResponse = await dashboardResponse.json();

        // Step 2: Fetch recent activities using userId from main dashboard data
        let recentActivitiesData: Activity[] = [];
        if (mainApiData.user?.id) {
          const activitiesResponse = await fetch(`/api/users/${mainApiData.user.id}/activities`);
          if (activitiesResponse.ok) {
            const userActivitiesApiResult: UserActivityApiResponseItem[] = await activitiesResponse.json();
            recentActivitiesData = Array.isArray(userActivitiesApiResult)
              ? userActivitiesApiResult.map(activity => {
                  // Map API activity type to the frontend ActivityType
                  let mappedType: Activity['type'];
                  switch (activity.type.toLowerCase()) {
                    case 'commit':
                      mappedType = 'commit';
                      break;
                    case 'pull_request': // API uses pull_request
                      mappedType = 'merge_request'; // Frontend uses merge_request
                      break;
                    case 'comment': // API uses comment for feedback
                      mappedType = 'feedback';
                      break;
                    case 'task': // API uses task
                      mappedType = 'task_update'; // Frontend uses task_update
                      break;
                    // Add other cases as needed, e.g., for 'evaluation', 'repository' if API provides them
                    default:
                      // Handle unknown types: either assign a default, filter out, or try to cast
                      // For now, let's try a direct cast, which might still cause issues if not in ActivityType
                      // A safer approach would be to filter or assign a specific default like 'repository'
                      mappedType = activity.type as Activity['type']; 
                  }

                  return {
                    id: activity.id,
                    title: activity.title,
                    description: activity.description,
                    timestamp: new Date(activity.timestamp_raw), 
                    type: mappedType,
                    link: activity.link,
                  };
                })
              // Optional: Filter out activities where mappedType couldn't be confidently assigned to an ActivityType
              // .filter(activity => Object.values(ActivityType).includes(activity.type as ActivityType)) 
              : [];
          } else {
            console.warn(`Failed to fetch recent activities: ${activitiesResponse.status}`);
            // Continue without activities if this fetch fails, or handle error more strictly
          }
        }

        // Step 3: Transform and combine data
        const transformedData = {
          user: {
            userId: mainApiData.user.id,
            unreadNotifications: mainApiData.user.unreadNotifications || 0,
            hasGroup: mainApiData.user.hasGroup || false,
            groupName: mainApiData.user.groupName || null,
          },
          announcements: Array.isArray(mainApiData.announcements)
            ? mainApiData.announcements.map((announcement) => ({
                ...announcement,
                createdAt: new Date(announcement.createdAt),
              }))
            : [],
          projectSummary: mainApiData.projectSummary || { totalProjects: 0, activeProjects: 0, completedProjects: 0 },
          taskSummary: {
            ...(mainApiData.taskSummary || { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, todoTasks: 0, blockedTasks: 0 }),
            upcomingDeadlines: Array.isArray(mainApiData.taskSummary?.upcomingDeadlines)
              ? mainApiData.taskSummary.upcomingDeadlines.map((task) => ({
                  ...task,
                  deadline: new Date(task.deadline),
                }))
              : [],
          },
          recentActivities: recentActivitiesData, // Use data from the new activities API
        };

        console.log("Fetched and combined data:", transformedData);
        setDashboardData(transformedData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

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
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
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
                          Go to Group Page →
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Announcements
              announcements={
                dashboardData.announcements.map((announcement) => ({
                  ...announcement,
                  createdAt: new Date(announcement.createdAt),
                })) || []
              }
            />

            <StatusOverview projectSummary={dashboardData.projectSummary} taskSummary={dashboardData.taskSummary} />

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
  );
}