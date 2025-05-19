'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, ClipboardCheck, Star, History, UserCheck, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EvaluatorStats {
  currentAssignments: number;
  completedEvaluations: number;
  yearsExperience: number;
  averageScore: number;
}

interface ProfileOverviewProps {
  userId: string;
  isOwner?: boolean;
}

export default function ProfileOverview({ userId, isOwner = false }: ProfileOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [evaluatorInfo, setEvaluatorInfo] = useState<any | null>(null);
  const [stats, setStats] = useState<EvaluatorStats>({
    currentAssignments: 0,
    completedEvaluations: 0,
    yearsExperience: 0,
    averageScore: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch evaluator details
        const evaluatorResponse = await fetch(`/api/users/${userId}/details`);
        const evaluatorData = await evaluatorResponse.json();
        
        if (!evaluatorResponse.ok) {
          throw new Error(evaluatorData.message || 'Failed to fetch evaluator details');
        }
        
        setEvaluatorInfo(evaluatorData);

        // Fetch stats
        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        const statsData = await statsResponse.json();
        
        if (!statsResponse.ok) {
          throw new Error(statsData.message || 'Failed to fetch stats');
        }
        
        setStats({
          currentAssignments: statsData.currentAssignments || 0,
          completedEvaluations: statsData.completedEvaluations || 0,
          yearsExperience: statsData.yearsExperience || 0,
          averageScore: statsData.averageScore || 0
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        toast.error('Error fetching evaluator data', {
          description: errorMessage,
        });
        setEvaluatorInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-7 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-muted rounded"></div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-7 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
          
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-7 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-100 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <ClipboardCheck className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold">{stats.currentAssignments}</div>
              <div className="text-sm text-muted-foreground">Current Assignments</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <CheckSquare className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{stats.completedEvaluations}</div>
              <div className="text-sm text-muted-foreground">Completed Evaluations</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-100 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <GraduationCap className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold">{stats.yearsExperience}</div>
              <div className="text-sm text-muted-foreground">Years Experience</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <Star className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Score Given</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bio/About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>{evaluatorInfo?.bio || "No biography information available."}</p>
        </CardContent>
      </Card>
      
      {/* Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Areas of Expertise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {evaluatorInfo?.expertise && evaluatorInfo.expertise.length > 0 ? (
              evaluatorInfo.expertise.map((area: string, index: number) => (
                <Badge key={index} variant="secondary" className="px-2 py-1 text-sm">
                  {area}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground">No expertise areas specified.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Evaluation Approach */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Evaluation Approach</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {evaluatorInfo?.evaluationApproach || 
             "The evaluator has not provided information about their evaluation approach."}
          </p>
          
          {evaluatorInfo?.evaluationCriteria && evaluatorInfo.evaluationCriteria.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Key Evaluation Criteria</h4>
              <ul className="list-disc pl-5 space-y-1">
                {evaluatorInfo.evaluationCriteria.map((criterion: string, index: number) => (
                  <li key={index} className="text-sm">{criterion}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 