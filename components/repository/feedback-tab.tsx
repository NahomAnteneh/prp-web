"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  PlusIcon, 
  SearchIcon, 
  User, 
  SlidersHorizontal,
  Clock,
  MessageSquare
} from "lucide-react";
import { getRepositoryEndpoints } from "@/config/api";

// Define session user type to match NextAuth.js structure in this project
interface SessionUser {
  userId: string;
  name: string;
  email: string;
  image: string;
  role: string;
}

interface FeedbackAuthor {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface FeedbackEntry {
  id: string;
  title: string;
  content: string;
  status: "OPEN" | "ADDRESSED" | "CLOSED";
  createdAt: string;
  author: FeedbackAuthor;
  repositoryName: string;
  repositoryGroup: string;
  authorId: string;
}

interface FeedbackTabProps {
  ownerId: string;
  repoId: string;
}

export function FeedbackTab({ ownerId, repoId }: FeedbackTabProps) {
  const { data: session } = useSession();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFeedbackTitle, setNewFeedbackTitle] = useState("");
  const [newFeedbackContent, setNewFeedbackContent] = useState("");
  const [showNewFeedbackForm, setShowNewFeedbackForm] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "advisor" | "evaluator">("all");

  // Check if user is advisor or evaluator
  const isAdvisorOrEvaluator = session?.user && 
    (session.user.role === "ADVISOR" || session.user.role === "EVALUATOR" || session.user.role === "ADMINISTRATOR");

