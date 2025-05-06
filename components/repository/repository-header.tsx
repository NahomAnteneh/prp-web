"use client";

import Link from "next/link";
import { Menu, Github, GitGraph, GitBranchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepositoryNav } from "./repository-nav";
import ShallowLink from "@/components/shallow-link";
import { useState, useEffect } from "react";
import type { Session } from "next-auth";

interface RepositoryHeaderProps {
  owner: string;
  repository: string;
  session: Session | null;
}

interface RepositoryOverview {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
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
  isOwner: boolean;
}

export function RepositoryHeader({
  owner,
  repository,
  session,
}: RepositoryHeaderProps) {
  const [repoData, setRepoData] = useState<RepositoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepositoryData = async () => {
      try {
        setIsLoading(true);
        // Assuming there's a group ID in the URL structure
        // This would need to be adjusted based on your actual routing structure
        const response = await fetch(`/api/groups/${owner}/repositories/${repository}/overview`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch repository data");
        }
        
        const data = await response.json();
        setRepoData(data);
      } catch (error) {
        console.error("Error fetching repository data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositoryData();
  }, [owner, repository]);

  return (
    <header className="border-b bg-background border-foreground/20">
      <div className="border-b flex justify-between h-12">
        <Link
          className="p-4 border-r bg-transparent rounded-none hover:bg-foreground hover:text-background cursor-pointer flex items-center justify-center gap-2 transition-all w-32"
          href={"/"}
          prefetch={true}
        >
          <GitBranchIcon className="h-4 w-4 text-[#f0883e]" />
          <span className="text-sm font-medium">gitfaster</span>
        </Link>

        <div className="font-mono text-sm flex">
          <div className="flex items-center justify-center p-4 border-x">
            Hi, {session?.user.name}
          </div>
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-center py-4 gap-2">
          <div className="flex items-center text-md">
            {owner}
            <span className="mx-1">/</span>
            <Link
              href={`/${owner}/${repository}`}
              className="hover:underline text-foreground"
              prefetch={true}
            >
              {repository}
            </Link>
          </div>
        </div>
        {/* Navigation tabs - now using the client component */}
        <RepositoryNav owner={owner} repository={repository} />
      </div>
    </header>
  );
}