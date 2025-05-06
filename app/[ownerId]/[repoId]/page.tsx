"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FileIcon, FolderIcon, GitBranchIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

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

export default function MainRepoPage() {
  const params = useParams<{ ownerId: string; repoId: string }>();
  const { ownerId, repoId } = params;
  
  const [repoData, setRepoData] = useState<Repository | null>(null);
  const [readme, setReadme] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch (err) {
        console.error("Error fetching repository data:", err);
        setError("Failed to load repository data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [ownerId, repoId]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-5 w-3/4" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="p-4 text-red-600">
        {error || "Failed to load repository"}
      </div>
    );
  }

  const defaultBranchName = repoData.defaultBranch?.name || "main";

  return (
    <div className="p-4 space-y-6">
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
            {repoData.stats.branches} branch{repoData.stats.branches !== 1 ? 'es' : ''}
          </span>
          
          <span className="flex items-center mr-4">
            <UsersIcon className="h-4 w-4 mr-1" />
            {repoData.contributors.length} contributor{repoData.contributors.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-3">Repository Content</h2>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center">
              <GitBranchIcon className="h-4 w-4 mr-2" />
              <span className="font-medium">{defaultBranchName}</span>
            </div>
            
            <Link
              href={`/${ownerId}/${repoId}/tree/${defaultBranchName}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Browse Files
            </Link>
          </div>
          
          <div className="p-4">
            <div className="flex items-center text-sm mb-2">
              <FolderIcon className="h-4 w-4 mr-2 text-amber-500" />
              <Link 
                href={`/${ownerId}/${repoId}/tree/${defaultBranchName}`}
                className="hover:underline text-blue-600"
              >
                Root
              </Link>
            </div>
            
            <div className="flex items-center text-sm">
              <FileIcon className="h-4 w-4 mr-2 text-blue-500" />
              <Link 
                href={`/${ownerId}/${repoId}/blob/${defaultBranchName}/README.md`}
                className="hover:underline text-blue-600"
              >
                README.md
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {readme && (
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-3">README</h2>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="prose max-w-full">
              {/* Here you would render Markdown, but for simplicity we'll just show it as text */}
              <pre className="whitespace-pre-wrap">{readme}</pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-3">About</h2>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Owner</h3>
              <p>{repoData.owner.firstName} {repoData.owner.lastName}</p>
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
                {repoData.contributors.map(contributor => (
                  <li key={contributor.userId}>
                    {contributor.firstName} {contributor.lastName}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
