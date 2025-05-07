'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from '@prisma/client';
import Link from 'next/link';

interface TopProjectsProps {
  limit?: number;
}

export function TopProjects({ limit = 5 }: TopProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProjects = async () => {
      try {
        const response = await fetch(`/api/projects/top?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch top projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching top projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProjects();
  }, [limit]);

  if (loading) {
    return <div>Loading top projects...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Top Projects of the Year</h2>
      <div className="grid gap-4 max-w-3xl mx-auto">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                  {project.isPrivate && (
                    <Badge variant="secondary">Private</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 