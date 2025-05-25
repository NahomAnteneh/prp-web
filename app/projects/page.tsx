"use client";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Mock data (replace with API/database fetch)
const projects = [
  { id: 1, title: "AI-Based Traffic System", status: "Active", updatedAt: "2025-05-15" },
  { id: 2, title: "Solar Energy Monitor", status: "Active", updatedAt: "2025-05-10" },
  { id: 3, title: "E-Health Platform", status: "Completed", updatedAt: "2025-04-20" },
  { id: 4, title: "Smart Agriculture App", status: "Active", updatedAt: "2025-05-18" },
  { id: 5, title: "Blockchain Voting System", status: "Completed", updatedAt: "2025-03-30" },
];

export default function Projects() {
  // In a real app, fetch projects from an API or database
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const completedProjects = projects.filter((p) => p.status === "Completed").length;

  return (
    <Container className="py-12 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">All Projects</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          View all your final-year projects, including active and completed projects, on the PRP platform at Bahir Dar University’s Institute of Technology (BiT).
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-foreground mb-3">Project Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-background border rounded">
            <h3 className="font-medium">Total Projects</h3>
            <p className="text-2xl">{totalProjects}</p>
          </div>
          <div className="p-4 bg-background border rounded">
            <h3 className="font-medium">Active Projects</h3>
            <p className="text-2xl">{activeProjects}</p>
          </div>
          <div className="p-4 bg-background border rounded">
            <h3 className="font-medium">Completed Projects</h3>
            <p className="text-2xl">{completedProjects}</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-6">Project List</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  <strong>Status:</strong> {project.status}
                </p>
                <p className="text-muted-foreground">
                  <strong>Last Updated:</strong> {project.updatedAt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="text-center">
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/student/dashboard.tsx">Back to Dashboard</Link>
        </Button>
      </div>
    </Container>
  );
}