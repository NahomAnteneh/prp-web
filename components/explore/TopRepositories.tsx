'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

// Updated interface based on standardized API response
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
    groupUserName?: string;
  };
  stats: {
    commits: number;
    branches: number;
    projects: number;
  };
}

interface TopRepositoriesProps {
  limit?: number;
}

export function TopRepositories({ limit = 5 }: TopRepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopRepositories = async () => {
      try {
        const response = await fetch(`/api/repositories/top?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch top repositories');
        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error('Error fetching top repositories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRepositories();
  }, [limit]);

  if (loading) {
    return <div>Loading top repositories...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Top Repositories</h2>
      <div className="grid gap-4 max-w-3xl mx-auto">
        {repositories.map((repo) => (
          <Link href={`/${repo.groupUserName}/${repo.name}`} key={`${repo.groupUserName}-${repo.name}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{repo.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {repo.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-center">
                  {repo.isPrivate && (
                    <Badge variant="secondary">Private</Badge>
                  )}
                  <Badge variant="outline">
                    {repo.group.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {repo.lastActivity}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 