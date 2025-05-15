'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Filter, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  profileImageUrl?: string;
}

interface Feedback {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  author: User;
  assignee?: User;
  comments: number;
}

interface ProjectFeedbackProps {
  ownerId: string;
  projectId: string;
}

export function ProjectFeedback({ ownerId, projectId }: ProjectFeedbackProps) {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/feedback`);

        if (!response.ok) {
          throw new Error(`Failed to fetch feedback: ${response.statusText}`);
        }

        const data = await response.json();
        setFeedbackItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
        setFeedbackItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [ownerId, projectId]);

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeedback),
      });

      if (!response.ok) {
        throw new Error(`Failed to create feedback: ${response.statusText}`);
      }

      const createdFeedback = await response.json();
      setFeedbackItems([createdFeedback, ...feedbackItems]);
      setNewFeedback({ title: '', description: '', priority: 'MEDIUM' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating feedback:', error);
      alert(error instanceof Error ? error.message : 'Failed to create feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            Manage feedback, issues, and suggestions for this project.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Feedback</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFeedback} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief title for the feedback"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the feedback"
                  rows={5}
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newFeedback.priority}
                  onChange={(e) => setNewFeedback({ ...newFeedback, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Create Feedback</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="mt-4 text-sm text-muted-foreground">Loading feedback...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : feedbackItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No feedback yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Create feedback to track issues, suggestions, and enhancements for this project.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Feedback
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Tabs defaultValue="all" className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                      <TabsTrigger value="closed">Closed</TabsTrigger>
                    </TabsList>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                  
                  <TabsContent value="all" className="space-y-4 mt-4">
                    {feedbackItems.map((feedback, index) => (
                      <div key={feedback.id || `feedback-${index}`} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{feedback.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>#{feedback.id?.substring(0, 6) || 'unknown'}</span>
                              <span>•</span>
                              <span>
                                Created by {feedback.author?.firstName || ''} {feedback.author?.lastName || ''}
                              </span>
                              <span>•</span>
                              <span>{feedback.createdAt ? format(new Date(feedback.createdAt), 'MMM d, yyyy') : 'unknown date'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(feedback.status || 'OPEN')}>
                              {(feedback.status || 'OPEN').replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(feedback.priority || 'MEDIUM')}>
                              {feedback.priority || 'MEDIUM'}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{feedback.description || 'No description provided'}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>{feedback.comments || 0}</span>
                          </div>
                          {feedback.assignee && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Assigned to:</span>
                              <span className="text-xs font-medium">
                                {feedback.assignee?.firstName || ''} {feedback.assignee?.lastName || ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="open" className="space-y-4 mt-4">
                    {feedbackItems
                      .filter((feedback) => feedback?.status === 'OPEN')
                      .map((feedback, index) => (
                        <div key={feedback.id || `open-feedback-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{feedback.title}</h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>#{feedback.id?.substring(0, 6) || 'unknown'}</span>
                                <span>•</span>
                                <span>
                                  Created by {feedback.author?.firstName || ''} {feedback.author?.lastName || ''}
                                </span>
                                <span>•</span>
                                <span>{feedback.createdAt ? format(new Date(feedback.createdAt), 'MMM d, yyyy') : 'unknown date'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(feedback.status || 'OPEN')}>
                                {(feedback.status || 'OPEN').replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(feedback.priority || 'MEDIUM')}>
                                {feedback.priority || 'MEDIUM'}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-sm">{feedback.description || 'No description provided'}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span>{feedback.comments || 0}</span>
                            </div>
                            {feedback.assignee && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Assigned to:</span>
                                <span className="text-xs font-medium">
                                  {feedback.assignee?.firstName || ''} {feedback.assignee?.lastName || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="in-progress" className="space-y-4 mt-4">
                    {feedbackItems
                      .filter((feedback) => feedback?.status === 'IN_PROGRESS')
                      .map((feedback, index) => (
                        <div key={feedback.id || `in-progress-feedback-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{feedback.title}</h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>#{feedback.id?.substring(0, 6) || 'unknown'}</span>
                                <span>•</span>
                                <span>
                                  Created by {feedback.author?.firstName || ''} {feedback.author?.lastName || ''}
                                </span>
                                <span>•</span>
                                <span>{feedback.createdAt ? format(new Date(feedback.createdAt), 'MMM d, yyyy') : 'unknown date'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(feedback.status || 'OPEN')}>
                                {(feedback.status || 'OPEN').replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(feedback.priority || 'MEDIUM')}>
                                {feedback.priority || 'MEDIUM'}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-sm">{feedback.description || 'No description provided'}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span>{feedback.comments || 0}</span>
                            </div>
                            {feedback.assignee && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Assigned to:</span>
                                <span className="text-xs font-medium">
                                  {feedback.assignee?.firstName || ''} {feedback.assignee?.lastName || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="closed" className="space-y-4 mt-4">
                    {feedbackItems
                      .filter((feedback) => feedback?.status === 'CLOSED')
                      .map((feedback, index) => (
                        <div key={feedback.id || `closed-feedback-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{feedback.title}</h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>#{feedback.id?.substring(0, 6) || 'unknown'}</span>
                                <span>•</span>
                                <span>
                                  Created by {feedback.author?.firstName || ''} {feedback.author?.lastName || ''}
                                </span>
                                <span>•</span>
                                <span>{feedback.createdAt ? format(new Date(feedback.createdAt), 'MMM d, yyyy') : 'unknown date'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(feedback.status || 'OPEN')}>
                                {(feedback.status || 'OPEN').replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(feedback.priority || 'MEDIUM')}>
                                {feedback.priority || 'MEDIUM'}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-sm">{feedback.description || 'No description provided'}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span>{feedback.comments || 0}</span>
                            </div>
                            {feedback.assignee && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Assigned to:</span>
                                <span className="text-xs font-medium">
                                  {feedback.assignee?.firstName || ''} {feedback.assignee?.lastName || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 