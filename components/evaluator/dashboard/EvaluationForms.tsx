"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, Download, Upload, Edit, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface EvaluationForm {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  criteria: {
    id: string;
    name: string;
    weight: number;
    description: string;
  }[];
  status: 'draft' | 'published' | 'completed';
  completionPercentage?: number;
}

export default function EvaluationForms() {
  const [forms, setForms] = useState<EvaluationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState('published');
  const [refreshing, setRefreshing] = useState(false);

  const [editingCriteria, setEditingCriteria] = useState({
    id: '',
    score: 0,
    comments: '',
  });

  useEffect(() => {
    fetchEvaluationForms();
  }, []);

  const fetchEvaluationForms = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/evaluator/evaluation-forms');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation forms: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the dates in the response
      const transformedForms = data.map((form: any) => ({
        ...form,
        deadline: new Date(form.deadline),
      }));
      
      setForms(transformedForms);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching evaluation forms:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const submitEvaluationForm = async (formId: string, formData: any) => {
    try {
      const response = await fetch(`/api/evaluator/evaluation-forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit evaluation: ${response.statusText}`);
      }
      
      toast.success('Evaluation submitted successfully');
      fetchEvaluationForms(); // Refresh forms after submission
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit evaluation');
      console.error('Error submitting evaluation:', err);
    }
  };

  const getFormStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Draft</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Published</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
      default:
        return null;
    }
  };

  const filteredForms = forms.filter(form => {
    if (activeFormTab === 'published') return form.status === 'published';
    if (activeFormTab === 'completed') return form.status === 'completed';
    if (activeFormTab === 'draft') return form.status === 'draft';
    return true;
  });

  const handleSubmitEvaluation = (formId: string) => {
    // Prepare form data - this would be replaced with actual form values
    const formData = {
      criteria: [
        { id: 'crit-1', score: 8, comments: 'Good implementation' },
        // Add more criteria evaluations as needed
      ],
      overallComments: 'Project shows strong technical implementation.'
    };
    
    submitEvaluationForm(formId, formData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="ml-2 text-gray-500">Loading evaluation forms...</p>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Forms</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchEvaluationForms}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Evaluation Forms</CardTitle>
              <CardDescription>
                Standardized forms for evaluating different aspects of student projects
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchEvaluationForms} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="published" value={activeFormTab} onValueChange={setActiveFormTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <Card key={form.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium">{form.title}</h3>
                        {getFormStatusBadge(form.status)}
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{form.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          <span>Deadline: {form.deadline.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{form.criteria.length} Evaluation Criteria</span>
                        </div>
                      </div>
                      
                      {form.status === 'published' && form.completionPercentage !== undefined && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Completion</span>
                            <span className="text-sm text-gray-500">{form.completionPercentage}%</span>
                          </div>
                          <Progress value={form.completionPercentage} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-end p-4 bg-gray-50 border-t md:border-t-0 md:border-l">
                      {form.status === 'published' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="default" className="mb-2 w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Fill Form
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>{form.title}</DialogTitle>
                              <DialogDescription>{form.description}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                              {form.criteria.map((criterion) => (
                                <div key={criterion.id} className="space-y-2 border-b pb-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <Label className="text-base font-semibold">{criterion.name}</Label>
                                      <p className="text-sm text-gray-500">{criterion.description}</p>
                                      <p className="text-xs text-gray-400">Weight: {criterion.weight}%</p>
                                    </div>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                      Score: {editingCriteria.id === criterion.id ? editingCriteria.score : 0}/10
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Poor</span>
                                        <span>Excellent</span>
                                      </div>
                                      <Input 
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        defaultValue="0"
                                        onChange={(e) => {
                                          setEditingCriteria({
                                            id: criterion.id,
                                            score: parseInt(e.target.value),
                                            comments: editingCriteria.comments,
                                          });
                                        }}
                                        className="w-full"
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor={`comments-${criterion.id}`} className="text-sm">
                                        Comments
                                      </Label>
                                      <Textarea 
                                        id={`comments-${criterion.id}`}
                                        placeholder="Provide specific feedback on this criterion"
                                        className="mt-1"
                                        onChange={(e) => {
                                          setEditingCriteria({
                                            id: criterion.id,
                                            score: editingCriteria.score,
                                            comments: e.target.value,
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="space-y-2">
                                <Label htmlFor="overall-comments" className="text-base font-semibold">
                                  Overall Comments
                                </Label>
                                <Textarea 
                                  id="overall-comments"
                                  placeholder="Provide overall feedback on the project"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">Save Draft</Button>
                              <Button 
                                type="submit" 
                                onClick={() => handleSubmitEvaluation(form.id)}
                              >
                                Submit Evaluation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button variant="outline" className="mb-2 w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      
                      {form.status === 'completed' && (
                        <Button variant="ghost" className="w-full text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredForms.length === 0 && (
                <div className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No evaluation forms</h3>
                  <p className="text-sm text-gray-500">
                    {activeFormTab === 'draft' ? 'You have no draft forms' : 
                     activeFormTab === 'completed' ? 'You have not completed any forms yet' : 
                     'No published forms available at the moment'}
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 