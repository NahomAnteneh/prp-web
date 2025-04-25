"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Lock, Unlock, GitBranchIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RepositoryProps {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    name?: string;
  };
  defaultBranchRef?: {
    name: string;
  } | null;
}

interface RepositoryListProps {
  repositories: RepositoryProps[];
}

export default function RepositoryList({ repositories }: RepositoryListProps) {
  if (!repositories || repositories.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repositories.map((repo) => (
        <Card key={repo.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                <Link 
                  href={`/${repo.owner.username}/${repo.name}`} 
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {repo.name}
                </Link>
              </CardTitle>
              {repo.isPrivate ? (
                <Badge variant="outline" className="flex gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex gap-1">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Public</span>
                </Badge>
              )}
            </div>
            <CardDescription>
              {repo.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {repo.defaultBranchRef && (
              <div className="flex items-center text-xs text-muted-foreground">
                <GitBranchIcon className="h-3.5 w-3.5 mr-1" />
                <span>Default branch: {repo.defaultBranchRef.name}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>Updated {formatDistanceToNow(new Date(repo.updatedAt))} ago</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 