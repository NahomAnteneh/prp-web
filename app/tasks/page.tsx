"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  AlertCircleIcon,
  PlayIcon,
  PauseIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "high" | "medium" | "low"
  dueDate: Date
  assignee: string
  project: string
  tags: string[]
}

// Sample data
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Design homepage mockup",
    description: "Create wireframes and high-fidelity mockups for the new homepage design",
    status: "in-progress",
    priority: "high",
    dueDate: new Date("2024-01-30"),
    assignee: "Sarah Chen",
    project: "Website Redesign",
    tags: ["design", "ui/ux"],
  },
  {
    id: "2",
    title: "Implement user authentication",
    description: "Set up JWT-based authentication system with login and registration",
    status: "todo",
    priority: "high",
    dueDate: new Date("2024-02-05"),
    assignee: "Mike Johnson",
    project: "Mobile App Development",
    tags: ["backend", "security"],
  },
  {
    id: "3",
    title: "Database schema migration",
    description: "Migrate user tables to new schema with additional fields",
    status: "completed",
    priority: "medium",
    dueDate: new Date("2024-01-20"),
    assignee: "Alex Rodriguez",
    project: "Database Migration",
    tags: ["database", "migration"],
  },
  {
    id: "4",
    title: "Write API documentation",
    description: "Document all REST API endpoints with examples and response formats",
    status: "todo",
    priority: "medium",
    dueDate: new Date("2024-02-10"),
    assignee: "Emily Davis",
    project: "Mobile App Development",
    tags: ["documentation", "api"],
  },
  {
    id: "5",
    title: "Security vulnerability assessment",
    description: "Conduct thorough security audit of the application infrastructure",
    status: "blocked",
    priority: "high",
    dueDate: new Date("2024-02-15"),
    assignee: "David Wilson",
    project: "Security Audit",
    tags: ["security", "audit"],
  },
  {
    id: "6",
    title: "Social media content creation",
    description: "Create engaging content for Q1 marketing campaign across platforms",
    status: "in-progress",
    priority: "low",
    dueDate: new Date("2024-03-01"),
    assignee: "Lisa Thompson",
    project: "Marketing Campaign",
    tags: ["marketing", "content"],
  },
]

export default function TasksPage() {
  const [tasks] = useState<Task[]>(sampleTasks)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    const matchesTab = activeTab === "all" || task.status === activeTab
    return matchesSearch && matchesStatus && matchesPriority && matchesTab
  })

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return <ClockIcon className="h-4 w-4" />
      case "in-progress":
        return <PlayIcon className="h-4 w-4" />
      case "completed":
        return <CheckIcon className="h-4 w-4" />
      case "blocked":
        return <AlertCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getTaskCounts = () => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
    }
  }

  const taskCounts = getTaskCounts()

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with slide-in animation */}
      <div
        className={`flex items-center justify-between mb-8 transition-all duration-700 ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
        }`}
      >
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="group hover:bg-primary/10 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">Organize and track your tasks efficiently</p>
          </div>
        </div>
        <Button className="group hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-lg">
          <PlusIcon className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          New Task
        </Button>
      </div>

      {/* Filters and Search with fade-in animation */}
      <div
        className={`flex flex-col lg:flex-row gap-4 mb-6 transition-all duration-700 delay-200 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, assignees, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all duration-300 focus:scale-105"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 transition-all duration-300 hover:scale-105">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48 transition-all duration-300 hover:scale-105">
              <FlagIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs with animation */}
      <div
        className={`mb-6 transition-all duration-700 delay-300 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="all"
              className="transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
            >
              All ({taskCounts.all})
            </TabsTrigger>
            <TabsTrigger
              value="todo"
              className="transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
            >
              To Do ({taskCounts.todo})
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
            >
              In Progress ({taskCounts["in-progress"]})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
            >
              Completed ({taskCounts.completed})
            </TabsTrigger>
            <TabsTrigger
              value="blocked"
              className="transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
            >
              Blocked ({taskCounts.blocked})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Tasks List with staggered animations */}
            <div className="space-y-4">
              {filteredTasks.map((task, index) => (
                <Card
                  key={task.id}
                  className={`hover:shadow-md transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 ${
                    isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${400 + index * 100}ms`,
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 mt-1 group">
                            <div className="group-hover:scale-110 transition-transform duration-300">
                              {getStatusIcon(task.status)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors duration-300 cursor-pointer">
                              {task.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-3">{task.description}</p>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge
                                className={`${getStatusColor(task.status)} transition-all duration-300 hover:scale-105`}
                              >
                                {task.status.replace("-", " ")}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`${getPriorityColor(task.priority)} transition-all duration-300 hover:scale-105`}
                              >
                                {task.priority} priority
                              </Badge>
                              {task.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="transition-all duration-300 hover:scale-105 hover:bg-primary/20"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1 group cursor-pointer">
                                <UserIcon className="h-4 w-4 group-hover:text-primary transition-colors duration-300" />
                                <span className="group-hover:text-primary transition-colors duration-300">
                                  {task.assignee}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 group cursor-pointer">
                                <CalendarIcon className="h-4 w-4 group-hover:text-primary transition-colors duration-300" />
                                <span className="group-hover:text-primary transition-colors duration-300">
                                  Due {formatDate(task.dueDate)}
                                </span>
                              </div>
                              <div className="text-xs hover:text-primary transition-colors duration-300 cursor-pointer">
                                Project: {task.project}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:scale-110 transition-transform duration-300"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="animate-in slide-in-from-top-2 duration-300">
                          <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {task.status === "in-progress" && (
                            <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                              <PauseIcon className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {task.status === "todo" && (
                            <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                              <PlayIcon className="h-4 w-4 mr-2" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {task.status !== "completed" && (
                            <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive hover:bg-destructive/10 transition-colors duration-200">
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty state with animation */}
            {filteredTasks.length === 0 && (
              <div
                className={`text-center py-12 transition-all duration-700 delay-500 ${
                  isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
              >
                <div className="animate-bounce">
                  <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                </div>
                <p className="text-muted-foreground">No tasks found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
