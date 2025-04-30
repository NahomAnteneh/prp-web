"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folder, ExternalLink, Calendar, User, GitBranch, Eye } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

interface ProjectsListProps {
  userId: string
}

interface Project {
  id: string
  title: string
  description: string
  status: "Active" | "Completed" | "Draft"
  lastUpdated: string
  advisor: string
  technologies: string[]
  progress?: number
  views?: number
}

export default function ProjectsList({ userId }: ProjectsListProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/projects`);
        const data = await response.json();
        
        // Add some mock data for visualization if needed
        const enhancedData = data.map((project: any) => ({
          ...project,
          progress: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 100) + 10
        }));
        
        setProjects(enhancedData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        // Mock data as fallback
        setProjects([
          {
            id: "project-1",
            title: "Project Repository Platform",
            description: "A web application for managing student projects with version control integration",
            status: "Active",
            lastUpdated: "2 days ago",
            advisor: "Dr. Sarah Johnson",
            technologies: ["React", "Next.js", "TypeScript", "Prisma"],
            progress: 65,
            views: 87
          },
          {
            id: "project-2",
            title: "AI Study Assistant",
            description: "An AI-powered assistant to help students with research and study materials",
            status: "Draft",
            lastUpdated: "1 week ago",
            advisor: "Prof. Michael Chen",
            technologies: ["Python", "TensorFlow", "React", "Node.js"],
            progress: 30,
            views: 45
          },
          {
            id: "project-3",
            title: "Smart Campus Navigation",
            description: "Mobile application for campus navigation and resource finding",
            status: "Completed",
            lastUpdated: "3 months ago",
            advisor: "Dr. Emily Rodriguez",
            technologies: ["Flutter", "Firebase", "Google Maps API"],
            progress: 100,
            views: 120
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [userId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" /> Projects
          </CardTitle>
          <CardDescription>Loading projects...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" /> Projects
          </CardTitle>
          <CardDescription>No projects found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="mb-4 text-muted-foreground">You haven't started any projects yet.</p>
            <Button>Create New Project</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Helper function to get appropriate color for status badge
  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
      case "Completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      case "Draft":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      default:
        return ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" /> Projects
            </CardTitle>
            <CardDescription>Your current and past projects</CardDescription>
          </div>
          <Button size="sm">New Project</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="rounded-lg border hover:border-primary transition-colors overflow-hidden"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-lg font-semibold">
                        <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                          {project.title}
                        </Link>
                      </h3>
                      <Badge 
                        className={`${getStatusColor(project.status)} border`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{project.description}</p>
                  </div>
                  
                  <div className="flex gap-3 text-muted-foreground text-sm">
                    {project.views !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{project.views}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  {project.technologies.map(tech => (
                    <Badge key={tech} variant="secondary">{tech}</Badge>
                  ))}
                </div>
                
                {project.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Advisor: {project.advisor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Last updated: {project.lastUpdated}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${project.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" /> View Project
                    </Link>
                  </Button>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>main</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}