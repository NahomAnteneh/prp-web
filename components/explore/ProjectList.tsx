"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  advisor?: {
    id: string;
    name: string;
    username: string;
    profileInfo?: {
      expertise?: string[];
    };
  };
  members?: {
    userId: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
  }[];
}

export default function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <div className="flex items-center gap-2">
          <select className="bg-background border rounded-md px-2 py-1 text-sm">
            <option value="recent">Recently Updated</option>
            <option value="stars">Most Popular</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-xl font-medium text-muted-foreground">No projects found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-lg">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                    {project.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                {project.advisor && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Advisor:</span>
                    <div className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`https://avatar.vercel.sh/${project.advisor.username}`} />
                        <AvatarFallback>{project.advisor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{project.advisor.name}</span>
                    </div>
                  </div>
                )}
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Members:</span>
                    <div className="flex -space-x-1">
                      {project.members.slice(0, 3).map((member) => (
                        <Avatar key={member.userId} className="h-5 w-5 border-2 border-background">
                          <AvatarImage src={`https://avatar.vercel.sh/${member.user.username}`} />
                          <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.members.length > 3 && (
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 