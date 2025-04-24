'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  ListTodo
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  dueDate: string | null;
  createdAt: string;
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string;
    username: string;
  } | null;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    username: string;
  };
  projectId: string;
  project: {
    id: string;
    title: string;
  };
}

interface TasksOverviewProps {
  groupId: string;
}

export default function TasksOverview({ groupId }: TasksOverviewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [groupId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${groupId}/tasks`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tasks');
      }

      setTasks(data.tasks || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching tasks', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    
    // If due date is in the past
    if (due < now) {
      return 'overdue';
    }
    
    // If due date is within the next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    if (due <= threeDaysFromNow) {
      return 'soon';
    }
    
    return 'upcoming';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="outline" className="flex items-center gap-1 border-blue-200 text-blue-700"><Clock className="h-3 w-3" />To Do</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="flex items-center gap-1 bg-amber-500"><Clock className="h-3 w-3" />In Progress</Badge>;
      case 'DONE':
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Done</Badge>;
      case 'BLOCKED':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Blocked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const status = getDueDateStatus(dueDate);
    const date = formatDate(dueDate);
    
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {date}</Badge>;
      case 'soon':
        return <Badge className="flex items-center gap-1 bg-amber-500"><Calendar className="h-3 w-3" />Due: {date}</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due: {date}</Badge>;
      default:
        return null;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'todo') return task.status === 'TODO';
    if (activeTab === 'inprogress') return task.status === 'IN_PROGRESS';
    if (activeTab === 'done') return task.status === 'DONE';
    if (activeTab === 'blocked') return task.status === 'BLOCKED';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tasks</h2>
        <Button variant="outline" size="sm" onClick={() => fetchTasks()}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Tasks Found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
                  {activeTab === 'all' 
                    ? "There are no tasks assigned to your group yet."
                    : `There are no tasks with status "${activeTab}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          Part of: <span className="font-medium">{task.project.title}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 justify-end">
                        {getTaskStatusBadge(task.status)}
                        {getDueDateBadge(task.dueDate)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {task.description && (
                      <p className="text-sm mb-4">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap justify-between items-center pt-2 text-sm">
                      <div className="flex items-center gap-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Assigned to:</span>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://avatar.vercel.sh/${task.assignee.username}`} />
                                <AvatarFallback>
                                  {task.assignee.name?.[0] || task.assignee.username[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{task.assignee.name}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        Created by {task.creator.name} on {formatDate(task.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 