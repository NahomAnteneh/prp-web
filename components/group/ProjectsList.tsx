"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, ExternalLink, Calendar, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import CreateProjectModal from "./CreateProjectModal";

// Validation schema matching server-side createProjectSchema
const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required")
    .max(255, "Project title is too long"),
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional(),
  advisorId: z.string().min(1, "Advisor ID is required").optional(),
});

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  submissionDate: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  group: {
    groupUserName: string;
    name: string;
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
  evaluations: {
    id: string;
    score: number;
    createdAt: string;
  }[];
  feedback: {
    id: string;
    title: string;
    createdAt: string;
    authorId: string;
    status: string;
  }[];
}

interface ProjectResponse {
  projects: Project[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface ProjectsListProps {
  groupUserName: string;
  isLeader: boolean;
}

export default function ProjectsList({ groupUserName, isLeader }: ProjectsListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [projectData, setProjectData] = useState<ProjectResponse>({
    projects: [],
    pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = async (offset: number, limit: number, append: boolean = false) => {
    try {
      setIsLoadingMore(true);
      const url = `/api/groups/${groupUserName}/projects?offset=${offset}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch projects");
      }

      // Ensure data has the expected structure
      const normalizedData: ProjectResponse = {
        projects: Array.isArray(data.projects)
          ? data.projects.slice(0, limit)
          : Array.isArray(data)
            ? data.slice(0, limit)
            : [],
        pagination: data.pagination || {
          total: Array.isArray(data.projects)
            ? data.projects.length
            : Array.isArray(data)
              ? data.length
              : 0,
          limit,
          offset,
          hasMore:
            (Array.isArray(data.projects)
              ? data.projects.length
              : Array.isArray(data)
                ? data.length
                : 0) > offset + limit,
        },
      };

      if (append) {
        setProjectData({
          projects: [...projectData.projects, ...normalizedData.projects],
          pagination: normalizedData.pagination,
        });
      } else {
        setProjectData(normalizedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error fetching projects", {
        description: errorMessage,
      });
      setProjectData({
        projects: [],
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProjects(0, 5); // Fetch only 5 projects initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupUserName]);

  const handleLoadMore = () => {
    if (projectData.pagination.hasMore) {
      const newOffset = projectData.pagination.offset + projectData.pagination.limit;
      fetchProjects(newOffset, projectData.pagination.limit, true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate project summary
  const totalProjects = projectData.projects.length;
  const activeProjects = projectData.projects.filter(
    (p) => p.status.toUpperCase() === "ACTIVE",
  ).length;
  const completedProjects = projectData.projects.filter(
    (p) => p.status.toUpperCase() === "COMPLETED",
  ).length;

  // Helper function to get appropriate color for status badge
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" /> Projects
          </CardTitle>
          <CardDescription>Loading projects...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading projects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Summary */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-3">Project Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-background border border-blue-500 rounded">
            <h3 className="font-medium">Total Projects</h3>
            <p className="text-2xl">{totalProjects}</p>
          </div>
          <div className="p-4 bg-background border border-blue-500 rounded">
            <h3 className="font-medium">Active Projects</h3>
            <p className="text-2xl">{activeProjects}</p>
          </div>
          <div className="p-4 bg-background border border-blue-500 rounded">
            <h3 className="font-medium">Completed Projects</h3>
            <p className="text-2xl">{completedProjects}</p>
          </div>
        </div>
      </section>

      {/* Project List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" /> Projects
              </CardTitle>
              <CardDescription>
                {isLeader ? "Your group's current and past projects" : "Current and past projects"}
              </CardDescription>
            </div>
            {isLeader && (
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                New Project
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {projectData.projects.length === 0 ? (
            <div className="text-center py-6">
              <p className="mb-4 text-muted-foreground">
                {isLeader
                  ? "Your group hasn't started any projects yet."
                  : "This group hasn't started any projects yet."}
              </p>
              {isLeader && (
                <Button onClick={() => setShowCreateModal(true)}>
                  Create New Project
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {projectData.projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-lg border hover:border-primary transition-colors overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-lg font-semibold">
                            <Link
                              href={`/groups/${project.group.groupUserName}/projects/${project.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {project.title}
                            </Link>
                          </h3>
                          <Badge className={`${getStatusColor(project.status)} border`}>
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Group: {project.group.groupUserName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Advisor: {project.advisor ? project.advisor.name : "None"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Last updated: {formatDate(project.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Stats: {project.stats.tasks} tasks, {project.stats.evaluations} evaluations
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/${project.group.groupUserName}/projects/${project.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" /> View Project
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {projectData.pagination.hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>

        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          groupUserName={groupUserName}
          onProjectCreated={() => fetchProjects(0, 5)}
        />
      </Card>
    </div>
  );
}
