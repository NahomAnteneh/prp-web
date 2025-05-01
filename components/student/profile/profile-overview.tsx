"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github, GitBranch, Users, Folder, BarChart3 } from "lucide-react"
import Link from "next/link"

import { Group, Repository, Project } from "@prisma/client"

interface ProfileOverviewProps {
  userId: string
  isOwner?: boolean
}

interface ProjectSummary {
  id: string
  title: string
  status: string
}

export default function ProfileOverview({ userId, isOwner = false }: ProfileOverviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState<Group | null>(null)
  const [topRepositories, setTopRepositories] = useState<Repository[]>([])
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([])
  const [stats, setStats] = useState({
    commits: 0,
    repositories: 0,
    projects: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch group info
        const groupResponse = await fetch(`/api/users/${userId}/group`);
        const groupData = await groupResponse.json();
        setGroupInfo(groupData);

        // Fetch repositories
        const reposResponse = await fetch(`/api/users/${userId}/repository`);
        const reposData = await reposResponse.json();

        // Handle cases where the response is an object with a `repositories` property
        const repositories = Array.isArray(reposData) ? reposData : reposData.repositories;

        if (Array.isArray(repositories)) {
          setTopRepositories(repositories.slice(0, 3)); // Get top 3 repositories
        } else {
          console.error("Unexpected repositories data format:", reposData);
          setTopRepositories([]); // Fallback to an empty array
        }

        // Fetch projects
        const projectsResponse = await fetch(`/api/users/${userId}/projects`);
        const projectsData = await projectsResponse.json();
        setRecentProjects(projectsData.slice(0, 3).map((p: any) => ({
          id: p.id,
          title: p.title,
          status: p.status,
        })));

        // Fetch stats
        setStats({
          commits: repositories.reduce((sum: number, repo: any) => sum + (repo.commits || 0), 0),
          repositories: repositories.length || 0,
          projects: projectsData.length || 0,
        });
      } catch (error) {
        console.error("Error fetching profile overview data:", error);
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Github className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{stats.commits}</div>
              <div className="text-sm text-muted-foreground">Commits</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-100 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                <Folder className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold">{stats.repositories}</div>
              <div className="text-sm text-muted-foreground">Repositories</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-100 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <BarChart3 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold">{stats.projects}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Group Information */}
      {groupInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <h3 className="font-medium text-lg">{groupInfo.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {groupInfo.members} members
                </p>
              </div>
              <Button size="sm" variant="outline" className="mt-2 md:mt-0">
                <Link href={`/groups/${groupInfo.id}`}>
                  View Group
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Repositories */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Github className="h-5 w-5 text-primary" />
                Top Repositories
              </CardTitle>
              {topRepositories.length > 0 && (
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link href={`/repositories`}>View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {topRepositories.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No repositories yet</p>
            ) : (
              <div className="space-y-3">
                {topRepositories.map(repo => (
                  <div key={repo.id} className="p-3 rounded-lg border hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-medium text-sm">
                        <Link href={`/repositories/${repo.id}`} className="hover:text-primary transition-colors">
                          {repo.name}
                        </Link>
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2">
                      {repo.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        main
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated {repo.lastActivity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Folder className="h-5 w-5 text-primary" />
                Recent Projects
              </CardTitle>
              {recentProjects.length > 0 && (
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link href="/projects">View All</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map(project => (
                  <div key={project.id} className="p-3 rounded-lg border hover:border-primary transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-sm">
                        <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                          {project.title}
                        </Link>
                      </h4>
                      <Badge 
                        variant={
                          project.status === "Active" ? "default" : 
                          project.status === "Completed" ? "outline" : 
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
