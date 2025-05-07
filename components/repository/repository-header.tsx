"use client";

import Link from "next/link";
import { GitBranchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { RepositoryNav } from "./repository-nav";
import { useState, useEffect } from "react";
import type { Session } from "next-auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Navbar from "../student/navbar";

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Navbar />
      
      <div className="border-t border-foreground/10 bg-muted/40">
        <Container className="py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center text-lg font-medium">
              <Link
                href={`/${owner}`}
                className="hover:underline"
                prefetch={true}
              >
                {owner}
              </Link>
              <span className="mx-1">/</span>
              <Link
                href={`/${owner}/${repository}`}
                className="hover:underline font-semibold"
                prefetch={true}
              >
                {repository}
              </Link>
              {repoData?.isPrivate && (
                <Badge variant="outline" className="ml-2">Private</Badge>
              )}
            </div>
            
            {!isLoading && repoData && repoData.description && (
              <div className="text-sm text-muted-foreground max-w-xl">
                {repoData.description}
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <RepositoryNav owner={owner} repository={repository} />
          </div>
        </Container>
      </div>
    </header>
  );
}