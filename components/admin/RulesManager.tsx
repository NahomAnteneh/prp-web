'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { CalendarIcon, Save, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Rules {
  maxGroupSize: number;
  advisorRequestDeadline: string;
  projectSubmissionDeadline: string;
}

export default function RulesManager() {
  const [rules, setRules] = useState<Rules | null>(null);
  const [maxGroupSize, setMaxGroupSize] = useState<number>(5);
  const [advisorRequestDeadline, setAdvisorRequestDeadline] = useState<Date | undefined>(undefined);
  const [projectSubmissionDeadline, setProjectSubmissionDeadline] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rules');
      const data = await response.json();
      
      if (response.ok) {
        setRules(data);
        setMaxGroupSize(data.maxGroupSize);
        setAdvisorRequestDeadline(new Date(data.advisorRequestDeadline));
        setProjectSubmissionDeadline(new Date(data.projectSubmissionDeadline));
      } else {
        throw new Error(data.error || 'Failed to fetch rules');
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRules = async () => {
    if (!advisorRequestDeadline || !projectSubmissionDeadline) {
      toast({
        title: 'Validation Error',
        description: 'All deadline fields are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Determine if we need to create or update rules
      const endpoint = rules ? '/api/rules/admin' : '/api/rules/admin';
      const method = rules ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxGroupSize,
          advisorRequestDeadline: advisorRequestDeadline.toISOString(),
          projectSubmissionDeadline: projectSubmissionDeadline.toISOString(),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `System rules ${rules ? 'updated' : 'created'} successfully.`,
        });
        fetchRules(); // Refresh the rules
      } else {
        throw new Error(data.error || `Failed to ${rules ? 'update' : 'create'} rules`);
      }
    } catch (error) {
      console.error('Error saving rules:', error);
      toast({
        title: 'Error',
        description: `Failed to save system rules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading system rules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Rules</CardTitle>
        <CardDescription>
          Configure global system rules and deadlines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
              <Input
                id="maxGroupSize"
                type="number"
                min="1"
                max="20"
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                The maximum number of students allowed in a project group
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="advisorRequestDeadline">Advisor Request Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="advisorRequestDeadline"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {advisorRequestDeadline ? (
                      format(advisorRequestDeadline, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={advisorRequestDeadline}
                    onSelect={setAdvisorRequestDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Deadline for students to request project advisors
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectSubmissionDeadline">Project Submission Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="projectSubmissionDeadline"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {projectSubmissionDeadline ? (
                      format(projectSubmissionDeadline, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={projectSubmissionDeadline}
                    onSelect={setProjectSubmissionDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Final deadline for project submissions
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={fetchRules}
              disabled={isLoading || isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSaveRules}
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 