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
import { GitBranch, ExternalLink, Calendar, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import CreateRepositoryModal from './CreateRepositoryModal';

interface Repository {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  group: {
    id: string;
    name: string;
  };
  owner: {
    userId: string;
    firstName: string;
    lastName: string;
  };
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
  groupId: string;
  isLeader: boolean;
  groupName: string;
}

export default function RepositoriesList({ groupId, isLeader, groupName }: RepositoriesListProps) {
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
      const url = `/api/groups/${groupId}/repositories?offset=${offset}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch repositories');
      }

      // Helper function to validate a repository object
      const isValidRepository = (repo: any): repo is Repository => {
        return (
          repo != null &&
          typeof repo === 'object' &&
          typeof repo.id === 'string' &&
          typeof repo.name === 'string' &&
          typeof repo.description === 'string' &&
          typeof repo.visibility === 'string' &&
          ['public', 'private'].includes(repo.visibility) &&
          typeof repo.createdAt === 'string' &&
          typeof repo.updatedAt === 'string' &&
          typeof repo.group === 'object' &&
          typeof repo.group.id === 'string' &&
          typeof repo.group.name === 'string' &&
          typeof repo.owner === 'object' &&
          typeof repo.owner.userId === 'string' &&
          typeof repo.owner.firstName === 'string' &&
          typeof repo.owner.lastName === 'string'
        );
      };

      // Normalize repositories
      const repositories = (Array.isArray(data.repositories) ? data.repositories : []).filter(isValidRepository);

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
  }, [groupId]);

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

  const getVisibilityColor = (visibility: string) => {
    switch (visibility.toLowerCase()) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'private':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
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
          groupId={groupId}
          groupUserName={groupName}
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
            if (!repo || !repo.id) {
              console.warn('Skipping invalid repository:', repo);
              return null;
            }

            return (
              <div
                key={repo.id}
                className="rounded-lg border hover:border-primary transition-colors overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-semibold">
                          <Link href={`/groups/${repo.group.id}/repositories/${repo.id}`} className="hover:text-primary transition-colors">
                            {repo.name}
                          </Link>
                        </h3>
                        <Badge className={`${getVisibilityColor(repo.visibility)} border`}>
                          {repo.visibility}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {repo.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>Group: {repo.group.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {repo.visibility === 'public' ? (
                        <Globe className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      <span>Visibility: {repo.visibility}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Last updated: {formatDate(repo.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>Owner: {repo.owner.firstName} {repo.owner.lastName}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/groups/${repo.group.id}/repositories/${repo.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" /> View Repository
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {repositoryData.pagination.hasMore && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
        groupId={groupId}
        groupUserName={groupName}
        onRepositoryCreated={() => fetchRepositories(0, 5)}
      />
    </Card>
  );
}