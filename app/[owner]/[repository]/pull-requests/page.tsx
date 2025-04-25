"use client";

import { Suspense, useState, useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { StateFilter } from "@/components/state-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import React from "react";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
  searchParams: Promise<{
    state?: "open" | "closed" | "all";
    search?: string;
  }>;
}

interface PullRequest {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'MERGED';
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    username: string;
  };
  sourceBranch: {
    id: string;
    name: string;
  };
  targetBranch: {
    id: string;
    name: string;
  };
  reviewCount: number;
  reviewers: Array<{
    id: string;
    name: string | null;
    username: string;
  }>;
}

export default function Page({ params, searchParams }: PageProps) {
  const resolvedParams = React.use(params);
  const resolvedSearchParams = React.use(searchParams);
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pull Requests</h1>
        <div className="flex items-center gap-4">
          <SearchBar placeholder="Search pull requests..." />
          <StateFilter
            value={resolvedSearchParams.state ?? "open"}
            onChange={(value) => {
              // Update URL with new state
              const url = new URL(window.location.href);
              url.searchParams.set("state", value);
              window.history.pushState({}, "", url.toString());
            }}
          />
        </div>
      </div>

      <Suspense fallback={<div>Loading pull requests...</div>}>
        <PullRequestsList
          owner={resolvedParams.owner}
          repository={resolvedParams.repository}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    </div>
  );
}

function PullRequestsList({
  owner,
  repository,
  searchParams,
}: {
  owner: string;
  repository: string;
  searchParams: {
    state?: "open" | "closed" | "all";
    search?: string;
  };
}) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPullRequests() {
      try {
        setLoading(true);
        // Convert the UI state to API state
        const apiState = searchParams.state === 'closed' ? 'CLOSED' : 
                         searchParams.state === 'all' ? 'ALL' : 'OPEN';
        
        const response = await fetch(
          `/api/repositories/${owner}/${repository}/pull-requests?status=${apiState}` + 
          (searchParams.search ? `&search=${encodeURIComponent(searchParams.search)}` : '')
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch pull requests');
        }
        
        const data = await response.json();
        setPullRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching pull requests:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPullRequests();
  }, [owner, repository, searchParams.state, searchParams.search]);

  if (loading) {
    return <div className="text-center p-4">Loading pull requests...</div>;
  }
  
  if (error) {
    return <div className="text-center text-red-500 p-4">Error: {error}</div>;
  }

  if (pullRequests.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No pull requests found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Branches</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Reviews</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pullRequests.map((pr) => (
            <TableRow key={pr.id}>
              <TableCell>
                <Link
                  href={`/${owner}/${repository}/pull-requests/${pr.id}`}
                  className="font-medium hover:underline"
                >
                  {pr.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={pr.status === "OPEN" ? "default" : "secondary"}>
                  {pr.status === 'OPEN' ? 'Open' : 
                   pr.status === 'MERGED' ? 'Merged' : 'Closed'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <span className="block">{pr.sourceBranch.name}</span>
                  <span className="block text-muted-foreground">→ {pr.targetBranch.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{pr.creator.name || pr.creator.username}</span>
                </div>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(pr.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>{pr.reviewCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
