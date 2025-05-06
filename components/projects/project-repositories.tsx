'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GitBranchPlus, GitFork, Loader2, Plus } from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  url: string;
  description: string;
  private: boolean;
  defaultBranch: string;
  lastUpdated: string;
  branches: number;
  mergeRequests: number;
  ownerId: string;
  ownerName: string;
  archived?: boolean;
}

interface ProjectRepositoriesProps {
  ownerId: string;
  projectId: string;
}

export function ProjectRepositories({ ownerId, projectId }: ProjectRepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRepositoryData, setNewRepositoryData] = useState({
    name: '',
    description: '',
    isPrivate: true
  });

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error('Error fetching repositories:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [ownerId, projectId]);

  const handleCreateRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRepositoryData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create repository: ${response.statusText}`);
      }

      const newRepository = await response.json();
      setRepositories([...repositories, newRepository]);
      setNewRepositoryData({ name: '', description: '', isPrivate: true });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating repository:', error);
      alert(error instanceof Error ? error.message : 'Failed to create repository');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>
            Connect and manage code repositories for this project.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new repository</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRepository} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Repository Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., my-project"
                  value={newRepositoryData.name}
                  onChange={(e) => setNewRepositoryData({ ...newRepositoryData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the repository"
                  value={newRepositoryData.description}
                  onChange={(e) => setNewRepositoryData({ ...newRepositoryData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={newRepositoryData.isPrivate}
                  onChange={(e) => setNewRepositoryData({ ...newRepositoryData, isPrivate: e.target.checked })}
                />
                <Label htmlFor="private">Private Repository</Label>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Create Repository</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <h3 className="text-lg font-medium">No repositories yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Add a repository to store your project code and collaborate with your team.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Repository
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Repositories</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="flex flex-col gap-2 p-4 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{repo.name}</h3>
                      {repo.private && <Badge variant="outline">Private</Badge>}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">View Repository</a>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>Default branch: {repo.defaultBranch}</span>
                    <span>Branches: {repo.branches}</span>
                    <span>Merge requests: {repo.mergeRequests}</span>
                    <span>Last updated: {new Date(repo.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="active" className="space-y-4">
              {repositories
                .filter(repo => !repo.archived)
                .map((repo) => (
                  <div
                    key={repo.id}
                    className="flex flex-col gap-2 p-4 rounded-lg border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{repo.name}</h3>
                        {repo.private && <Badge variant="outline">Private</Badge>}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer">View Repository</a>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{repo.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Default branch: {repo.defaultBranch}</span>
                      <span>Branches: {repo.branches}</span>
                      <span>Merge requests: {repo.mergeRequests}</span>
                      <span>Last updated: {new Date(repo.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </TabsContent>
            <TabsContent value="archived" className="space-y-4">
              {repositories
                .filter(repo => repo.archived)
                .map((repo) => (
                  <div
                    key={repo.id}
                    className="flex flex-col gap-2 p-4 rounded-lg border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{repo.name}</h3>
                        {repo.private && <Badge variant="outline">Private</Badge>}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer">View Repository</a>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{repo.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Default branch: {repo.defaultBranch}</span>
                      <span>Branches: {repo.branches}</span>
                      <span>Merge requests: {repo.mergeRequests}</span>
                      <span>Last updated: {new Date(repo.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 