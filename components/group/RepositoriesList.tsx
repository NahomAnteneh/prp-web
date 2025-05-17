'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, ExternalLink, Calendar, Lock, Globe, Code } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import CreateRepositoryModal from './CreateRepositoryModal';

interface Repository {
  name: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  ownerId: string;
  groupUserName: string;
  group: {
    name: string;
    leaderId: string;
  };
  stats: {
    commits: number;
    branches: number;
    projects: number;
  };
  projects?: { id: string; title: string }[];
}

interface RepositoryResponse {
  repositories: Repository[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface RepositoriesListProps {
  groupUserName: string;
  isLeader: boolean;
  groupName: string;
}

export default function RepositoriesList({ groupUserName, isLeader, groupName }: RepositoriesListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [repositoryData, setRepositoryData] = useState<RepositoryResponse>({
    repositories: [],
    pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchRepositories = async (offset: number, limit: number, append: boolean = false) => {
    try {
      setIsLoadingMore(true);
      const url = `/api/groups/${groupUserName}/repositories?offset=${offset}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch repositories');
      }
      
      // Log the raw repository data from API
      console.log('Raw API response:', data);
      console.log('Raw repositories from API:', data.repositories);
      
      // Show the actual isPrivate values before conversion
      if (Array.isArray(data.repositories) && data.repositories.length > 0) {
        console.log('First repository raw data:', data.repositories[0]);
        console.log('isPrivate value:', data.repositories[0].isPrivate);
        console.log('isPrivate type:', typeof data.repositories[0].isPrivate);
      }

      // Normalize repositories
      const repositories = (Array.isArray(data.repositories) ? data.repositories : []).map((repo: any) => {
        // Our API now consistently returns isPrivate as boolean
        return {
          ...repo,
          // Make sure isPrivate is a boolean if it somehow isn't
          isPrivate: typeof repo.isPrivate === 'boolean' ? repo.isPrivate : Boolean(repo.isPrivate)
        };
      });
      
      // Debug the repository data
      console.log('Repository data processed:', repositories.map((repo: Repository) => ({
        name: repo.name,
        isPrivate: repo.isPrivate,
        typeOfIsPrivate: typeof repo.isPrivate,
        lastActivity: repo.lastActivity
      })));

      const normalizedData: RepositoryResponse = {
        repositories,
        pagination: data.pagination || {
          total: repositories.length,
          limit,
          offset,
          hasMore: repositories.length === limit,
        },
      };

      if (append) {
        setRepositoryData({
          repositories: [...repositoryData.repositories, ...normalizedData.repositories],
          pagination: normalizedData.pagination,
        });
      } else {
        setRepositoryData(normalizedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching repositories', {
        description: errorMessage,
      });
      setRepositoryData({
        repositories: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRepositories(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupUserName]);

  const handleLoadMore = () => {
    if (repositoryData.pagination.hasMore) {
      const newOffset = repositoryData.pagination.offset + repositoryData.pagination.limit;
      fetchRepositories(newOffset, repositoryData.pagination.limit, true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisibilityColor = (isPrivate: boolean) => {
    if (isPrivate) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Repositories
          </CardTitle>
          <CardDescription>Loading repositories...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading repositories...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (repositoryData.repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Repositories
          </CardTitle>
          <CardDescription>No repositories found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="mb-4 text-muted-foreground">
              {isLeader ? "Your group hasn't created any repositories yet." : "This group hasn't created any repositories yet."}
            </p>
            {isLeader && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Repository
              </Button>
            )}
          </div>
        </CardContent>
        <CreateRepositoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          groupUserName={groupUserName}
          groupName={groupName}
          onRepositoryCreated={() => fetchRepositories(0, 5)}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" /> Repositories
            </CardTitle>
            <CardDescription>
              {isLeader ? "Your group's code repositories" : 'Group code repositories'}
            </CardDescription>
          </div>
          {isLeader && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              New Repository
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {repositoryData.repositories.map((repo) => {
            if (!repo || !repo.name) {
              console.warn('Skipping invalid repository:', repo);
              return null;
            }

            return (
              <div
                key={`${repo.groupUserName}-${repo.name}`}
                className="rounded-lg border hover:border-primary transition-colors overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-semibold">
                          <Link href={`/groups/${repo.groupUserName}/repositories/${repo.name}`} className="hover:text-primary transition-colors">
                            {repo.name}
                          </Link>
                        </h3>
                        <Badge
                          className={`${getVisibilityColor(repo.isPrivate)} border`}
                        >
                          {repo.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {repo.description}
                      </p>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {repo.lastActivity}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 md:mt-0">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/groups/${repo.groupUserName}/repositories/${repo.name}`}>
                          <span className="flex items-center gap-1">
                            View Repository <ExternalLink className="h-3 w-3 ml-1" />
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
                    <div className="flex space-x-4">
                      <span className="flex items-center">
                        <GitBranch className="h-4 w-4 mr-1" />
                        {repo.stats.branches} branch{repo.stats.branches !== 1 ? 'es' : ''}
                      </span>
                      <span className="flex items-center">
                        <Code className="h-4 w-4 mr-1" />
                        {repo.stats.commits} commit{repo.stats.commits !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {repositoryData.pagination.hasMore && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </CardContent>
      <CreateRepositoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        groupUserName={groupUserName}
        groupName={groupName}
        onRepositoryCreated={() => fetchRepositories(0, 5)}
      />
    </Card>
  );
}