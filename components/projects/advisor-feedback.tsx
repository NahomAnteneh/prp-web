'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

interface AdvisorFeedbackProps {
  ownerId: string;
  projectId: string;
  onFeedbackComplete: () => void;
}

export function AdvisorFeedback({ ownerId, projectId, onFeedbackComplete }: AdvisorFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'project' | 'repository'>('project');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [repositories, setRepositories] = useState<{ name: string; groupUserName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/repositories`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      
      const data = await response.json();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories', {
        description: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchRepositories();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your feedback');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter feedback content');
      return;
    }

    if (activeTab === 'repository' && !selectedRepository) {
      toast.error('Please select a repository');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const endpoint = activeTab === 'project'
        ? `/api/groups/${ownerId}/projects/${projectId}/feedback`
        : `/api/groups/${ownerId}/repositories/${selectedRepository}/feedback`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          projectId: activeTab === 'repository' ? projectId : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      toast.success('Feedback submitted', {
        description: 'Your feedback has been submitted successfully.'
      });
      
      setIsOpen(false);
      onFeedbackComplete();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback', {
        description: error instanceof Error ? error.message : 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Provide Feedback</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Provide Advisor Feedback</DialogTitle>
          <DialogDescription>
            Share your feedback on the project or specific repository.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="project" 
          className="w-full" 
          onValueChange={(value) => setActiveTab(value as 'project' | 'repository')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Project Feedback
            </TabsTrigger>
            <TabsTrigger value="repository" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Repository Feedback
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="project" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Feedback Title</Label>
              <Input
                id="project-title"
                placeholder="Enter a title for your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-feedback">Feedback Content</Label>
              <Textarea
                id="project-feedback"
                placeholder="Provide detailed feedback on the project..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none"
                rows={6}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="repository" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="repository-select">Select Repository</Label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading repositories...
                </div>
              ) : repositories.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No repositories found for this project
                </div>
              ) : (
                <Select 
                  value={selectedRepository} 
                  onValueChange={setSelectedRepository}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.name} value={repo.name}>
                        {repo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repo-title">Feedback Title</Label>
              <Input
                id="repo-title"
                placeholder="Enter a title for your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!selectedRepository}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repo-feedback">Feedback Content</Label>
              <Textarea
                id="repo-feedback"
                placeholder="Provide detailed feedback on the repository..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none"
                rows={6}
                disabled={!selectedRepository}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitFeedback} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 