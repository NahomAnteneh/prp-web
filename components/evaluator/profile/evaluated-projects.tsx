'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Download, Eye, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EvaluatedProject {
  id: string;
  projectName: string;
  groupName: string;
  completedDate: string;
  score: number;
  status: 'completed' | 'archived';
  reportUrl?: string;
}

interface EvaluatedProjectsProps {
  userId: string;
  isOwner?: boolean;
}

export default function EvaluatedProjects({ userId, isOwner = false }: EvaluatedProjectsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [evaluatedProjects, setEvaluatedProjects] = useState<EvaluatedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluatedProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/evaluator/${userId}/evaluated-projects`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch evaluated projects');
        }
        
        const data = await response.json();
        setEvaluatedProjects(data.evaluatedProjects || []);
      } catch (error) {
        console.error('Error fetching evaluated projects:', error);
        setError('Failed to load evaluated projects');
        toast.error('Error loading evaluation history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluatedProjects();
  }, [userId]);

  const downloadReport = async (projectId: string, projectName: string) => {
    try {
      toast.info('Downloading evaluation report...');
      const response = await fetch(`/api/evaluator/reports/${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '_')}_Evaluation_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const filteredProjects = evaluatedProjects.filter(project => {
    // Apply search filter
    const matchesSearch = 
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.groupName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
          <CardDescription>
            Previously evaluated projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-60 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
          <CardDescription>
            Previously evaluated projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation History</CardTitle>
        <CardDescription>
          Previously evaluated projects and their outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by project or group name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No projects match your search criteria' 
                  : 'No evaluated projects found'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>{project.groupName}</TableCell>
                      <TableCell>{new Date(project.completedDate).toLocaleDateString()}</TableCell>
                      <TableCell>{project.score.toFixed(1)}</TableCell>
                      <TableCell>
                        {project.status === 'completed' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle className="mr-1 h-3 w-3" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            <Clock className="mr-1 h-3 w-3" /> Archived
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.location.href = `/evaluation/${project.id}/view`}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          {project.reportUrl && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => downloadReport(project.id, project.projectName)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 