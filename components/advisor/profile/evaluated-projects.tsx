"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface EvaluatedProject {
  id: string
  title: string
  status: string
  evaluationDate: string
  grade: string
  studentName: string
  studentId: string
  academicYear: string
}

interface EvaluatedProjectsProps {
  userId: string
  isOwner: boolean
}

export default function EvaluatedProjects({ userId, isOwner }: EvaluatedProjectsProps) {
  const [evaluatedProjects, setEvaluatedProjects] = useState<EvaluatedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvaluatedProjects = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/evaluated-projects`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch evaluated projects")
        }
        
        const data = await response.json()
        setEvaluatedProjects(data)
      } catch (err) {
        console.error("Error fetching evaluated projects:", err)
        setError("Failed to load evaluated projects history")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEvaluatedProjects()
  }, [userId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Evaluation History</h2>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Evaluation History</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (evaluatedProjects.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Evaluation History</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No evaluation history found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group projects by academic year
  const projectsByYear = evaluatedProjects.reduce((acc, project) => {
    if (!acc[project.academicYear]) {
      acc[project.academicYear] = []
    }
    acc[project.academicYear].push(project)
    return acc
  }, {} as Record<string, EvaluatedProject[]>)

  // Sort years in descending order
  const sortedYears = Object.keys(projectsByYear).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Evaluation History</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Projects that this faculty member has evaluated in the past.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {sortedYears.map(year => (
        <div key={year} className="space-y-4">
          <h3 className="text-xl font-semibold">Academic Year {year}</h3>
          
          {projectsByYear[year].map(project => (
            <Card key={project.id} className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>
                      Student: {project.studentName}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Evaluation Date:</span> {project.evaluationDate}
                  </div>
                  <div>
                    <span className="font-medium">Grade:</span> {project.grade}
                  </div>
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/projects/${project.id}`}>
                      View Project Details <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
} 