'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, MessageCircle, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Feedback {
  id: string;
  content: string;
  createdAt: string;
  projectId: string;
  project: {
    id: string;
    title: string;
  };
  authorId: string;
  author: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  mergeRequestId?: string | null;
  mergeRequest?: {
    id: string;
    title: string;
  } | null;
}

interface FeedbackListProps {
  groupId: string;
}

export default function FeedbackList({ groupId }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, [groupId]);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${groupId}/feedback`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch feedback');
      }

      setFeedback(data.feedback || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching feedback', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading feedback...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Feedback</h2>
        <Button variant="outline" size="sm" onClick={fetchFeedback}>
          Refresh
        </Button>
      </div>

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Feedback Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
              Your group hasn&apos;t received any feedback yet from advisors or evaluators.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-2 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${item.author.username}`} />
                      <AvatarFallback>
                        {item.author.name?.[0] || item.author.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{item.author.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {item.author.role}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.createdAt)} at {formatTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      Project: {item.project.title}
                    </Badge>
                    
                    {item.mergeRequest && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {item.mergeRequest.title}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{item.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 