"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  UsersIcon,
  BarChart3Icon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Project {
  id: string
  name: string
  description: string
  status: "active" | "completed" | "on-hold" | "planning"
  progress: number
  dueDate: Date
  teamMembers: number
  tasksCompleted: number
  totalTasks: number
  priority: "high" | "medium" | "low"
}

// Sample data
const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of the company website with modern design and improved UX",
    status: "active",
    progress: 75,
    dueDate: new Date("2024-02-15"),
    teamMembers: 5,
    tasksCompleted: 18,
    totalTasks: 24,
    priority: "high",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Native mobile application for iOS and Android platforms",
    status: "active",
    progress: 45,
    dueDate: new Date("2024-03-30"),
    teamMembers: 8,
    tasksCompleted: 12,
    totalTasks: 28,
    priority: "high",
  },
  {
    id: "3",
    name: "Database Migration",
    description: "Migrate legacy database to new cloud infrastructure",
    status: "completed",
    progress: 100,
    dueDate: new Date("2024-01-20"),
    teamMembers: 3,
    tasksCompleted: 15,
    totalTasks: 15,
    priority: "medium",
  },
  {
    id: "4",
    name: "Marketing Campaign",
    description: "Q1 digital marketing campaign across multiple channels",
    status: "planning",
    progress: 20,
    dueDate: new Date("2024-04-01"),
    teamMembers: 4,
    tasksCompleted: 3,
    totalTasks: 16,
    priority: "medium",
  },
  {
    id: "5",
    name: "Security Audit",
    description: "Comprehensive security review and vulnerability assessment",
    status: "on-hold",
    progress: 30,
    dueDate: new Date("2024-05-15"),
    teamMembers: 2,
    tasksCompleted: 6,
    totalTasks: 20,
    priority: "low",
  },
]

export default function ProjectsPage() {
  const [projects] = useState<Project[]>(sampleProjects)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "planning":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: Project["priority"]) => {
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
      year: "numeric",
    }).format(date)
  }

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
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage and track all your projects</p>
          </div>
        </div>
        <Button className="group hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-lg">
          <PlusIcon className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          New Project
        </Button>
      </div>

      {/* Filters and Search with fade-in animation */}
      <div
        className={`flex flex-col sm:flex-row gap-4 mb-6 transition-all duration-700 delay-200 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all duration-300 focus:scale-105"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 transition-all duration-300 hover:scale-105">
            <FilterIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid with staggered animations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project, index) => (
          <Card
            key={project.id}
            className={`hover:shadow-lg transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
            style={{
              transitionDelay: `${400 + index * 100}ms`,
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors duration-300">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
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
                    <DropdownMenuItem className="text-destructive hover:bg-destructive/10 transition-colors duration-200">
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-2 mt-3">
                <Badge className={`${getStatusColor(project.status)} transition-all duration-300 hover:scale-105`}>
                  {project.status.replace("-", " ")}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(project.priority)} transition-all duration-300 hover:scale-105`}
                >
                  {project.priority} priority
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress with animated bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: isLoaded ? `${project.progress}%` : "0%",
                      transitionDelay: `${600 + index * 100}ms`,
                    }}
                  />
                </div>
              </div>

              {/* Stats with hover animations */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1 group cursor-pointer">
                  <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BarChart3Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                    {project.tasksCompleted}/{project.totalTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="space-y-1 group cursor-pointer">
                  <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UsersIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                    {project.teamMembers}
                  </p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="space-y-1 group cursor-pointer">
                  <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                    {formatDate(project.dueDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                </div>
              </div>

              {/* Action Button with enhanced animation */}
              <Button
                variant="outline"
                className="w-full group hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
                asChild
              >
                <Link href={`/projects/${project.id}`}>
                  View Details
                  <ArrowLeftIcon className="ml-2 h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state with animation */}
      {filteredProjects.length === 0 && (
        <div
          className={`text-center py-12 transition-all duration-700 delay-500 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="animate-bounce">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          </div>
          <p className="text-muted-foreground">No projects found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
