'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Award, UserCheck, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AdvisorStats {
  currentAdvisees: number;
  completedProjects: number;
  yearsExperience: number;
  avgRating: number;
}

interface ProfileOverviewProps {
  userId: string;
  isOwner?: boolean;
}

export default function ProfileOverview({ userId, isOwner = false }: ProfileOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [advisorInfo, setAdvisorInfo] = useState<any | null>(null);
  const [stats, setStats] = useState<AdvisorStats>({
    currentAdvisees: 0,
    completedProjects: 0,
    yearsExperience: 0,
    avgRating: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch advisor details
        const advisorResponse = await fetch(`/api/users/${userId}/details`);
        const advisorData = await advisorResponse.json();
        
        if (!advisorResponse.ok) {
          throw new Error(advisorData.message || 'Failed to fetch advisor details');
        }
        
        setAdvisorInfo(advisorData);

        // Fetch stats
        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        const statsData = await statsResponse.json();
        
        if (!statsResponse.ok) {
          throw new Error(statsData.message || 'Failed to fetch stats');
        }
        
        setStats({
          currentAdvisees: statsData.currentAdvisees || 0,
          completedProjects: statsData.completedProjects || 0,
          yearsExperience: statsData.yearsExperience || 0,
          avgRating: statsData.avgRating || 0
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        toast.error('Error fetching advisor data', {
          description: errorMessage,
        });
        setAdvisorInfo(null);
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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{stats.currentAdvisees}</div>
              <div className="text-sm text-muted-foreground">Current Advisees</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-100 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <BookOpen className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <div className="text-sm text-muted-foreground">Completed Projects</div>
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
                <Award className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
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
          <p>{advisorInfo?.bio || "No biography information available."}</p>
        </CardContent>
      </Card>
      
      {/* Research Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Research Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {advisorInfo?.researchInterests && advisorInfo.researchInterests.length > 0 ? (
              advisorInfo.researchInterests.map((interest: string, index: number) => (
                <Badge key={index} variant="secondary" className="px-2 py-1 text-sm">
                  {interest}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground">No research interests specified.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Publications/Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Publications</CardTitle>
          {advisorInfo?.publications && advisorInfo.publications.length > 3 && (
            <Button variant="link" className="text-sm" asChild>
              <Link href={`/publications/${userId}`}>View All</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {advisorInfo?.publications && advisorInfo.publications.length > 0 ? (
            <ul className="space-y-3">
              {advisorInfo.publications.slice(0, 3).map((publication: any, index: number) => (
                <li key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <h4 className="font-medium">{publication.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{publication.journal}, {publication.year}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No publications available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 