"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FileText, Check, Download, Eye, Filter, Search, Calendar, Star, RefreshCw, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface CompletedEvaluation {
  id: string;
  projectTitle: string;
  groupName: string;
  submissionDate: Date;
  evaluationDate: Date;
  score: number;
  category: string;
  feedbackCount: number;
}

export default function CompletedEvaluations() {
  const [evaluations, setEvaluations] = useState<CompletedEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CompletedEvaluation;
    direction: 'ascending' | 'descending';
  } | null>({ key: 'evaluationDate', direction: 'descending' });
  
  useEffect(() => {
    fetchCompletedEvaluations();
  }, []);

  const fetchCompletedEvaluations = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/evaluator/completed-evaluations');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch completed evaluations: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the API data to match our component's expected format
      const transformedEvaluations = data.map((evaluation: any) => ({
        id: evaluation.id,
        projectTitle: evaluation.projectTitle,
        groupName: evaluation.groupName,
        submissionDate: evaluation.submissionDate ? new Date(evaluation.submissionDate) : new Date(),
        evaluationDate: new Date(evaluation.evaluationDate),
        score: evaluation.score || 0,
        category: getEvaluationCategory(evaluation.score || 0),
        feedbackCount: evaluation.criteria?.length || 0
      }));
      
      setEvaluations(transformedEvaluations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching completed evaluations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to categorize evaluations based on score
  const getEvaluationCategory = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const downloadEvaluationReport = async (evaluationId: string) => {
    try {
      const response = await fetch(`/api/evaluator/completed-evaluations/${evaluationId}/download`);
      
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }
      
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluation-report-${evaluationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download report');
      console.error('Error downloading report:', err);
    }
  };

  const handleSort = (key: keyof CompletedEvaluation) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof CompletedEvaluation) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const sortedEvaluations = [...evaluations].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    
    if (a[key] < b[key]) {
      return direction === 'ascending' ? -1 : 1;
    }
    
    if (a[key] > b[key]) {
      return direction === 'ascending' ? 1 : -1;
    }
    
    return 0;
  });

  const filteredEvaluations = sortedEvaluations.filter(evaluation => {
    const matchesSearch = evaluation.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory ? evaluation.category === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(evaluations.map(evaluation => evaluation.category)));

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="ml-2 text-gray-500">Loading completed evaluations...</p>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Evaluations</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchCompletedEvaluations}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Completed Evaluations</CardTitle>
              <CardDescription>
                Review all your completed project evaluations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchCompletedEvaluations}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mt-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search by project or group..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={!selectedCategory ? 'bg-gray-100' : ''}
              >
                All
              </Button>
              {categories.map(category => (
                <Button 
                  key={category}
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-gray-100' : ''}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('projectTitle')} className="cursor-pointer">
                  Project Title {getSortIndicator('projectTitle')}
                </TableHead>
                <TableHead onClick={() => handleSort('groupName')} className="cursor-pointer">
                  Group {getSortIndicator('groupName')}
                </TableHead>
                <TableHead onClick={() => handleSort('category')} className="cursor-pointer">
                  Category {getSortIndicator('category')}
                </TableHead>
                <TableHead onClick={() => handleSort('evaluationDate')} className="cursor-pointer">
                  Evaluation Date {getSortIndicator('evaluationDate')}
                </TableHead>
                <TableHead onClick={() => handleSort('score')} className="cursor-pointer text-right">
                  Score {getSortIndicator('score')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileText className="h-12 w-12 mb-2 text-gray-400" />
                      <p className="font-medium">No completed evaluations found</p>
                      <p className="text-sm">
                        {searchTerm || selectedCategory ? 'Try adjusting your search or filters' : 'You have not completed any evaluations yet'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvaluations.map(evaluation => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.projectTitle}</TableCell>
                    <TableCell>{evaluation.groupName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{evaluation.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(evaluation.evaluationDate)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${getScoreColor(evaluation.score)}`}>
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-4 w-4" fill="currentColor" />
                        {evaluation.score}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>{evaluation.projectTitle}</DialogTitle>
                              <DialogDescription>Evaluation for {evaluation.groupName}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-500">Category</p>
                                  <p className="font-medium">{evaluation.category}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Submission Date</p>
                                  <p className="font-medium">{formatDate(evaluation.submissionDate)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Evaluation Date</p>
                                  <p className="font-medium">{formatDate(evaluation.evaluationDate)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Overall Score</p>
                                  <p className={`font-medium ${getScoreColor(evaluation.score)}`}>{evaluation.score}%</p>
                                </div>
                              </div>

                              <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Evaluation Criteria</h3>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center py-2 border-b">
                                    <div>
                                      <p className="font-medium">Technical Implementation</p>
                                      <p className="text-sm text-gray-500">Quality of code and technical solutions</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">35/40</Badge>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b">
                                    <div>
                                      <p className="font-medium">Innovation & Creativity</p>
                                      <p className="text-sm text-gray-500">Original thinking and problem-solving</p>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">23/25</Badge>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b">
                                    <div>
                                      <p className="font-medium">Documentation</p>
                                      <p className="text-sm text-gray-500">Quality of project documents and reports</p>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">18/20</Badge>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <div>
                                      <p className="font-medium">Presentation</p>
                                      <p className="text-sm text-gray-500">Quality of project presentation and defense</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">16/15</Badge>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-lg font-semibold mb-2">Overall Comments</h3>
                                <div className="p-3 bg-gray-50 rounded-md text-sm">
                                  <p>Excellent project with strong technical implementation. The team demonstrated great problem-solving skills and delivered a robust solution with practical applications. Documentation was thorough and well-structured, making the project easy to understand.</p>
                                  <p className="mt-2">The presentation was exceptional, clearly explaining complex concepts in an accessible way. Minor improvements could be made in error handling for edge cases.</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline"
                                onClick={() => downloadEvaluationReport(evaluation.id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadEvaluationReport(evaluation.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredEvaluations.length > 0 && (
          <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-500">
                Showing {filteredEvaluations.length} of {evaluations.length} evaluations
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Average Score: <span className="font-medium text-blue-600">
                    {(filteredEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / filteredEvaluations.length).toFixed(1)}%
                  </span>
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export All
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 