"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Filter,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatTimeAgo } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  projectTitle: string;
  groupName: string;
  content: string;
  status: 'OPEN' | 'ADDRESSED' | 'CLOSED';
  createdAt: Date;
  responses: {
    id: string;
    content: string;
    author: {
      name: string;
      role: string;
      initials: string;
    };
    createdAt: Date;
  }[];
}

export default function ProjectFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newResponses, setNewResponses] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/evaluator/project-feedback');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the data format to match our component
      const transformedFeedbacks = data.map((item: any) => ({
        id: item.id,
        projectTitle: item.targetName || 'Untitled Project',
        groupName: item.groupName || 'Unknown Group',
        content: item.content,
        status: item.status,
        createdAt: new Date(item.createdAt),
        responses: item.responses?.map((response: any) => ({
          ...response,
          createdAt: new Date(response.createdAt),
        })) || [],
      }));
      
      setFeedbacks(transformedFeedbacks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendFeedbackResponse = async (feedbackId: string, content: string) => {
    try {
      const response = await fetch(`/api/evaluator/project-feedback/${feedbackId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send response: ${response.statusText}`);
      }
      
      const updatedFeedback = await response.json();
      
      // Update the feedbacks state with the updated feedback
      setFeedbacks(prevFeedbacks => 
        prevFeedbacks.map(feedback => 
          feedback.id === feedbackId ? {
            ...feedback,
            content: updatedFeedback.content,
            status: updatedFeedback.status,
            responses: [
              ...feedback.responses,
              ...(updatedFeedback.responses || []).map((response: any) => ({
                ...response,
                createdAt: new Date(response.createdAt),
              })),
            ],
          } : feedback
        )
      );
      
      // Clear the response input
      setNewResponses({
        ...newResponses,
        [feedbackId]: ''
      });
      
      toast.success('Response sent successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send response');
      console.error('Error sending response:', err);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: 'OPEN' | 'ADDRESSED' | 'CLOSED') => {
    try {
      const response = await fetch(`/api/evaluator/project-feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      
      const updatedFeedback = await response.json();
      
      // Update the feedbacks state with the updated feedback
      setFeedbacks(prevFeedbacks => 
        prevFeedbacks.map(feedback => 
          feedback.id === feedbackId ? {
            ...feedback,
            status: updatedFeedback.status,
          } : feedback
        )
      );
      
      toast.success(`Feedback marked as ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  const handleResponseChange = (feedbackId: string, value: string) => {
    setNewResponses({
      ...newResponses,
      [feedbackId]: value
    });
  };
  
  const handleSendResponse = (feedbackId: string) => {
    if (!newResponses[feedbackId] || newResponses[feedbackId].trim() === '') return;
    sendFeedbackResponse(feedbackId, newResponses[feedbackId]);
  };
  
  const handleStatusChange = (feedbackId: string, status: 'OPEN' | 'ADDRESSED' | 'CLOSED') => {
    updateFeedbackStatus(feedbackId, status);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Open</span>;
      case 'ADDRESSED':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Addressed</span>;
      case 'CLOSED':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Closed</span>;
      default:
        return null;
    }
  };
  
  // Apply filters and search
  const filteredFeedbacks = feedbacks
    .filter(feedback => !activeFilter || feedback.status === activeFilter)
    .filter(feedback => 
      !searchQuery || 
      feedback.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="ml-2 text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Feedback</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchFeedbacks}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Project Feedback</CardTitle>
              <CardDescription>
                Provide feedback and respond to questions about student projects
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchFeedbacks}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search feedbacks..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveFilter(null)} 
              className={activeFilter === null ? 'bg-gray-100' : ''}
            >
              All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveFilter('OPEN')} 
              className={activeFilter === 'OPEN' ? 'bg-yellow-100' : ''}
            >
              Open
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveFilter('ADDRESSED')} 
              className={activeFilter === 'ADDRESSED' ? 'bg-blue-100' : ''}
            >
              Addressed
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveFilter('CLOSED')} 
              className={activeFilter === 'CLOSED' ? 'bg-green-100' : ''}
            >
              Closed
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium">No feedback found</h3>
              <p className="text-sm text-gray-500">
                {activeFilter ? `There are no ${activeFilter.toLowerCase()} feedback items.` : 
                 searchQuery ? 'No results match your search criteria.' :
                 'No feedback has been provided yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFeedbacks.map(feedback => (
                <Card key={feedback.id} className="border-l-4 overflow-hidden" style={{
                  borderLeftColor: feedback.status === 'OPEN' ? '#fef08a' : 
                                   feedback.status === 'ADDRESSED' ? '#bfdbfe' : '#bbf7d0'
                }}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{feedback.projectTitle}</CardTitle>
                        <CardDescription>Group: {feedback.groupName}</CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        {getStatusBadge(feedback.status)}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(feedback.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1 pb-0">
                    <div className="mb-4">
                      <p className="mb-2">{feedback.content}</p>
                      <div className="flex gap-2 items-center text-sm text-gray-500">
                        <MessageSquare className="h-4 w-4" />
                        <span>{feedback.responses.length} {feedback.responses.length === 1 ? 'response' : 'responses'}</span>
                      </div>
                    </div>
                    
                    {feedback.responses.length > 0 && (
                      <div className="border-t pt-3 space-y-3">
                        {feedback.responses.map(response => (
                          <div key={response.id} className="flex gap-3 pb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={response.author.role === 'Student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                {response.author.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <div>
                                  <span className="font-medium text-sm">{response.author.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">{response.author.role}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(response.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{response.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {feedback.status !== 'CLOSED' && (
                      <div className="border-t pt-3 pb-2">
                        <div className="flex gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-purple-100 text-purple-800">
                              DE
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea 
                              placeholder="Add your response..."
                              value={newResponses[feedback.id] || ''}
                              onChange={(e) => handleResponseChange(feedback.id, e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <div className="flex justify-between mt-2">
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleStatusChange(feedback.id, 'CLOSED')}
                                  className="text-green-600"
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Mark as Closed
                                </Button>
                                {feedback.status === 'ADDRESSED' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleStatusChange(feedback.id, 'OPEN')}
                                    className="text-yellow-600"
                                  >
                                    <ThumbsDown className="h-4 w-4 mr-1" />
                                    Reopen
                                  </Button>
                                )}
                              </div>
                              <Button 
                                onClick={() => handleSendResponse(feedback.id)}
                                disabled={!newResponses[feedback.id] || newResponses[feedback.id].trim() === ''}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        {filteredFeedbacks.length > 0 && (
          <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                Showing {filteredFeedbacks.length} of {feedbacks.length} feedback items
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 