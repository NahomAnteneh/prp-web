"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Folder, ExternalLink, Calendar, User } from "lucide-react"
import Link from "next/link"

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
}

export default function ProjectsList({ userId }: ProjectsListProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    // In a real implementation, fetch projects data from an API
    const fetchProjects = async () => {
      try {
        // Simulating API call with a timeout
        setTimeout(() => {
          setProjects([
            {
              id: "project-1",
              title: "Project Repository Platform",
              description: "A collaborative platform for managing student projects, enabling version control, task management, and advisor feedback.",
              status: "Active",
              lastUpdated: "2023-05-15",
              advisor: "Dr. Jane Smith",
              technologies: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"]
            },
            {
              id: "project-2",
              title: "Academic Resource Sharing App",
              description: "Mobile-first web application for sharing academic resources among students in the department.",
              status: "Completed",
              lastUpdated: "2022-12-10",
              advisor: "Dr. Michael Johnson",
              technologies: ["React Native", "Firebase", "Node.js"]
            }
          ])
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching projects:", error)
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" /> Projects
            </CardTitle>
            <CardDescription>Your current and past projects</CardDescription>
          </div>
          <Button size="sm">New Project</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {project.title}
                    <Badge 
                      variant={
                        project.status === "Active" ? "default" : 
                        project.status === "Completed" ? "outline" : 
                        "secondary"
                      }
                    >
                      {project.status}
                    </Badge>
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {project.technologies.map(tech => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{project.advisor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Last updated: {project.lastUpdated}</span>
                </div>
              </div>
              
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${project.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" /> View Project
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 