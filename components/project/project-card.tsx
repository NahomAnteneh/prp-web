'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, ExternalLink, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  submissionDate: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  group: {
    id: string;
    name: string;
    groupUserName: string;
  };
  advisor: {
    id: string;
    name: string;
  } | null;
  stats: {
    tasks: number;
    repositories: number;
    evaluations: number;
    feedback: number;
  };
}

interface ProjectCardProps {
  project: Project;
  ownerId: string;
}

export default function ProjectCard({ project, ownerId }: ProjectCardProps) {
  // Helper function to get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/${ownerId}/projects/${project.id}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">{project.title}</CardTitle>
            <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
              {project.status}
            </Badge>
          </div>
          <CardDescription>
            {project.description ? (
              project.description.length > 160 
                ? `${project.description.substring(0, 160)}...` 
                : project.description
            ) : "No description available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {project.advisor && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Advisor: {project.advisor.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created: {formatDate(project.createdAt)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Folder className="mr-1 h-4 w-4" />
            <span>{project.stats.repositories} {project.stats.repositories === 1 ? 'Repository' : 'Repositories'}</span>
          </div>
          <div className="flex items-center">
            <ExternalLink className="h-3 w-3 mr-1" />
            <span>View Project</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 