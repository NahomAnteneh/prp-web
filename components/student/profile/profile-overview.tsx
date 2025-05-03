'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, GitBranch, Users, Folder, BarChart3, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  groupUserName: string;
  members: number;
}

interface Repository {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  group: {
    id: string;
    name: string;
  } | null;
  stats: {
    commits: number;
    branches: number;
    projects: number;
  };
}

interface ProjectSummary {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' | 'ARCHIVED';
  group: {
    id: string;
    name: string;
    groupUserName: string;
  };
  updatedAt: string;
  stats: {
    tasks: number;
    repositories: number;
    evaluations: number;
    feedback: number;
  };
}

interface ProfileOverviewProps {
  userId: string;
  isOwner?: boolean;
}

export default function ProfileOverview({ userId, isOwner = false }: ProfileOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [topRepositories, setTopRepositories] = useState<Repository[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([]);
  const [stats, setStats] = useState({
    commits: 0,
    repositories: 0,
    projects: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch group info
        const groupResponse = await fetch(`/api/users/${userId}/group`);
        const groupData = await groupResponse.json();
        if (!groupResponse.ok) {
          throw new Error(groupData.message || 'Failed to fetch group info');
        }
        setGroupInfo(groupData);

        // Fetch repositories
        const reposResponse = await fetch(`/api/users/${userId}/repository?limit=10&includeGroupRepos=true`);
        const reposData = await reposResponse.json();
        if (!reposResponse.ok) {
          throw new Error(reposData.message || 'Failed to fetch repositories');
        }
        const repositories = Array.isArray(reposData) ? reposData : reposData.repositories || [];
        setTopRepositories(repositories.slice(0, 3));

        // Fetch projects
        const projectsResponse = await fetch(`/api/users/${userId}/projects`);
        const projectsData = await projectsResponse.json();
        if (!projectsResponse.ok) {
          throw new Error(projectsData.message || 'Failed to fetch projects');
        }
        const projectsArray = Array.isArray(projectsData) ? projectsData : projectsData.projects || [];
        setRecentProjects(projectsArray.slice(0, 3).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          status: p.status,
          group: p.group,
          updatedAt: p.updatedAt,
          stats: p.stats,
        })));

        // Calculate stats
        const totalCommits = repositories.reduce((sum: number, repo: Repository) => sum + (repo.stats.commits || 0), 0);
        setStats({
          commits: totalCommits,
          repositories: repositories.length,
          projects: projectsArray.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        toast.error('Error fetching profile data', {
          description: errorMessage,
        });
        setGroupInfo(null);
        setTopRepositories([]);
        setRecentProjects([]);
        setStats({ commits: 0, repositories: 0, projects: 0 });
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

  const getStatusDisplay = (status: ProjectSummary['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'SUBMITTED':
        return 'Submitted';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: ProjectSummary['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'COMPLETED':
        return 'outline';
      case 'SUBMITTED':
      case 'ARCHIVED':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
                  <Link href={`/groups/${groupInfo.id}`} className="hover:text-primary">
                    @{groupInfo.groupUserName}
                  </Link> • {groupInfo.members} members
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
                      <Badge variant="outline" className="text-xs">
                        {repo.isPrivate ? (
                          <Lock className="h-3 w-3 mr-1" />
                        ) : (
                          <Globe className="h-3 w-3 mr-1" />
                        )}
                        {repo.isPrivate ? 'Private' : 'Public'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
                      {repo.description || 'No description provided'}
                    </p>
                    {repo.group && (
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Group: <Link href={`/groups/${repo.group.id}`} className="hover:text-primary">@{repo.group.name}</Link>
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <GitBranch className="h-3 w-3 mr-1" />
                          main
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {repo.stats.commits} commits
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {repo.lastActivity}
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
                        variant={getStatusVariant(project.status)}
                        className="text-xs"
                      >
                        {getStatusDisplay(project.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
                      {project.description || 'No description provided'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Group: <Link href={`/groups/${project.group.id}`} className="hover:text-primary">@{project.group.groupUserName}</Link>
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {project.stats.tasks} tasks
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}