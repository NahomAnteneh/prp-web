"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranchIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { useState, useEffect } from "react";
import type { Session } from "next-auth";
import { Badge } from "@/components/ui/badge";
import Navbar from "../student/navbar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  lastActivity: string;
  ownerId: string;
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
  branches?: any[];
  contributors?: any[];
}

export function RepositoryHeader({
  owner,
  repository,
  session,
}: RepositoryHeaderProps) {
  const [repoData, setRepoData] = useState<RepositoryOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

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

  // Navigation tabs - simplified to only Code, Feedback, and Settings
  const tabs = [
    { name: "Code", path: `/${owner}/${repository}`, value: "code" },
    { name: "Feedback", path: `/${owner}/${repository}/feedback`, value: "feedback" },
    { name: "Settings", path: `/${owner}/${repository}/settings`, value: "settings" },
  ];

  // Determine active tab value
  const getActiveTabValue = () => {
    if (pathname === `/${owner}/${repository}` || 
        pathname.startsWith(`/${owner}/${repository}/tree`) ||
        pathname.startsWith(`/${owner}/${repository}/blob`)) {
      return "code";
    }
    if (pathname.startsWith(`/${owner}/${repository}/feedback`)) {
      return "feedback";
    }
    if (pathname.startsWith(`/${owner}/${repository}/settings`)) {
      return "settings";
    }
    return "code"; // Default
  };

  return (
    <header className="w-full bg-background border-b border-border/40">
      <Navbar />
      
      <div className="bg-background">
        <Container className="py-3">
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
              <Badge variant="outline" className="ml-2 bg-amber-100/40 text-amber-800 hover:bg-amber-100/40">Private</Badge>
            )}
          </div>
          
          <div className="mt-4 w-full border-b">
            <Tabs defaultValue={getActiveTabValue()} className="w-full">
              <TabsList className="w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    onClick={() => window.location.href = tab.path}
                    className="relative px-1 py-1"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </Container>
      </div>
    </header>
  );
} 