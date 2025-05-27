'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FileText, Download, Eye, Search, Calendar, Star, RefreshCw, AlertCircle, Info as LucideInfo, ListFilter, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { cn, formatTimeAgo } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EvaluationCriterion {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  comment?: string;
}

interface EvaluationDetails extends CompletedEvaluation {
  criteria: EvaluationCriterion[];
  overallComments: string;
  evaluatorNotes?: string;
}

interface CompletedEvaluation {
  id: string;
  projectTitle: string;
  groupName: string;
  submissionDate?: Date;
  evaluationDate: Date;
  score: number;
  category: string;
}

const fetchEvaluationDetailsAPI = async (evaluationId: string): Promise<EvaluationDetails> => {
  console.log(`Fetching details for evaluation ID: ${evaluationId}`);
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockEvaluations: Record<string, EvaluationDetails> = {
    "1": {
      id: "1",
      projectTitle: "AI Powered Recommendation Engine",
      groupName: "Innovatech Solutions",
      evaluationDate: new Date("2023-05-15T10:00:00Z"),
      score: 92,
      category: "Excellent",
      submissionDate: new Date("2023-05-01T10:00:00Z"),
      criteria: [
        { id: "c1", name: "Technical Implementation & Code Quality", score: 38, maxScore: 40, comment: "Robust backend, clean frontend code. Minor improvements in scalability could be considered." },
        { id: "c2", name: "Innovation & Problem Solving", score: 23, maxScore: 25, comment: "Novel approach to user personalization. Addressed a key market need effectively." },
        { id: "c3", name: "Documentation & Report Quality", score: 18, maxScore: 20, comment: "Comprehensive documentation. Report was well-structured and clear." },
        { id: "c4", name: "Presentation & Viva Voce", score: 13, maxScore: 15, comment: "Confident presentation, handled Q&A well. Visual aids could be slightly more polished." },
      ],
      overallComments: "An outstanding project demonstrating strong technical skills and innovative thinking. The team worked cohesively and delivered a high-quality product. The documentation was thorough, and the presentation was engaging. One of the top projects this year.",
      evaluatorNotes: "Remember to check their GitHub for the final commit regarding the scalability point."
    },
    "2": {
      id: "2",
      projectTitle: "IoT Based Smart Irrigation System",
      groupName: "AgriFuture Tech",
      evaluationDate: new Date("2023-04-20T14:30:00Z"),
      score: 78,
      category: "Good",
      submissionDate: new Date("2023-04-05T14:30:00Z"),
      criteria: [
        { id: "c1", name: "Hardware Integration & Functionality", score: 30, maxScore: 40, comment: "Hardware components integrated well, basic functionality achieved. Some sensor calibration issues noted." },
        { id: "c2", name: "Software & Data Management", score: 20, maxScore: 25, comment: "Software platform is functional. Data visualization is basic but clear." },
        { id: "c3", name: "Project Report & Schematics", score: 15, maxScore: 20, comment: "Report covers the main aspects. Schematics are clear but could have more detail." },
        { id: "c4", name: "System Demo & Q&A", score: 13, maxScore: 15, comment: "Demo was clear. Team answered questions adequately but struggled with some deeper technical points." },
      ],
      overallComments: "A solid project with a practical application. The team successfully integrated hardware and software components to create a functional smart irrigation system. While there are areas for improvement, particularly in sensor accuracy and the depth of the software features, the overall effort is commendable.",
    },
  };
  const details = mockEvaluations[evaluationId];
  if (!details) {
    throw new Error("Evaluation details not found");
  }
  return details;
};

