"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { CodeTab } from "@/components/repository/code-tab";

// Type definitions
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
  const { data: session } = useSession();
  
  const [repoData, setRepoData] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <CodeTab 
          ownerId={ownerId}
          repoId={repoId}
          defaultBranchName={defaultBranchName}
        />
      </div>
    </div>
  );
}