"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../navbar";
import Announcements from "./announcements";
import StatusOverview, { ProjectSummary, TaskSummary } from "./status-overview";
import RecentActivities, { Activity } from "./recent-activities";
import Footer from "../footer";

// Define interface for API data objects
interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
}

interface TaskDeadlineData {
  id: string;
  title: string;
  deadline: string;
  daysRemaining: number;
}

interface ActivityData extends Omit<Activity, "timestamp"> {
  timestamp: string;
}

interface DashboardData {
  user: {
    userId: string;
    unreadNotifications: number;
    hasGroup: boolean;
    groupName: string | null;
  };
  announcements: AnnouncementData[];
  projectSummary: ProjectSummary;
  taskSummary: TaskSummary & {
    upcomingDeadlines: TaskDeadlineData[];
  };
  recentActivities: ActivityData[];
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
    announcements: AnnouncementData[];
    projectSummary: ProjectSummary;
    taskSummary: TaskSummary;
    recentActivities: Activity[];
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Mock data for testing
        const mockData: DashboardData = {
          user: {
            userId: "student123",
            unreadNotifications: 5,
            hasGroup: true,
            groupName: "Group A",
          },
          announcements: [
            {
              id: "ann1",
              title: "Welcome to the Dashboard",
              content: "New semester updates.",
              active: true,
              priority: 1,
              createdAt: "2025-05-20T10:00:00Z",
              updatedAt: "2025-05-20T10:00:00Z",
              creatorId: "admin123",
            },
          ],
          projectSummary: {
            totalProjects: 10,
            activeProjects: 5,
            completedProjects: 3,
          },
          taskSummary: {
            totalTasks: 20,
            completedTasks: 8,
            inProgressTasks: 7,
            todoTasks: 4,
            blockedTasks: 1,
            upcomingDeadlines: [
              {
                id: "task1",
                title: "Complete project proposal",
                deadline: "2025-05-26T23:59:59Z",
                daysRemaining: 2,
              },
              {
                id: "task2",
                title: "Review design mockups",
                deadline: "2025-05-28T23:59:59Z",
                daysRemaining: 4,
              },
            ],
          },
          recentActivities: [
            {
              id: "act1",
              title: "Submitted assignment",
              description: "Submitted project proposal for review.",
              timestamp: "2025-05-24T08:00:00Z",
              type: "submission",
            },
          ],
        };

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Transform the data with null checks
        const transformedData = {
          user: {
            userId: mockData.user.userId,
            unreadNotifications: mockData.user.unreadNotifications || 0,
            hasGroup: mockData.user.hasGroup || false,
            groupName: mockData.user.groupName || null,
          },
          announcements: Array.isArray(mockData.announcements)
            ? mockData.announcements.map((announcement) => ({
                ...announcement,
                createdAt: new Date(announcement.createdAt),
              }))
            : [],
          projectSummary: mockData.projectSummary,
          taskSummary: {
            ...mockData.taskSummary,
            upcomingDeadlines: Array.isArray(mockData.taskSummary.upcomingDeadlines)
              ? mockData.taskSummary.upcomingDeadlines.map((task) => ({
                  ...task,
                  deadline: new Date(task.deadline),
                }))
              : [],
          },
          recentActivities: Array.isArray(mockData.recentActivities)
            ? mockData.recentActivities.map((activity) => ({
                ...activity,
                timestamp: new Date(activity.timestamp),
              }))
            : [],
        };

        console.log("Transformed data:", transformedData);
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
                  updatedAt: new Date(announcement.updatedAt),
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