export default function CompletedTab() {
  const [evaluations, setEvaluations] = useState<CompletedEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CompletedEvaluation;
    direction: 'ascending' | 'descending';
  } | null>({ key: 'evaluationDate', direction: 'descending' });

  const [selectedEvaluationDetails, setSelectedEvaluationDetails] = useState<EvaluationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const fetchCompletedEvaluations = useCallback(async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      setError(null);

      const response = await fetch('/api/evaluator/completed-evaluations');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch completed evaluations: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const transformedEvaluations = data.map((evaluation: any) => ({
        id: evaluation.id,
        projectTitle: evaluation.project?.title || 'N/A',
        groupName: evaluation.project?.group?.name || 'N/A',
        submissionDate: evaluation.project?.submissionDate ? new Date(evaluation.project.submissionDate) : undefined,
        evaluationDate: new Date(evaluation.createdAt),
        score: evaluation.score || 0,
        category: getEvaluationCategory(evaluation.score || 0),
      }));
      
      setEvaluations(transformedEvaluations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching completed evaluations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedEvaluations();
  }, [fetchCompletedEvaluations]);

  const handleFetchDetails = useCallback(async (evaluationId: string) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await fetch(`/api/evaluator/completed-evaluations/${evaluationId}/details`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch evaluation details");
      }
      const details = await response.json();
      setSelectedEvaluationDetails(details);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Could not load details.");
      toast.error(err instanceof Error ? err.message : "Could not load details.");
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const getEvaluationCategory = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 60) return 'Needs Improvement';
    if (score > 0) return 'Unsatisfactory';
    return 'Pending';
  };

  const downloadEvaluationReport = useCallback(async (evaluationId: string, projectTitle: string) => {
    toast.info("Generating report...");
    try {
      const response = await fetch(`/api/evaluator/completed-evaluations/${evaluationId}/download-generated-report`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to download report: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeProjectTitle = projectTitle.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 50);
      a.download = `Evaluation_Report_${safeProjectTitle}_${evaluationId.substring(0,8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download report');
      console.error('Error downloading report:', err);
    }
  }, []);

  const handleSort = (key: keyof CompletedEvaluation) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof CompletedEvaluation) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ListFilter className="h-3 w-3 ml-1 text-muted-foreground/70" />;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const sortedEvaluations = useMemo(() => {
    const sortableEvaluations = [...evaluations];
    if (!sortConfig) return sortableEvaluations;
    
    sortableEvaluations.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
      }
      if (valA instanceof Date && valB instanceof Date) {
        return sortConfig.direction === 'ascending' ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();

      if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    return sortableEvaluations;
  }, [evaluations, sortConfig]);

  const uniqueCategories = useMemo(() => 
    Array.from(new Set(evaluations.map(ev => ev.category))).sort()
  , [evaluations]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredEvaluations = useMemo(() => {
    return sortedEvaluations.filter(evaluation => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = evaluation.projectTitle.toLowerCase().includes(searchLower) ||
                           evaluation.groupName.toLowerCase().includes(searchLower);
      
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(evaluation.category);
      
      return matchesSearch && matchesCategory;
    });
  }, [sortedEvaluations, searchTerm, selectedCategories]);

  const getScoreClass = (score: number) => {
    if (score >= 90) return 'text-green-600 font-semibold';
    if (score >= 80) return 'text-sky-600 font-semibold';
    if (score >= 70) return 'text-yellow-600 font-semibold';
    if (score >= 60) return 'text-orange-600 font-semibold';
    if (score > 0) return 'text-red-600 font-semibold';
    return 'text-muted-foreground';
  };

  const formatDate = (date?: Date) => {
    if (!date) return <span className="text-muted-foreground italic">Not set</span>;
    return (
      <time dateTime={date.toISOString()} title={date.toLocaleString()}>
        {date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
      </time>
    );
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center py-12 h-64">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="ml-2 text-muted-foreground">Loading completed evaluations...</p>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Evaluations</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-sm">{error}</p>
          <Button onClick={fetchCompletedEvaluations} variant="outline">
             <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Evaluation History</CardTitle>
              <CardDescription>
                Review details of all your past project evaluations.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCompletedEvaluations}
              disabled={refreshing}
              className="self-start sm:self-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4 pt-4 border-t">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by project title or group name..." 
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 whitespace-nowrap">
                  <ListFilter className="h-4 w-4 mr-2" />
                  Filter by Category ({selectedCategories.size > 0 ? selectedCategories.size : 'All'})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Evaluation Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setSelectedCategories(new Set())} className={cn(selectedCategories.size === 0 && "bg-accent")}>
                    <span className="flex-grow">All Categories</span>
                    {selectedCategories.size === 0 && <Check className="h-4 w-4 ml-2"/>}
                  </DropdownMenuItem>
                  {uniqueCategories.map(category => (
                    <DropdownMenuItem key={category} onClick={() => handleCategoryToggle(category)} className={cn(selectedCategories.has(category) && "bg-accent")}>
                       <span className="flex-grow">{category}</span>
                       {selectedCategories.has(category) && <Check className="h-4 w-4 ml-2"/>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {(!loading && !refreshing && filteredEvaluations.length === 0) ? (
            <div className="py-12 text-center min-h-[200px] flex flex-col justify-center items-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/70 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">No Evaluations Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm || selectedCategories.size > 0 
                  ? 'No evaluations match your current search or filter criteria. Try adjusting them.' 
                  : 'You have not completed any evaluations yet, or they are still being processed.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {([
                    { label: "Project Title", key: "projectTitle" },
                    { label: "Group", key: "groupName" },
                    { label: "Category", key: "category" },
                    { label: "Evaluated On", key: "evaluationDate" },
                    { label: "Score", key: "score", className: "text-right" },
                  ] as { label: string; key: keyof CompletedEvaluation; className?: string }[]).map(header => (
                    <TableHead 
                      key={header.key}
                      onClick={() => handleSort(header.key)}
                      className={cn("cursor-pointer hover:bg-muted/50 transition-colors py-2.5", header.className)}
                    >
                      <div className="flex items-center">
                        {header.label}
                        {getSortIndicator(header.key)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right py-2.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map(evaluation => (
                  <TableRow key={evaluation.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium py-3">{evaluation.projectTitle}</TableCell>
                    <TableCell className="text-muted-foreground py-3">{evaluation.groupName}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant={evaluation.category === 'Excellent' || evaluation.category === 'Good' ? 'default' : 'outline'} 
                             className={cn(
                               evaluation.category === 'Excellent' && 'bg-green-100 text-green-700 border-green-200',
                               evaluation.category === 'Good' && 'bg-sky-100 text-sky-700 border-sky-200',
                               evaluation.category === 'Satisfactory' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
                               evaluation.category === 'Needs Improvement' && 'bg-orange-100 text-orange-700 border-orange-200',
                               evaluation.category === 'Unsatisfactory' && 'bg-red-100 text-red-700 border-red-200',
                               evaluation.category === 'Pending' && 'bg-gray-100 text-gray-700 border-gray-200',
                             )}>
                        {evaluation.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(evaluation.evaluationDate)}
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-right py-3", getScoreClass(evaluation.score))}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Star className="h-4 w-4" fill="currentColor" />
                        {evaluation.score}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex justify-end gap-2">
                        <Dialog onOpenChange={(open) => {
                          if (open) handleFetchDetails(evaluation.id);
                          else {
                            setSelectedEvaluationDetails(null);
                            setDetailsError(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-2.5">
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl w-[95%] max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="text-xl">Evaluation Details: {selectedEvaluationDetails?.projectTitle || evaluation.projectTitle}</DialogTitle>
                              <DialogDescription>For group: {selectedEvaluationDetails?.groupName || evaluation.groupName}</DialogDescription>
                            </DialogHeader>
                            {detailsLoading ? (
                              <div className="flex flex-col items-center justify-center h-64">
                                <Spinner className="h-10 w-10" />
                                <p className="mt-3 text-muted-foreground">Loading details...</p>
                              </div>
                            ) : detailsError ? (
                              <div className="flex flex-col items-center justify-center h-64">
                                <AlertCircle className="h-12 w-12 text-destructive mb-3" />
                                <p className="text-destructive font-medium">Error loading details</p>
                                <p className="text-muted-foreground text-sm text-center">{detailsError}</p>
                                <Button variant="outline" size="sm" onClick={() => handleFetchDetails(evaluation.id)} className="mt-4">
                                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
                                </Button>
                              </div>
                            ) : selectedEvaluationDetails ? (
                              <ScrollArea className="max-h-[calc(80vh-150px)] pr-5 -mr-2 mt-1">
                                <div className="space-y-6 py-4 pr-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Category</p>
                                      <p className="font-medium">{selectedEvaluationDetails.category}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Overall Score</p>
                                      <p className={cn("font-semibold text-lg", getScoreClass(selectedEvaluationDetails.score))}>{selectedEvaluationDetails.score}%</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Evaluation Date</p>
                                      <p className="font-medium">{formatDate(selectedEvaluationDetails.evaluationDate)}</p>
                                    </div>
                                    {selectedEvaluationDetails.submissionDate && (
                                      <div>
                                        <p className="text-muted-foreground">Project Submission Date</p>
                                        <p className="font-medium">{formatDate(selectedEvaluationDetails.submissionDate)}</p>
                                      </div>
                                    )}
                                  </div>

                                  {selectedEvaluationDetails.criteria && selectedEvaluationDetails.criteria.length > 0 && (
                                    <div>
                                      <h4 className="text-md font-semibold mb-3 mt-2 border-b pb-2">Evaluation Criteria</h4>
                                      <div className="space-y-4">
                                        {selectedEvaluationDetails.criteria.map(criterion => (
                                          <div key={criterion.id} className="p-3 rounded-md bg-muted/50">
                                            <div className="flex justify-between items-start mb-1">
                                              <p className="font-medium leading-tight">{criterion.name}</p>
                                              <Badge variant="secondary" className="whitespace-nowrap text-sm">
                                                {criterion.score} / {criterion.maxScore}
                                              </Badge>
                                            </div>
                                            {criterion.comment && <p className="text-xs text-muted-foreground italic whitespace-pre-wrap">Comment: {criterion.comment}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {selectedEvaluationDetails.overallComments && (
                                    <div>
                                      <h4 className="text-md font-semibold mb-2 mt-2 border-b pb-2">Overall Comments</h4>
                                      <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                                        {selectedEvaluationDetails.overallComments}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedEvaluationDetails.evaluatorNotes && (
                                    <div>
                                      <h4 className="text-md font-semibold mb-2 mt-2 border-b pb-2 flex items-center">
                                        <LucideInfo className="h-4 w-4 mr-2 text-blue-500" /> Your Private Notes
                                      </h4>
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 whitespace-pre-wrap">
                                        {selectedEvaluationDetails.evaluatorNotes}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-64">
                                <LucideInfo className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No details available for this evaluation.</p>
                              </div>
                            )}
                            <DialogFooter className="pt-4 mt-4 border-t">
                              <Button 
                                variant="outline"
                                onClick={() => downloadEvaluationReport(evaluation.id, selectedEvaluationDetails?.projectTitle || evaluation.projectTitle)}
                                disabled={detailsLoading || !selectedEvaluationDetails}
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download Report
                              </Button>
                              <DialogClose asChild>
                                <Button variant="ghost">Close</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => downloadEvaluationReport(evaluation.id, evaluation.projectTitle)}
                          title="Download PDF Report"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {(!loading && !refreshing && filteredEvaluations.length > 0 && evaluations.length > 0) && (
          <CardFooter className="border-t px-6 py-3 bg-muted/50">
            <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 text-xs sm:text-sm">
              <div className="text-muted-foreground">
                Showing {filteredEvaluations.length} of {evaluations.length} completed evaluations.
                {selectedCategories.size > 0 || searchTerm ? ` (Filtered)`: ''}
              </div>
              {filteredEvaluations.length > 0 && (
                <div className="text-muted-foreground">
                  Average Score: <span className={cn("font-semibold", getScoreClass(filteredEvaluations.reduce((sum, ev) => sum + ev.score, 0) / filteredEvaluations.length))}>
                    {(filteredEvaluations.reduce((sum, ev) => sum + ev.score, 0) / filteredEvaluations.length).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 