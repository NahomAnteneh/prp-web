'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  GitBranchPlus, 
  GitFork, 
  Loader2, 
  Plus, 
  Search,
  Check,
  X,
  Globe,
  Lock,
  Calendar,
  ExternalLink,
  GitBranch,
  Code,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import CreateRepositoryModal from '@/components/group/CreateRepositoryModal';

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

interface ProjectRepositoriesProps {
  ownerId: string;
  projectId: string;
}

export function ProjectRepositories({ ownerId, projectId }: ProjectRepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSelectRepoDialogOpen, setIsSelectRepoDialogOpen] = useState(false);
  const [isCreateRepoModalOpen, setIsCreateRepoModalOpen] = useState(false);
  const [groupRepositories, setGroupRepositories] = useState<Repository[]>([]);
  const [loadingGroupRepos, setLoadingGroupRepos] = useState(false);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [repoToRemove, setRepoToRemove] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (error) {
        console.error('Error fetching project repositories:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
        toast.error('Error loading repositories', {
          description: error instanceof Error ? error.message : 'Failed to load repositories'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [ownerId, projectId]);

  // Fetch group info to get the group name
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await fetch(`/api/groups/${ownerId}`);
        if (response.ok) {
          const data = await response.json();
          setGroupName(data.name || '');
        }
      } catch (error) {
        console.error('Error fetching group info:', error);
      }
    };
    
    fetchGroupInfo();
  }, [ownerId]);

  const fetchGroupRepositories = async () => {
    try {
      setLoadingGroupRepos(true);
      const response = await fetch(`/api/groups/${ownerId}/repositories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch group repositories: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter out repositories that are already linked to the project
      const linkedRepoNames = repositories.map(repo => repo.name);
      const availableRepos = (data.repositories || []).filter(
        (repo: Repository) => !linkedRepoNames.includes(repo.name)
      );
      
      setGroupRepositories(availableRepos);
    } catch (error) {
      console.error('Error fetching group repositories:', error);
      toast.error('Error loading group repositories', {
        description: error instanceof Error ? error.message : 'Failed to load group repositories'
      });
    } finally {
      setLoadingGroupRepos(false);
    }
  };

  const handleOpenSelectRepoDialog = () => {
    fetchGroupRepositories();
    setSelectedRepositories([]);
    setIsSelectRepoDialogOpen(true);
  };

  const handleToggleRepository = (repoName: string) => {
    setSelectedRepositories(prev => 
      prev.includes(repoName) 
        ? prev.filter(name => name !== repoName)
        : [...prev, repoName]
    );
  };

  const handleLinkSelectedRepositories = async () => {
    if (selectedRepositories.length === 0) {
      toast.error('Please select at least one repository');
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      // Link each selected repository one by one
      for (const repoName of selectedRepositories) {
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repositoryName: repoName }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Refresh repositories list
      const refreshResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setRepositories(refreshData.repositories || []);
      }

      // Show appropriate toast message
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully linked ${successCount} repositories`);
      } else if (successCount > 0 && failCount > 0) {
        toast.success(`Linked ${successCount} repositories, but ${failCount} failed`);
      } else {
        toast.error('Failed to link repositories');
      }

      setIsSelectRepoDialogOpen(false);
    } catch (error) {
      console.error('Error linking repositories:', error);
      toast.error('Error linking repositories', {
        description: error instanceof Error ? error.message : 'Failed to link repositories'
      });
    }
  };

  const handleRepositoryCreated = async () => {
    try {
      // Refresh repositories list
      const refreshResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setRepositories(refreshData.repositories || []);
      }
      
      // Fetch the newly created repository and link it to the project
      const groupReposResponse = await fetch(`/api/groups/${ownerId}/repositories`);
      if (groupReposResponse.ok) {
        const groupReposData = await groupReposResponse.json();
        const latestRepo = groupReposData.repositories?.[0];
        
        if (latestRepo) {
          // Link the newly created repository to the project
          await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repositoryName: latestRepo.name }),
          });
          
          // Refresh repositories list again after linking
          const finalRefreshResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
          if (finalRefreshResponse.ok) {
            const finalRefreshData = await finalRefreshResponse.json();
            setRepositories(finalRefreshData.repositories || []);
          }
          
          toast.success('Repository created and linked to project');
        }
      }
    } catch (error) {
      console.error('Error linking newly created repository:', error);
      toast.error('Repository created but failed to link to project');
    }
  };

  const handleRemoveRepository = async (repoName: string) => {
    try {
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories/${repoName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove repository: ${response.statusText}`);
      }

      // Refresh repositories list after removal
      const refreshResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setRepositories(refreshData.repositories || []);
      }

      toast.success(`Successfully removed repository: ${repoName}`);
      setIsRemoveDialogOpen(false);
      setRepoToRemove(null);
    } catch (error) {
      console.error('Error removing repository:', error);
      toast.error('Error removing repository', {
        description: error instanceof Error ? error.message : 'Failed to remove repository'
      });
    }
  };

  const openRemoveDialog = (repoName: string) => {
    setRepoToRemove(repoName);
    setIsRemoveDialogOpen(true);
  };

  const filteredGroupRepositories = searchQuery 
    ? groupRepositories.filter(repo => 
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : groupRepositories;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Connect and manage code repositories for this project.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleOpenSelectRepoDialog}
          >
            <GitFork className="mr-2 h-4 w-4" />
            Add Group Repositories
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsCreateRepoModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Repository
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="mt-4 text-sm text-muted-foreground">Loading repositories...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <GitFork className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No repositories linked</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Link a repository to this project to track code changes and collaborate with your team.
            </p>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline"
                onClick={handleOpenSelectRepoDialog}
              >
                <GitFork className="mr-2 h-4 w-4" />
                Add Group Repositories
              </Button>
              <Button 
                onClick={() => setIsCreateRepoModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Repository
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {repositories.map((repo) => {
            if (!repo || !repo.name) {
              console.warn('Skipping invalid repository:', repo);
              return null;
            }

              const getVisibilityColor = (isPrivate: boolean) => {
    if (isPrivate) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
    }
  };

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
                          <Link href={`/${repo.groupUserName}/${repo.name}`} className="hover:text-primary transition-colors">
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
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openRemoveDialog(repo.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/${repo.groupUserName}/${repo.name}`}>
                            <span className="flex items-center gap-1">
                              View Repository <ExternalLink className="h-3 w-3 ml-1" />
                            </span>
                          </Link>
                        </Button>
                      </div>
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
        )}
      </CardContent>

      {/* Select Group Repositories Dialog */}
      <Dialog open={isSelectRepoDialogOpen} onOpenChange={setIsSelectRepoDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Group Repositories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              {loadingGroupRepos ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading repositories...</p>
                </div>
              ) : filteredGroupRepositories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No matching repositories found' : 'No available repositories found'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredGroupRepositories.map((repo) => (
                    <div 
                      key={repo.name}
                      className="flex items-start p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleRepository(repo.name)}
                    >
                      <Checkbox
                        checked={selectedRepositories.includes(repo.name)}
                        className="mt-1 mr-3"
                        onCheckedChange={() => handleToggleRepository(repo.name)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{repo.name}</h3>
                          {repo.isPrivate && <Badge variant="outline" className="text-xs">Private</Badge>}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Last updated: {format(new Date(repo.updatedAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsSelectRepoDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLinkSelectedRepositories}
                disabled={selectedRepositories.length === 0 || loadingGroupRepos}
              >
                Add Selected ({selectedRepositories.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Repository Modal */}
      <CreateRepositoryModal
        isOpen={isCreateRepoModalOpen}
        onClose={() => setIsCreateRepoModalOpen(false)}
        groupUserName={ownerId}
        groupName={groupName}
        onRepositoryCreated={handleRepositoryCreated}
      />

      {/* Remove Repository Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Repository</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to remove <span className="font-medium">{repoToRemove}</span> from this project?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will only unlink the repository from this project. The repository itself will not be deleted.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => repoToRemove && handleRemoveRepository(repoToRemove)}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 