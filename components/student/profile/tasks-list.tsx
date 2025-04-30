"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ListChecks, 
  Play, 
  Check, 
  Ban,
  Calendar, 
  User, 
  Folder 
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { format } from 'date-fns'

interface TasksListProps {
  userId: string
  isOwner?: boolean
}

interface Task {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  priority: number
  deadline: string | null
  deadlineFormatted: string | null
  deadlineRelative: string | null
  isOverdue: boolean
  lastUpdated: string
  technologies: string[]
  creator: {
    id: string
    name: string
    username: string
  }
  assignee: {
    id: string
    name: string
    username: string
  } | null
  project: {
    id: string
    title: string
    group: {
      id: string
      name: string
    } | null
  } | null
  isCreator: boolean
  isAssignee: boolean
}

interface TaskResponse {
  tasks: Task[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  counts: {
    total: number
    todo: number
    inProgress: number
    done: number
    blocked: number
  }
}

export default function TasksList({ userId, isOwner = false }: TasksListProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [taskData, setTaskData] = useState<TaskResponse | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        
        const origin = process.env.NEXT_PUBLIC_API_URL || "";
        
        // All tasks will be fetched regardless of active tab
        // We'll filter on the client side in the TasksTabContent component
        const response = await fetch(
          `${origin}/api/users/${encodeURIComponent(userId)}/tasks?limit=20&sortBy=updatedAt&sortOrder=desc`
        )
        
        if (!response.ok) {
          throw new Error("Failed to fetch tasks")
        }
        
        const data = await response.json()
        setTaskData(data)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setError("Failed to load tasks. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [userId])

  // Helper to get status badge styling
  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'TODO':
        return {
          variant: "outline" as const,
          className: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          icon: <ListChecks className="h-3.5 w-3.5 mr-1" />
        }
      case 'IN_PROGRESS':
        return {
          variant: "default" as const,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
          icon: <Play className="h-3.5 w-3.5 mr-1" />
        }
      case 'DONE':
        return {
          variant: "outline" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
          icon: <Check className="h-3.5 w-3.5 mr-1" />
        }
      case 'BLOCKED':
        return {
          variant: "outline" as const,
          className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
          icon: <Ban className="h-3.5 w-3.5 mr-1" />
        }
    }
  }

  // Helper to get priority badge content
  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) {
      return {
        text: "High",
        className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      }
    } else if (priority === 2) {
      return {
        text: "Medium",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      }
    } else {
      return {
        text: "Low",
        className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      }
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Tasks
          </CardTitle>
          <CardDescription>Error loading tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderLoadingSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" /> Tasks
        </CardTitle>
        <CardDescription>Loading tasks...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted h-10 mb-4 animate-pulse" />
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="h-6 bg-muted rounded w-1/3 mb-3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
          </div>
          <div className="rounded-lg border p-4">
            <div className="h-6 bg-muted rounded w-1/3 mb-3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return renderLoadingSkeleton()
  }

  if (!taskData || taskData.tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Tasks
          </CardTitle>
          <CardDescription>Your assigned and created tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Tasks
            </CardTitle>
            <CardDescription>Your assigned and created tasks</CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/tasks/new">New Task</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Task statistics */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Todo</span>
              <ListChecks className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold mt-1">{taskData.counts.todo}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">In Progress</span>
              <Play className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-semibold mt-1">{taskData.counts.inProgress}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Done</span>
              <Check className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-semibold mt-1">{taskData.counts.done}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Blocked</span>
              <Ban className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-semibold mt-1">{taskData.counts.blocked}</p>
          </div>
        </div>

        {/* Tasks list with tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">
              All <Badge variant="outline" className="ml-2">{taskData.counts.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="todo">
              Todo <Badge variant="outline" className="ml-2">{taskData.counts.todo}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress <Badge variant="outline" className="ml-2">{taskData.counts.inProgress}</Badge>
            </TabsTrigger>
            <TabsTrigger value="done">
              Done <Badge variant="outline" className="ml-2">{taskData.counts.done}</Badge>
            </TabsTrigger>
            <TabsTrigger value="blocked">
              Blocked <Badge variant="outline" className="ml-2">{taskData.counts.blocked}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <TasksTabContent tasks={taskData.tasks} />
          </TabsContent>
          <TabsContent value="todo" className="mt-0">
            <TasksTabContent tasks={taskData.tasks} />
          </TabsContent>
          <TabsContent value="in-progress" className="mt-0">
            <TasksTabContent tasks={taskData.tasks} />
          </TabsContent>
          <TabsContent value="done" className="mt-0">
            <TasksTabContent tasks={taskData.tasks} />
          </TabsContent>
          <TabsContent value="blocked" className="mt-0">
            <TasksTabContent tasks={taskData.tasks} />
          </TabsContent>
        </Tabs>

        {taskData.pagination.hasMore && (
          <div className="text-center mt-4">
            <Button variant="outline">Load More</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Inner component to render tasks list in each tab
  function TasksTabContent({ tasks }: { tasks: Task[] }) {
    // Filter tasks based on the active tab
    const filteredTasks = activeTab === "all" 
      ? tasks 
      : tasks.filter(task => {
          switch (activeTab) {
            case "todo":
              return task.status === "TODO";
            case "in-progress":
              return task.status === "IN_PROGRESS";
            case "done":
              return task.status === "DONE";
            case "blocked":
              return task.status === "BLOCKED";
            default:
              return true;
          }
        });

    if (filteredTasks.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No tasks found</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {filteredTasks.map(task => {
          const statusBadge = getStatusBadge(task.status)
          const priorityBadge = getPriorityBadge(task.priority)
          
          return (
            <div key={task.id} className="rounded-lg border hover:border-primary transition-colors overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <h3 className="text-base font-medium">
                        <Link href={task.project ? `/projects/${task.project.id}/tasks/${task.id}` : `/tasks/${task.id}`} className="hover:text-primary transition-colors">
                          {task.title}
                        </Link>
                      </h3>
                      <Badge className={statusBadge.className}>
                        {statusBadge.icon}
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={priorityBadge.className}>
                        {priorityBadge.text} Priority
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {task.technologies && task.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    {task.technologies.map(tech => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                  {task.assignee && (
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span>Assigned to: {task.assignee.name}</span>
                    </div>
                  )}
                  
                  {task.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className={task.isOverdue ? 'text-red-500 font-semibold' : ''}>
                        {task.isOverdue ? 'Overdue: ' : 'Due: '}
                        {task.deadlineRelative}
                      </span>
                    </div>
                  )}
                  
                  {task.project && (
                    <div className="flex items-center gap-1">
                      <Folder className="h-3.5 w-3.5" />
                      <span>Project: {task.project.title}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {task.lastUpdated}
                  </span>
                  
                  <Button asChild size="sm" variant="outline">
                    <Link href={task.project ? `/projects/${task.project.id}/tasks/${task.id}` : `/tasks/${task.id}`}>
                      View Task
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
} 