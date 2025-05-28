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
import { History } from "lucide-react"

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
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Evaluation History
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, yearIndex: number) => (
              <div key={yearIndex} className="space-y-3">
                <Skeleton className="h-6 w-1/3 mb-2" /> {/* Skeleton for Year Title */}
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="mb-4 animate-pulse">
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
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Evaluation History
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-destructive">Error loading evaluation history.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Evaluation History
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
        </CardTitle>
        {sortedYears.length === 0 && (
            <CardDescription>No evaluation history found.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {sortedYears.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No History Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              There are no previously evaluated projects to display for this advisor.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
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
        )}
      </CardContent>
    </Card>
  )
} 