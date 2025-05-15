"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  GitBranchIcon, 
  UsersIcon, 
  CodeIcon, 
  InfoIcon, 
  BookOpenIcon, 
  StarIcon, 
  GitForkIcon, 
  EyeIcon, 
  ClockIcon, 
  FileIcon,
  FolderIcon,
  ChevronRightIcon
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Type definitions
interface Repository {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  owner: {
    userId: string;
    firstName: string;
    lastName: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  stats: {
    commits: number;
    branches: number;
  };
  defaultBranch: {
    id: string;
    name: string;
  } | null;
  branches: Array<{
    id: string;
    name: string;
  }>;
  contributors: Array<{
    userId: string;
    firstName: string;
    lastName: string;
  }>;
}

interface TreeNode {
  path: string;
  type: "file" | "directory";
}

interface Commit {
  id: string;
  message: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function MainRepoPage() {
  const params = useParams<{ ownerId: string; repoId: string }>();
  const { ownerId, repoId } = params;
  const { data: session } = useSession();
  
  const [repoData, setRepoData] = useState<Repository | null>(null);
  const [readme, setReadme] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("code");
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [isFileTreeLoading, setIsFileTreeLoading] = useState(true);
  const [lastCommit, setLastCommit] = useState<Commit | null>(null);

  // Configure marked with secure defaults
  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
      sanitize: false, // We'll use DOMPurify instead
    });
  }, []);

  // Fetch repository data
  useEffect(() => {
    if (!ownerId || !repoId) {
      setError("Invalid repository parameters");
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch repository overview
        const repoResponse = await fetch(`/api/groups/${ownerId}/repositories/${repoId}/overview`);
        
        if (!repoResponse.ok) {
          throw new Error(`Failed to fetch repository data: ${repoResponse.status}`);
        }
        
        const repoData: Repository = await repoResponse.json();
        setRepoData(repoData);
        
        // Fetch README if we have a default branch
        if (repoData.defaultBranch) {
          try {
            const readmeResponse = await fetch(
              `/api/groups/${ownerId}/repositories/${repoId}/readme/${repoData.defaultBranch.name}`
            );
            
            if (readmeResponse.ok) {
              const { content } = await readmeResponse.json();
              // Sanitize and convert markdown to HTML
              const htmlContent = DOMPurify.sanitize(await marked(content));
              setReadme(htmlContent);
            }
          } catch (readmeError) {
            console.warn("Failed to load README:", readmeError);
          }

          // Fetch file tree
          setIsFileTreeLoading(true);
          try {
            const treeResponse = await fetch(
              `/api/groups/${ownerId}/repositories/${repoId}/tree/${repoData.defaultBranch.name}`
            );
            
            if (treeResponse.ok) {
              const { tree } = await treeResponse.json();
              setFileTree(tree as TreeNode[]);
            }
          } catch (treeError) {
            console.warn("Failed to load file tree:", treeError);
          }
          
          // Fetch last commit
          try {
            const commitsResponse = await fetch(
              `/api/groups/${ownerId}/repositories/${repoId}/commits/${repoData.defaultBranch.name}?limit=1`
            );
            if (commitsResponse.ok) {
              const commits: Commit[] = await commitsResponse.json();
              if (commits?.length > 0) {
                setLastCommit(commits[0]);
              }
            }
          } catch (commitError) {
            console.warn("Failed to load commits:", commitError);
          }
        }
      } catch (err) {
        console.error("Error fetching repository data:", err);
        setError("Failed to load repository data");
      } finally {
        setIsLoading(false);
        setIsFileTreeLoading(false);
      }
    }

    fetchData();
  }, [ownerId, repoId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
        <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="min-h-screen bg-background">
        <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
        <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error || "Failed to load repository"}
          </div>
        </div>
      </div>
    );
  }

  const defaultBranchName = repoData.defaultBranch?.name || "main";

  return (
    <div className="min-h-screen bg-background">
      <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
      <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Repository Info Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{repoData.name}</h1>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <StarIcon className="h-4 w-4" />
                <span>Star</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <GitForkIcon className="h-4 w-4" />
                <span>Fork</span>
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-base">{repoData.description || "No description provided"}</p>
          
          <div className="flex flex-wrap items-center mt-4 text-sm text-muted-foreground gap-4">
            {repoData.isPrivate ? (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-2 py-1">
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 px-2 py-1">
                Public
              </Badge>
            )}
            
            <span className="flex items-center">
              <StarIcon className="h-4 w-4 mr-1" />
              <span>0 stars</span>
            </span>
            
            <span className="flex items-center">
              <GitForkIcon className="h-4 w-4 mr-1" />
              <span>0 forks</span>
            </span>
            
            <span className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>0 watchers</span>
            </span>
            
            <span className="flex items-center">
              <GitBranchIcon className="h-4 w-4 mr-1" />
              <span>{repoData.stats?.branches || 0} branch{repoData.stats?.branches !== 1 ? 'es' : ''}</span>
            </span>
            
            <span className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-1" />
              <span>{repoData.contributors?.length || 0} contributor{repoData.contributors?.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10 pb-2 mb-4 border-b">
            <TabsTrigger value="code" className="flex items-center gap-2">
              <CodeIcon className="h-4 w-4" />
              <span>Code</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="readme" className="flex items-center gap-2" disabled={!readme}>
              <BookOpenIcon className="h-4 w-4" />
              <span>README</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4">
            <div className="border rounded-lg shadow-sm overflow-hidden">
              {/* Branch selector and code navigation */}
              <div className="bg-muted/40 border-b p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <GitBranchIcon className="h-4 w-4" />
                    <span>{defaultBranchName}</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <span>Code</span>
                  </Button>
                </div>
              </div>
              
              {/* Last commit info */}
              {lastCommit && (
                <div className="bg-background border-b p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">
                        {lastCommit.author 
                          ? `${lastCommit.author.firstName} ${lastCommit.author.lastName}` 
                          : 'Unknown'}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {lastCommit.message && lastCommit.message.length > 60 
                          ? `${lastCommit.message.substring(0, 60)}...` 
                          : lastCommit.message || 'No commit message'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {new Date(lastCommit.createdAt).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {lastCommit.id.substring(0, 7)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {/* File explorer */}
              <div className="bg-background">
                {isFileTreeLoading ? (
                  <div className="p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 mb-3">
                        {i % 2 === 0 ? (
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FolderIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Skeleton className="h-4 w-64" />
                      </div>
                    ))}
                  </div>
                ) : fileTree.length === 0 ? (
                  <div className="p-4 text-muted-foreground text-sm">
                    No files found in this repository.
                  </div>
                ) : (
                  <div className="divide-y">
                    {fileTree.sort((a, b) => {
                        if (a.type !== b.type) {
                          return a.type === "directory" ? -1 : 1;
                        }
                        return a.path.localeCompare(b.path);
                      })
                      .map((item, index) => {
                        const pathParts = item.path.split('/');
                        const name = pathParts[pathParts.length - 1];
                        
                        if (pathParts.length !== 1) return null;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/${ownerId}/${repoId}/${item.type === 'directory' ? 'tree' : 'blob'}/${defaultBranchName}/${item.path}`}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {item.type === 'directory' ? (
                                <FolderIcon className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{name}</span>
                            </div>
                            {item.type === 'directory' && (
                              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Link>
                        );
                      }).filter(Boolean)}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="mt-4">
            <div className="border rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Owner</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span>{repoData.owner?.firstName} {repoData.owner?.lastName}</span>
                    </div>
                  </div>
                  
                  {repoData.group && (
                    <div>
                      <h3 className="font-medium text-lg mb-2">Group</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span>{repoData.group.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Contributors</h3>
                    <div className="flex flex-wrap gap-2">
                      {repoData.contributors?.length ? (
                        repoData.contributors.map(contributor => (
                          <div key={contributor.userId} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span>{contributor.firstName} {contributor.lastName}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No contributors yet</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Statistics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/30 p-2 rounded-md">
                        <div className="text-sm text-muted-foreground">Commits</div>
                        <div className="font-medium">{repoData.stats?.commits || 0}</div>
                      </div>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <div className="text-sm text-muted-foreground">Branches</div>
                        <div className="font-medium">{repoData.stats?.branches || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="readme" className="mt-4">
            <div className="border rounded-lg shadow-sm overflow-hidden">
              <div className="bg-muted/40 border-b p-4">
                <h2 className="font-semibold">README.md</h2>
              </div>
              <div className="p-6 bg-background">
                <div className="prose max-w-none">
                  {readme ? (
                    <div dangerouslySetInnerHTML={{ __html: readme }} />
                  ) : (
                    <p className="text-muted-foreground">No README file found.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}