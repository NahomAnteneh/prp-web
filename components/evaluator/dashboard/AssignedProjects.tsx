"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, FileText, MessageSquare, CalendarClock, AlertCircle } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface Project {
  id: string;
  title: string;
  groupName: string;
  status: 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' | 'ARCHIVED';
  submissionDate: Date | null;
  lastUpdated: Date;
}

export default function AssignedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  const fetchAssignedProjects = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/evaluator/assigned-projects');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch assigned projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the dates in the response
      const transformedProjects = data.map((project: any) => ({
        ...project,
        submissionDate: project.submissionDate ? new Date(project.submissionDate) : null,
        lastUpdated: new Date(project.lastUpdated),
      }));
      
      setProjects(transformedProjects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching assigned projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-500">Active</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-yellow-500">Submitted</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'ARCHIVED':
        return <Badge className="bg-gray-500">Archived</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="ml-2 text-gray-500">Loading assigned projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Projects</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAssignedProjects}>Try Again</Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Projects Assigned</h3>
        <p className="text-gray-600 mb-4">You don't have any projects assigned for evaluation yet.</p>
        <Button variant="outline" onClick={fetchAssignedProjects}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold">Assigned Projects</CardTitle>
              <CardDescription>
                Projects assigned to you for evaluation. Click on a project to view details and provide evaluations.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAssignedProjects}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Title</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.groupName}</TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>
                    {project.submissionDate ? (
                      <div className="flex items-center gap-1">
                        <CalendarClock className="h-4 w-4 text-gray-500" />
                        {project.submissionDate.toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not submitted yet</span>
                    )}
                  </TableCell>
                  <TableCell>{formatTimeAgo(project.lastUpdated)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {project.status === 'SUBMITTED' && (
                        <Button variant="default" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Evaluate
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Feedback
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              Showing {projects.length} projects
            </div>
            <Button variant="outline" size="sm">
              View All Projects
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 