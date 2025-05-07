"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileIcon, FolderIcon, GitBranchIcon, UsersIcon, Code, InfoIcon, BookOpenIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/student/navbar";
import Footer from "@/components/student/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { useSession } from "next-auth/react";
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
        <div>
          <h1 className="text-3xl font-bold mb-2">{repoData.name}</h1>
          <p className="text-muted-foreground">{repoData.description}</p>
          
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            {repoData.isPrivate ? (
              <span className="flex items-center mr-4">
                <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded">Private</span>
              </span>
            ) : (
              <span className="flex items-center mr-4">
                <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded">Public</span>
              </span>
            )}
            
            <span className="flex items-center mr-4">
              <GitBranchIcon className="h-4 w-4 mr-1" />
              {repoData.stats?.branches} branch{repoData.stats?.branches !== 1 ? 'es' : ''}
            </span>
            
            <span className="flex items-center mr-4">
              <UsersIcon className="h-4 w-4 mr-1" />
              {repoData.contributors?.length} contributor{repoData.contributors?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
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
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-3">Repository Content</h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ExplorerView
                  fileTree={fileTree}
                  fileData={fileData}
                  isLoading={isFileTreeLoading}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="mt-6">
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-3">About</h2>
              <div className="bg-white shadow rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Owner</h3>
                    <p>{repoData.owner?.firstName} {repoData.owner?.lastName}</p>
                  </div>
                  
                  {repoData.group && (
                    <div>
                      <h3 className="font-medium mb-2">Group</h3>
                      <p>{repoData.group.name}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium mb-2">Contributors</h3>
                    <ul className="list-disc list-inside">
                      {repoData.contributors?.map(contributor => (
                        <li key={contributor.userId}>
                          {contributor.firstName} {contributor.lastName}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="readme" className="mt-6">
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-3">README</h2>
              <div className="bg-white shadow rounded-lg p-4">
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
