'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, MessageSquare, Search, ThumbsUp, ThumbsDown, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectFeedbackItem {
  id: string;
  projectName: string;
  groupName: string;
  feedback: string;
  createdAt: string;
  status: 'pending' | 'responded' | 'resolved';
  responseCount: number;
  lastResponseAt: string | null;
  lastResponseBy: string | null;
  projectId: string;
}

interface ProjectFeedbackProps {
  userId: string;
  isOwner?: boolean;
}

export default function ProjectFeedback({ userId, isOwner = false }: ProjectFeedbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeedback, setActiveFeedback] = useState<ProjectFeedbackItem[]>([]);
  const [resolvedFeedback, setResolvedFeedback] = useState<ProjectFeedbackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/evaluator/${userId}/project-feedback`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project feedback');
        }
        
        const data = await response.json();
        
        // Sort feedback by date (newest first)
        const allFeedback = data.feedback || [];
        const sorted = [...allFeedback].sort((a, b) => 
          new Date(b.lastResponseAt || b.createdAt).getTime() - 
          new Date(a.lastResponseAt || a.createdAt).getTime()
        );
        
        // Split into active and resolved feedback
        setActiveFeedback(sorted.filter(item => item.status !== 'resolved'));
        setResolvedFeedback(sorted.filter(item => item.status === 'resolved'));
      } catch (error) {
        console.error('Error fetching project feedback:', error);
        setError('Failed to load feedback data');
        toast.error('Error loading project feedback');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [userId]);

  const filterFeedback = (items: ProjectFeedbackItem[]) => {
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.feedback.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
            <MessageCircle className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      case 'responded':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <ThumbsUp className="mr-1 h-3 w-3" /> Responded
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <ThumbsDown className="mr-1 h-3 w-3" /> Resolved
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Feedback</CardTitle>
          <CardDescription>
            Feedback provided to projects
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
          <CardTitle>Project Feedback</CardTitle>
          <CardDescription>
            Feedback provided to projects
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
        <CardTitle>Project Feedback</CardTitle>
        <CardDescription>
          Feedback you've provided to projects and their responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search feedback..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeFeedback.length === 0 && resolvedFeedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No project feedback found
              </p>
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Active Feedback {activeFeedback.length > 0 && `(${activeFeedback.length})`}
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved {resolvedFeedback.length > 0 && `(${resolvedFeedback.length})`}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4 space-y-4">
                {filterFeedback(activeFeedback).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'No active feedback matches your search' 
                        : 'No active feedback items'}
                    </p>
                  </div>
                ) : (
                  filterFeedback(activeFeedback).map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{item.projectName}</h3>
                          <p className="text-sm text-muted-foreground">Group: {item.groupName}</p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="bg-muted rounded-md p-3 mb-3">
                        <p className="text-sm whitespace-pre-wrap">{item.feedback}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent on {formatDate(item.createdAt)}
                        </p>
                      </div>

                      {item.responseCount > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.responseCount} response{item.responseCount !== 1 ? 's' : ''}</span>
                          {item.lastResponseAt && (
                            <span className="text-xs text-muted-foreground">
                              Latest: {formatDate(item.lastResponseAt)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/feedback/${item.id}`}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {item.status === 'pending' ? 'View Feedback' : 'Reply'}
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`/projects/${item.projectId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View Project</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="resolved" className="mt-4 space-y-4">
                {filterFeedback(resolvedFeedback).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'No resolved feedback matches your search' 
                        : 'No resolved feedback items'}
                    </p>
                  </div>
                ) : (
                  filterFeedback(resolvedFeedback).map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{item.projectName}</h3>
                          <p className="text-sm text-muted-foreground">Group: {item.groupName}</p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <div className="bg-muted rounded-md p-3 mb-3">
                        <p className="text-sm whitespace-pre-wrap">{item.feedback}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent on {formatDate(item.createdAt)}
                        </p>
                      </div>

                      {item.responseCount > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.responseCount} response{item.responseCount !== 1 ? 's' : ''}</span>
                          {item.lastResponseAt && (
                            <span className="text-xs text-muted-foreground">
                              Latest: {formatDate(item.lastResponseAt)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/feedback/${item.id}`}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View History
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`/projects/${item.projectId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View Project</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 