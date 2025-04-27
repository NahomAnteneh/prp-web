"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Clock } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export interface FeedbackAuthor {
  name: string;
  avatarUrl: string;
}

export interface FeedbackTag {
  name: string;
  color: string;
}

export interface FeedbackComment {
  id: string;
  body: string;
  createdAt: string;
  author: FeedbackAuthor;
}

export interface FeedbackDetail {
  id: string;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  author: FeedbackAuthor;
  tags: FeedbackTag[];
  comments: FeedbackComment[];
}

interface FeedbackClientProps {
  owner: string;
  repository: string;
  feedbackNumber: number;
}

export function FeedbackClient({
  owner,
  repository,
  feedbackNumber,
}: FeedbackClientProps) {
  const [feedbackData, setFeedbackData] = useState<FeedbackDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/feedbacks/${feedbackNumber}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch feedback: ${response.statusText}`);
        }
        
        const data = await response.json();
        setFeedbackData(data);
      } catch (err) {
        console.error("Error fetching feedback data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeedbackData();
  }, [feedbackNumber]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load feedback: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{feedbackData.title}</h1>
          <Badge variant={feedbackData.state === "open" ? "default" : "secondary"}>
            {feedbackData.state}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <img
              src={feedbackData.author.avatarUrl}
              alt={feedbackData.author.name}
              className="h-5 w-5 rounded-full"
            />
            <span>{feedbackData.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              opened{" "}
              {formatDistanceToNow(new Date(feedbackData.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{feedbackData.comments.length} comments</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {feedbackData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {feedbackData.tags.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              style={{ backgroundColor: `#${tag.color}20` }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="prose dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {feedbackData.body}
          </Markdown>
        </div>
      </div>

      {/* Comments */}
      {feedbackData.comments.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Comments</h2>
          {feedbackData.comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.name}
                  className="h-8 w-8 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{comment.author.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {comment.body}
                </Markdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