  // Fetch feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the mapped endpoints
        const response = await fetch(getRepositoryEndpoints.feedback.list(ownerId, repoId));
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setFeedbacks(data);
      } catch (err) {
        console.error("Failed to fetch feedbacks:", err);
        setError("Failed to load feedback entries");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (ownerId && repoId) {
      fetchFeedbacks();
    }
  }, [ownerId, repoId]);

  const handleCreateFeedback = async () => {
    if (!isAdvisorOrEvaluator) {
      toast.error("Only advisors and evaluators can provide feedback");
      return;
    }
    
    if (!newFeedbackTitle.trim()) {
      toast.error("Please enter a feedback title");
      return;
    }
    
    if (!newFeedbackContent.trim()) {
      toast.error("Please enter feedback content");
      return;
    }
    
    setIsSubmittingFeedback(true);
    
    try {
      // Use the mapped endpoints
      const response = await fetch(getRepositoryEndpoints.feedback.create(ownerId, repoId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newFeedbackTitle,
          content: newFeedbackContent,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }
      
      const newFeedback = await response.json();
      
      // Update the state with the new feedback
      setFeedbacks([newFeedback, ...feedbacks]);
      
      // Reset form
      setNewFeedbackTitle("");
      setNewFeedbackContent("");
      setShowNewFeedbackForm(false);
      
      toast.success("Feedback submitted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };
  
  // New function to update feedback status
  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: "OPEN" | "ADDRESSED" | "CLOSED") => {
    try {
      const response = await fetch(getRepositoryEndpoints.feedback.update(ownerId, repoId, feedbackId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update feedback status");
      }
      
      const updatedFeedback = await response.json();
      
      // Update the feedback in the state
      setFeedbacks(feedbacks.map(f => f.id === feedbackId ? updatedFeedback : f));
      
      toast.success(`Feedback marked as ${newStatus.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update feedback status");
      console.error("Error updating feedback status:", error);
    }
  };

  // Filter feedbacks based on search and source
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = searchQuery === '' || 
      feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = filterStatus === 'all' || 
      (filterStatus === 'advisor' && feedback.author.role === 'ADVISOR') ||
      (filterStatus === 'evaluator' && feedback.author.role === 'EVALUATOR');
    
    return matchesSearch && matchesSource;
  });

  // Count advisor and evaluator feedbacks
  const advisorCount = feedbacks.filter(f => f.author.role === 'ADVISOR').length;
  const evaluatorCount = feedbacks.filter(f => f.author.role === 'EVALUATOR').length;

  if (isLoading) {
    return (
      <div className="border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 flex justify-center">
          <p className="text-muted-foreground">Loading feedbacks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 flex justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      {/* GitHub-style header and filters */}
      <div className="bg-background border-b p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          {/* Tabs for advisor/evaluator */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`flex items-center ${filterStatus === 'all' ? 'font-semibold border-b-2 border-red-500 -mb-px pb-2' : 'text-muted-foreground'}`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>All Feedback</span>
            </button>
            <button 
              onClick={() => setFilterStatus('advisor')}
              className={`flex items-center ${filterStatus === 'advisor' ? 'font-semibold border-b-2 border-red-500 -mb-px pb-2' : 'text-muted-foreground'}`}
            >
              <User className="h-4 w-4 mr-1 text-blue-500" />
              <span>{advisorCount} From Advisors</span>
            </button>
            <button 
              onClick={() => setFilterStatus('evaluator')}
              className={`flex items-center ${filterStatus === 'evaluator' ? 'font-semibold border-b-2 border-red-500 -mb-px pb-2' : 'text-muted-foreground'}`}
            >
              <User className="h-4 w-4 mr-1 text-purple-600" />
              <span>{evaluatorCount} From Evaluators</span>
            </button>
          </div>
          
          {isAdvisorOrEvaluator && (
            <Button 
              onClick={() => setShowNewFeedbackForm(prev => !prev)} 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New feedback</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="bg-muted/30 p-4 border-b flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex-grow relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search all feedback" 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Sort</span>
          </Button>
        </div>
      </div>

      {/* New Feedback Form for Advisors/Evaluators */}
      {showNewFeedbackForm && isAdvisorOrEvaluator && (
        <div className="p-4 border-b bg-background">
          <div className="space-y-4">
            <div>
              <Input 
                placeholder="Title"
                value={newFeedbackTitle}
                onChange={(e) => setNewFeedbackTitle(e.target.value)}
                className="text-base font-medium"
              />
            </div>
            <div>
              <Textarea 
                placeholder="Leave a comment"
                value={newFeedbackContent}
                onChange={(e) => setNewFeedbackContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                <a href="#" className="text-blue-600 hover:underline">Markdown</a> formatting supported
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewFeedbackForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFeedback}
                  disabled={isSubmittingFeedback}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit new feedback'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="divide-y">
        {filteredFeedbacks.length === 0 ? (
          <div className="p-8 text-center">
            {feedbacks.length > 0 ? (
              <>
                <div className="text-xl font-medium mb-2">No results matched your search.</div>
                <p className="text-muted-foreground">
                  Try a different search term or filter.
                </p>
              </>
            ) : (
              <>
                <div className="text-xl font-medium mb-2">No feedback entries yet</div>
                <p className="text-muted-foreground">
                  {isAdvisorOrEvaluator 
                    ? 'You can create the first feedback for this repository.' 
                    : 'Feedback from advisors and evaluators will appear here.'}
                </p>
                {isAdvisorOrEvaluator && (
                  <Button 
                    onClick={() => setShowNewFeedbackForm(true)} 
                    variant="outline"
                    className="mt-4"
                  >
                    Create the first feedback
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          filteredFeedbacks.map(feedback => (
            <div key={feedback.id} className="p-4 hover:bg-muted/10">
              <div className="bg-white border rounded-md overflow-hidden">
                <div className="flex items-center px-4 py-2 bg-muted/20 border-b">
                  <div className="mr-2">
                    {feedback.author.role === "ADVISOR" ? (
                      <User className="h-5 w-5 text-blue-600" />
                    ) : (
                      <User className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <a href={`/users/${feedback.author.userId}`} className="flex items-center gap-2 group">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={feedback.author.email} alt={feedback.author.firstName} />
                      <AvatarFallback>{feedback.author.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-blue-600 group-hover:underline">{feedback.author.firstName}</span>
                  </a>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-blue-100 text-blue-800">
                      {feedback.author.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      commented on {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {feedback.title}
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    {feedback.content}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-muted-foreground">
                      Feedback #{feedback.id.split('-')[1]}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 font-medium rounded-full ${
                        feedback.status === "OPEN" ? "bg-green-100 text-green-800" : 
                        feedback.status === "ADDRESSED" ? "bg-yellow-100 text-yellow-800" : 
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {feedback.status.charAt(0) + feedback.status.slice(1).toLowerCase()}
                      </span>
                      
                      {/* Status update buttons */}
                      {feedback.status === "OPEN" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => handleUpdateFeedbackStatus(feedback.id, "ADDRESSED")}
                        >
                          Mark as Addressed
                        </Button>
                      )}
                      {(feedback.status === "OPEN" || feedback.status === "ADDRESSED") && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => handleUpdateFeedbackStatus(feedback.id, "CLOSED")}
                        >
                          Close
                        </Button>
                      )}
                      {feedback.status === "CLOSED" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => handleUpdateFeedbackStatus(feedback.id, "OPEN")}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 