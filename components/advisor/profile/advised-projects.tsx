"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Clock, FileText, Tag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  adviseeNames: string[];
  startDate: string;
  endDate?: string;
  tags: string[];
}

interface AdvisedProjectsProps {
  userId: string;
  isOwner?: boolean;
}

export default function AdvisedProjects({ userId, isOwner = false }: AdvisedProjectsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed" | "archived">("all");

  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}/advised-projects`);
        if (!response.ok) {
          throw new Error("Failed to fetch advised projects");
        }
        const data = await response.json();
        setProjects(data);
        setFilteredProjects(data);
      } catch (error) {
        console.error("Error fetching advised projects:", error);
        toast.error("Failed to load advised projects");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [userId]);

  useEffect(() => {
    // Filter based on search query and active filter
    let result = projects;
    
    // Apply status filter
    if (activeFilter === "active") {
      result = result.filter(project => project.status === "ACTIVE");
    } else if (activeFilter === "completed") {
      result = result.filter(project => project.status === "COMPLETED");
    } else if (activeFilter === "archived") {
      result = result.filter(project => project.status === "ARCHIVED");
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(project => 
        project.title.toLowerCase().includes(query) || 
        project.description.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        project.adviseeNames.some(name => name.toLowerCase().includes(query))
      );
    }
    
    setFilteredProjects(result);
  }, [searchQuery, activeFilter, projects]);

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Completed</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Present";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Advised Projects
        </CardTitle>
        <CardDescription>
          Research and academic projects supervised by this advisor
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects by title, description, or tags..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === "active" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("active")}
            >
              Active
            </Button>
            <Button 
              variant={activeFilter === "completed" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("completed")}
            >
              Completed
            </Button>
            <Button 
              variant={activeFilter === "archived" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("archived")}
            >
              Archived
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-6 w-20 bg-muted rounded" />
                </div>
                <div className="h-12 bg-muted rounded mt-4" />
                <div className="flex justify-between mt-4">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`}
                className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">{project.title}</h3>
                  {getStatusBadge(project.status)}
                </div>
                
                <p className="text-muted-foreground mt-2 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {project.tags.slice(0, 5).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.tags.length - 5} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                  
                  <div>
                    <span>Advisees: </span>
                    <span className="font-medium">
                      {project.adviseeNames.length > 0 
                        ? project.adviseeNames.slice(0, 2).join(", ") + (project.adviseeNames.length > 2 ? ` +${project.adviseeNames.length - 2} more` : '')
                        : 'None'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
            {isOwner && (
              <Button className="mt-4" asChild>
                <Link href="/projects/new">Add a New Project</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 