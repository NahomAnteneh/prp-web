"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  GitBranchIcon, 
  UsersIcon, 
  Code, 
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
import ExplorerView from "@/components/repository/explorer/explorer-view";

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

interface FileType {
  name: string;
  content?: string;
  url?: string;
  isBinary: boolean;
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
  const [fileData, setFileData] = useState<FileType | null>(null);
  const [isFileTreeLoading, setIsFileTreeLoading] = useState(true);
  const [lastCommit, setLastCommit] = useState<any>(null);

  // Fetch repository data
  useEffect(() => {
    if (!ownerId || !repoId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch repository overview
        const repoResponse = await fetch(`/api/groups/${ownerId}/repositories/${repoId}/overview`);
        
        if (!repoResponse.ok) {
          throw new Error("Failed to fetch repository data");
        }
        
        const repoData = await repoResponse.json();
        setRepoData(repoData);
        
        // Fetch README if we have a default branch
        if (repoData.defaultBranch) {
          const readmeResponse = await fetch(
            `/api/groups/${ownerId}/repositories/${repoId}/readme/${repoData.defaultBranch.name}`
          );
          
          if (readmeResponse.ok) {
            const { content } = await readmeResponse.json();
            setReadme(content);
          }

          // Fetch file tree
          setIsFileTreeLoading(true);
          const treeResponse = await fetch(
            `/api/groups/${ownerId}/repositories/${repoId}/tree/${repoData.defaultBranch.name}`
          );
          
          if (treeResponse.ok) {
            const { tree } = await treeResponse.json();
            setFileTree(tree);
          }
          
          // Fetch last commit
          try {
            const commitsResponse = await fetch(
              `/api/groups/${ownerId}/repositories/${repoId}/commits/${repoData.defaultBranch.name}?limit=1`
            );
            if (commitsResponse.ok) {
              const commits = await commitsResponse.json();
              if (commits && commits.length > 0) {
                setLastCommit(commits[0]);
              }
            }
          } catch (err) {
            console.error("Error fetching commits:", err);
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
      <>
        <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
        <div className="container mx-auto py-6 max-w-6xl">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-full mb-1" />
          <Skeleton className="h-5 w-3/4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </>
    );
  }

  if (error || !repoData) {
    return (
      <>
        <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
        <div className="container mx-auto py-6 max-w-6xl">
          <div className="p-4 text-red-600">
            {error || "Failed to load repository"}
          </div>
        </div>
      </>
    );
  }

  const defaultBranchName = repoData.defaultBranch?.name || "main";

  return (
    <>
      <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Repository Info Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{repoData.name}</h1>
            <div className="flex items-center space-x-2">
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
          <p className="text-muted-foreground">{repoData.description}</p>
          
          <div className="flex items-center mt-4 text-sm text-muted-foreground flex-wrap gap-y-2">
            {repoData.isPrivate ? (
              <Badge variant="outline" className="mr-4 bg-amber-100 text-amber-800 hover:bg-amber-100">Private</Badge>
            ) : (
              <Badge variant="outline" className="mr-4 bg-green-100 text-green-800 hover:bg-green-100">Public</Badge>
            )}
            
            <span className="flex items-center mr-4">
              <StarIcon className="h-4 w-4 mr-1" />
              <span>0 stars</span>
            </span>
            
            <span className="flex items-center mr-4">
              <GitForkIcon className="h-4 w-4 mr-1" />
              <span>0 forks</span>
            </span>
            
            <span className="flex items-center mr-4">
              <EyeIcon className="h-4 w-4 mr-1" />
              <span>0 watchers</span>
            </span>
            
            <span className="flex items-center mr-4">
              <GitBranchIcon className="h-4 w-4 mr-1" />
              <span>{repoData.stats?.branches} branch{repoData.stats?.branches !== 1 ? 'es' : ''}</span>
            </span>
            
            <span className="flex items-center mr-4">
              <UsersIcon className="h-4 w-4 mr-1" />
              <span>{repoData.contributors?.length} contributor{repoData.contributors?.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
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

          <TabsContent value="code" className="mt-6">
            <div className="border rounded-md overflow-hidden">
              {/* Branch selector and code navigation */}
              <div className="bg-muted/40 border-b p-3 flex items-center justify-between">
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
                <div className="bg-background border-b p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">
                        {lastCommit.author ? `${lastCommit.author.firstName} ${lastCommit.author.lastName}` : 'Unknown'}
                      </span>
                      <span className="text-muted-foreground">
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
                      <div key={i} className="flex items-center gap-2 mb-2">
                        {i % 2 === 0 ? (
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FolderIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Skeleton className="h-4 w-64" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {fileTree
                      .sort((a, b) => {
                        // Sort directories first, then files
                        if (a.type !== b.type) {
                          return a.type === "directory" ? -1 : 1;
                        }
                        return a.path.localeCompare(b.path);
                      })
                      .map((item, index) => {
                        const pathParts = item.path.split('/');
                        const name = pathParts[pathParts.length - 1];
                        
                        // Only show top-level items
                        if (pathParts.length !== 1) return null;
                        
                        return (
                          <Link 
                            key={index}
                            href={`/${ownerId}/${repoId}/${item.type === 'directory' ? 'tree' : 'blob'}/${defaultBranchName}/${item.path}`}
                            className="flex items-center justify-between p-3 hover:bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              {item.type === 'directory' ? (
                                <FolderIcon className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>{name}</span>
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
          
          <TabsContent value="overview" className="mt-6">
            <div className="border rounded-md p-4">
              <h2 className="text-xl font-semibold mb-3">About</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg mb-1">Owner</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span>{repoData.owner?.firstName} {repoData.owner?.lastName}</span>
                    </div>
                  </div>
                  
                  {repoData.group && (
                    <div>
                      <h3 className="font-medium text-lg mb-1">Group</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span>{repoData.group.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg mb-1">Contributors</h3>
                    <div className="flex flex-wrap gap-2">
                      {repoData.contributors?.map(contributor => (
                        <div key={contributor.userId} className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>{contributor.firstName} {contributor.lastName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-1">Statistics</h3>
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
          
          <TabsContent value="readme" className="mt-6">
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted/40 border-b p-3">
                <h2 className="font-semibold">README.md</h2>
              </div>
              <div className="p-4 bg-background">
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
    </>
  );
}
