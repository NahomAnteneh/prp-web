"use client";

import Link from "next/link";
import { GitBranchIcon, GitForkIcon, StarIcon, EyeIcon, BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { RepositoryNav } from "./repository-nav";
import { useState, useEffect } from "react";
import type { Session } from "next-auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Navbar from "../student/navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RepositoryHeaderProps {
  owner: string;
  repository: string;
  session: Session | null;
}

interface RepositoryOverview {
  name: string;
  groupUserName: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    name: string;
    leaderId: string;
  };
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
                className="hover:underline flex items-center gap-1"
                prefetch={true}
              >
                <svg viewBox="0 0 16 16" width="16" height="16" className="fill-current">
                  <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path>
                </svg>
                <span>{owner}</span>
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
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">Private</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <BellIcon className="h-4 w-4" />
                  <span>Watch</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <GitForkIcon className="h-4 w-4" />
                  <span>Fork</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <StarIcon className="h-4 w-4" />
                  <span>Star</span>
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    <span>Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <BellIcon className="h-4 w-4 mr-2" />
                    <span>Watch</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <GitForkIcon className="h-4 w-4 mr-2" />
                    <span>Fork</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <StarIcon className="h-4 w-4 mr-2" />
                    <span>Star</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="mt-3">
            <RepositoryNav owner={owner} repository={repository} />
          </div>
        </Container>
      </div>
    </header>
  );
}