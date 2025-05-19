'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckSquare, ExternalLink, Eye, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface Evaluation {
  id: string;
  projectName: string;
  groupName: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'awaiting_submission' | 'ready_for_evaluation';
  progress: number;
}

interface CurrentEvaluationsProps {
  userId: string;
  isOwner?: boolean;
}

export default function CurrentEvaluations({ userId, isOwner = false }: CurrentEvaluationsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentEvaluations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/evaluator/${userId}/current-evaluations`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch current evaluations');
        }
        
        const data = await response.json();
        setEvaluations(data.evaluations || []);
      } catch (error) {
        console.error('Error fetching current evaluations:', error);
        setError('Failed to load current evaluations');
        toast.error('Error loading current evaluations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentEvaluations();
  }, [userId]);

  const filteredEvaluations = evaluations.filter(evaluation => 
    evaluation.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evaluation.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'awaiting_submission':
        return 'Awaiting Submission';
      case 'ready_for_evaluation':
        return 'Ready for Evaluation';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'awaiting_submission':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'ready_for_evaluation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getDueDateStatus = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return { text: 'Overdue', color: 'text-red-500' };
    } else if (daysUntilDue === 0) {
      return { text: 'Due today', color: 'text-orange-500' };
    } else if (daysUntilDue <= 3) {
      return { text: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`, color: 'text-yellow-500' };
    } else {
      return { text: new Date(dueDate).toLocaleDateString(), color: 'text-green-500' };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Evaluations</CardTitle>
          <CardDescription>
            Projects currently assigned for evaluation
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
          <CardTitle>Current Evaluations</CardTitle>
          <CardDescription>
            Projects currently assigned for evaluation
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
        <CardTitle>Current Evaluations</CardTitle>
        <CardDescription>
          Projects currently assigned for evaluation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by project or group name..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredEvaluations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchQuery 
                  ? 'No evaluations match your search criteria' 
                  : 'No current evaluations found'}
              </p>
              {isOwner && !searchQuery && (
                <p className="mt-4 text-sm text-muted-foreground">
                  You have no projects assigned for evaluation at this time.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.map((evaluation) => {
                    const dueStatus = getDueDateStatus(evaluation.dueDate);
                    
                    return (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.projectName}</TableCell>
                        <TableCell>{evaluation.groupName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={dueStatus.color}>{dueStatus.text}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(evaluation.status)}>
                            {getStatusLabel(evaluation.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={evaluation.progress} className="h-2 w-full" />
                            <span className="text-muted-foreground text-xs w-10 text-right">
                              {evaluation.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => window.location.href = `/evaluator/dashboard/evaluation/${evaluation.id}`}
                            >
                              {evaluation.status === 'ready_for_evaluation' ? (
                                <>
                                  <CheckSquare className="mr-2 h-4 w-4" />
                                  Evaluate
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(`/projects/${evaluation.id}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Open Project</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 