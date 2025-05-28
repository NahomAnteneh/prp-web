"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Info, Calendar, Clock, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

interface CurrentEvaluation {
  id: string
  title: string
  status: string
  dueDate: string
  studentName: string
  studentId: string
  submissionDate: string
  completionPercentage: number
}

interface CurrentEvaluationsProps {
  userId: string
  isOwner: boolean
}

export default function CurrentEvaluations({ userId, isOwner }: CurrentEvaluationsProps) {
  const [currentEvaluations, setCurrentEvaluations] = useState<CurrentEvaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentEvaluations = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/current-evaluations`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch current evaluations")
        }
        
        const data = await response.json()
        setCurrentEvaluations(data)
      } catch (err) {
        console.error("Error fetching current evaluations:", err)
        setError("Failed to load current evaluations")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCurrentEvaluations()
  }, [userId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Current Evaluations
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Projects currently assigned to you for evaluation.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
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
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Current Evaluations
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-destructive">Error loading evaluations.</p>
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

  if (currentEvaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Current Evaluations
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Projects currently assigned to you for evaluation.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>No current evaluations assigned.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-10">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Evaluations Pending</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You have no projects currently assigned for evaluation. New assignments will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Current Evaluations
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Projects currently assigned to you for evaluation.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentEvaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Evaluations Pending</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              You have no projects currently assigned for evaluation. New assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentEvaluations.map(evaluation => {
              const daysRemaining = calculateDaysRemaining(evaluation.dueDate)
              const isDueWarning = daysRemaining <= 7 && daysRemaining > 0
              const isOverdue = daysRemaining < 0
              
              return (
                <Card key={evaluation.id} className="mb-0">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{evaluation.title}</CardTitle>
                        <CardDescription>
                          Student: {evaluation.studentName}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(evaluation.status)}>
                        {evaluation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Submission Date:</span> {evaluation.submissionDate}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Due Date:</span> 
                        <span className={isOverdue ? "text-red-600 font-bold" : isDueWarning ? "text-amber-600 font-bold" : ""}>
                          {evaluation.dueDate} {isOverdue ? "(Overdue)" : isDueWarning ? `(${daysRemaining} days left)` : ""}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Evaluation Progress</span>
                        <span>{evaluation.completionPercentage}%</span>
                      </div>
                      <Progress value={evaluation.completionPercentage} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${evaluation.id}`}>
                          View Project Details <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      {isOwner && (
                        <Button asChild variant="default" size="sm">
                          <Link href={`/evaluations/${evaluation.id}`}>
                            Continue Evaluation
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 