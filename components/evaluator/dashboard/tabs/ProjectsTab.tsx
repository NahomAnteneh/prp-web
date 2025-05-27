'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // For marking as complete
import { Label } from '@/components/ui/label'; // Added import for Label
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Eye, Edit3, MessageSquare, CheckSquare, Search, Filter, AlertCircle, RefreshCw, Info, Star, XCircle, CalendarDays, AlertTriangle as LucideAlertTriangle, ChevronDown, ChevronUp, Send } from 'lucide-react'; // Renamed AlertTriangle to avoid potential conflicts
import { formatDistanceToNowStrict } from 'date-fns'; // For relative dates
import { cn } from '@/lib/utils'; // Added import for cn

interface AssignedProject {
  id: string;
  title: string;
  groupName: string;
  groupUserName: string; // For API calls
  submissionDate: string; // ISO string date
  status: 'PENDING_EVALUATION' | 'IN_PROGRESS' | 'EVALUATION_COMPLETED' | 'FEEDBACK_PROVIDED';
  currentScore?: number | null;
  feedbackSummary?: string | null;
  evaluationLink?: string;
}

// Remove mock fetchAssignedProjectsAPI
// const fetchAssignedProjectsAPI = async (): Promise<AssignedProject[]> => { ... };

export default function ProjectsTab() {
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingEvaluationId, setIsSubmittingEvaluationId] = useState<string | null>(null); // Track which project is submitting
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // State for the collapsible evaluation form
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [evaluationScore, setEvaluationScore] = useState<number | string>('');
  const [evaluationReason, setEvaluationReason] = useState('');

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // const data = await fetchAssignedProjectsAPI(); // Remove mock
      const response = await fetch('/api/evaluator/assigned-projects');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load assigned projects');
      }
      const data: AssignedProject[] = await response.json();
      setProjects(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      setError(msg);
      toast.error('Error Loading Projects', { description: msg });
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleToggleExpand = (projectId: string, project: AssignedProject) => {
    if (expandedRowId === projectId) {
      setExpandedRowId(null); // Collapse if already open
    } else {
      setExpandedRowId(projectId);
      // Pre-fill form if editing, or clear if it's a new evaluation context for this project
      setEvaluationScore(project.currentScore ?? ''); 
      setEvaluationReason(project.feedbackSummary ?? '');
    }
  };

  const handleSubmitInlineEvaluation = async (project: AssignedProject) => {
    const score = Number(evaluationScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Invalid Score', { description: 'Score must be between 0 and 100.' });
      return;
    }
    if (!evaluationReason.trim()) {
      toast.error('Reason Required', { description: 'Please provide a reason for the evaluation.' });
      return;
    }

    setIsSubmittingEvaluationId(project.id);
    try {
      const response = await fetch(
        `/api/groups/${project.groupUserName}/projects/${project.id}/evaluation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: score,
            comments: evaluationReason,
          }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message || 'Evaluation submitted successfully!');
        setExpandedRowId(null); // Collapse on successful submission
        fetchProjects(); // Refresh projects list
      } else {
        toast.error('Submission Failed', { description: result.error || 'Could not submit evaluation.' });
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      toast.error('Submission Error', { description: err instanceof Error ? err.message : 'An unexpected error occurred.' });
    } finally {
      setIsSubmittingEvaluationId(null);
    }
  };

  const filteredProjects = projects
    .filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(p => statusFilter === 'all' || p.status === statusFilter);

    const getStatusBadgeVariant = (status: AssignedProject['status']) => {
      switch (status) {
        case 'PENDING_EVALUATION': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        case 'IN_PROGRESS': return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case 'FEEDBACK_PROVIDED': return "bg-purple-100 text-purple-800 hover:bg-purple-200";
        case 'EVALUATION_COMPLETED': return "bg-green-100 text-green-800 hover:bg-green-200";
        default: return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      }
    };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner className="h-8 w-8" /> <span className="ml-2">Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-2" />
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={fetchProjects} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Assigned Projects for Evaluation</CardTitle>
                <CardDescription>Manage and submit your evaluations for assigned projects.</CardDescription>
            </div>
            <Button onClick={fetchProjects} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or group..." 
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING_EVALUATION">Pending Evaluation</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="FEEDBACK_PROVIDED">Feedback Provided</SelectItem>
              <SelectItem value="EVALUATION_COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead> {/* For expand icon */}
              <TableHead>Project Title</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <Fragment key={project.id}>
                  <TableRow>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleExpand(project.id, project)}>
                        {expandedRowId === project.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.groupName}</TableCell>
                    <TableCell>{formatDistanceToNowStrict(new Date(project.submissionDate), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <Badge className={cn(getStatusBadgeVariant(project.status), "text-xs")}>{project.status.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Removed old DialogTrigger button, actions now in collapsible section or here if needed */}
                      {/* Example: View details button if still needed */}
                      {/* <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> Details</Button> */}
                      {project.evaluationLink && (
                         <Button variant="outline" size="sm" asChild>
                           <a href={project.evaluationLink} target="_blank" rel="noopener noreferrer">
                             <Eye className="mr-1 h-4 w-4" /> View Submission
                           </a>
                         </Button>
                       )}
                    </TableCell>
                  </TableRow>
                  {expandedRowId === project.id && (
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-4 space-y-4">
                          <h4 className="text-md font-semibold">Submit Evaluation for: {project.title}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1 space-y-1.5">
                              <Label htmlFor={`score-${project.id}`}>Score (0-100)</Label>
                              <Input 
                                id={`score-${project.id}`}
                                type="number"
                                placeholder="e.g., 85"
                                value={evaluationScore}
                                onChange={(e) => setEvaluationScore(e.target.value)}
                                min={0}
                                max={100}
                              />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                              <Label htmlFor={`reason-${project.id}`}>Reason / Overall Feedback</Label>
                              <Textarea 
                                id={`reason-${project.id}`}
                                placeholder="Provide a detailed reason for your evaluation and any overall feedback..."
                                value={evaluationReason}
                                onChange={(e) => setEvaluationReason(e.target.value)}
                                rows={4}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button 
                                onClick={() => handleSubmitInlineEvaluation(project)}
                                disabled={isSubmittingEvaluationId === project.id}
                            >
                              {isSubmittingEvaluationId === project.id && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                              {isSubmittingEvaluationId === project.id ? 'Submitting...' : 'Submit Evaluation'}
                              {!(isSubmittingEvaluationId === project.id) && <Send className="ml-2 h-4 w-4"/>}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No projects match your current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {/* Dialog component for editing project details can be removed if this new UI is preferred */}
      {/* {editingProject && ( <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}> ... </Dialog> )} */}
    </Card>
  );
} 