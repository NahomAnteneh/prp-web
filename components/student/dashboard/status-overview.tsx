"use client"

import Link from "next/link"
import { BarChart3Icon, ClockIcon, CheckCircle2Icon, AlertCircleIcon, ArrowRightIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface ProjectSummary {
  totalProjects: number
  activeProjects: number
  completedProjects: number
}

export interface TaskSummary {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  blockedTasks: number
  upcomingDeadlines: Array<{
    id: string
    title: string
    deadline: Date
    daysRemaining: number
  }>
}

interface StatusOverviewProps {
  projectSummary: ProjectSummary
  taskSummary: TaskSummary
}

export default function StatusOverview({ projectSummary, taskSummary }: StatusOverviewProps) {
  // Set default values for projectSummary if undefined or missing properties
  const safeProjectSummary = {
    totalProjects: projectSummary?.totalProjects || 0,
    activeProjects: projectSummary?.activeProjects || 0,
    completedProjects: projectSummary?.completedProjects || 0,
  }

  // Set default values for taskSummary if undefined or missing properties
  const safeTaskSummary = {
    totalTasks: taskSummary?.totalTasks || 0,
    completedTasks: taskSummary?.completedTasks || 0,
    inProgressTasks: taskSummary?.inProgressTasks || 0,
    todoTasks: taskSummary?.todoTasks || 0,
    blockedTasks: taskSummary?.blockedTasks || 0,
    upcomingDeadlines: taskSummary?.upcomingDeadlines || [],
  }

  const formatDateRelative = (date: Date) => {
    const now = new Date()
    const diff = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0) return "Today"
    if (diff === 1) return "Tomorrow"
    if (diff > 1 && diff < 7) return `In ${diff} days`

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getTaskCompletionPercentage = () => {
    if (safeTaskSummary.totalTasks === 0) return 0
    return Math.round((safeTaskSummary.completedTasks / safeTaskSummary.totalTasks) * 100)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Project Status Card */}
      <Card className="flex flex-col">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center">
            <BarChart3Icon className="mr-2 h-5 w-5" />
            Project Status
          </CardTitle>
          <CardDescription>Overview of your current projects</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="grid grid-cols-3 gap-3 text-center mb-6 flex-1">
            <div className="bg-card p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-2xl font-bold mb-1">{safeProjectSummary.totalProjects}</p>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
            <div className="bg-card p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-2xl font-bold mb-1">{safeProjectSummary.activeProjects}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="bg-card p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-2xl font-bold mb-1">{safeProjectSummary.completedProjects}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          <div className="mt-auto">
            <Link href="/projects">
              <Button
                variant="outline"
                size="sm"
                className="w-full group hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95"
              >
                View All Projects
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Task Status Card */}
      <Card className="flex flex-col">
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center">
            <CheckCircle2Icon className="mr-2 h-5 w-5" />
            Task Progress
          </CardTitle>
          <CardDescription>{getTaskCompletionPercentage()}% of tasks completed</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>{safeTaskSummary.completedTasks} completed</span>
              <span>{safeTaskSummary.totalTasks} total</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${getTaskCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center mb-6 flex-1">
            <div className="bg-card p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg font-bold mb-1">{safeTaskSummary.todoTasks}</p>
              <p className="text-xs text-muted-foreground">To Do</p>
            </div>
            <div className="bg-card p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg font-bold mb-1">{safeTaskSummary.inProgressTasks}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="bg-card p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg font-bold mb-1">{safeTaskSummary.completedTasks}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
            <div className="bg-card p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg font-bold mb-1">{safeTaskSummary.blockedTasks}</p>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </div>
          </div>

          <div className="mt-auto">
            <Link href="/tasks">
              <Button
                variant="outline"
                size="sm"
                className="w-full group hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Manage Tasks
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines Card */}
      {safeTaskSummary.upcomingDeadlines.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center">
              <ClockIcon className="mr-2 h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Tasks with approaching deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeTaskSummary.upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between items-center p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center flex-1">
                    {task.daysRemaining <= 1 ? (
                      <AlertCircleIcon className="mr-3 h-5 w-5 text-destructive flex-shrink-0" />
                    ) : task.daysRemaining <= 3 ? (
                      <AlertCircleIcon className="mr-3 h-5 w-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ClockIcon className="mr-3 h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm line-clamp-1">{task.title}</span>
                  </div>
                  <div className="flex items-center ml-4">
                    <span
                      className={`text-sm whitespace-nowrap ${
                        task.daysRemaining <= 1
                          ? "text-destructive font-medium"
                          : task.daysRemaining <= 3
                            ? "text-orange-500 font-medium"
                            : "text-muted-foreground"
                      }`}
                    >
                      Due {formatDateRelative(task.deadline)}
                    </span>
                    <Link href={`/tasks/${task.id}`} className="ml-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
