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
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
  Loader2,
  Plus,
  Timer,
  User,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface GroupMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  assigneeId?: string;
  assignee?: GroupMember;
  creatorId: string;
  creator: GroupMember;
}

interface ProjectTasksProps {
  ownerId: string;
  projectId: string;
}

export function ProjectTasks({ ownerId, projectId }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createError, setCreateError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    assigneeId: '',
    deadline: '',
  });

  // Fetch tasks and members in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [tasksResponse, membersResponse] = await Promise.all([
          fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks`),
          fetch(`/api/groups/${ownerId}/members`)
        ]);

        if (!tasksResponse.ok) {
          throw new Error(`Failed to fetch tasks: ${tasksResponse.statusText}`);
        }

        if (!membersResponse.ok) {
          throw new Error(`Failed to fetch group members: ${membersResponse.statusText}`);
        }

        const tasksData = await tasksResponse.json();
        const membersData = await membersResponse.json();

        setTasks(tasksData.tasks || []);
        setGroupMembers(membersData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ownerId, projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTask(true);
    setCreateError('');
    
    try {
      // Format deadline properly
      const deadline = newTask.deadline ? new Date(newTask.deadline).toISOString() : undefined;

      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          deadline,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create task: ${response.statusText}`);
      }

      const data = await response.json();
      setTasks([data.task, ...tasks]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        deadline: '',
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  ) => {
    try {
      // Optimistically update UI
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } : task)));

      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update task: ${response.statusText}`);
      }
      
      // Task update already handled optimistically
    } catch (error) {
      console.error('Error updating task:', error);
      // Refresh tasks to ensure correct state
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    }
  };

  // Helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'DONE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  const isTaskOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && new Date(deadline).getTime() !== 0;
  };

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return 'Unassigned';
    const assignee = groupMembers.find((member) => member.userId === assigneeId);
    return assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unknown';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Task components
  const TaskItem = ({ task }: { task: Task }) => {
    return (
      <div className="group border rounded-lg p-4 hover:border-primary/50 transition-all hover:bg-accent/5">
        <div className="flex justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm flex items-center">
              <span className="truncate mr-2">{task.title}</span>
              {isTaskOverdue(task.deadline) && task.status !== 'DONE' && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  Overdue
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{getAssigneeName(task.assigneeId)}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
          </div>
        </div>
        
        {task.description && (
          <p className="mt-3 text-sm line-clamp-2 text-muted-foreground">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDate(task.deadline)}
            </span>
            {task.status === 'DONE' && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                Completed {formatDate(task.updatedAt)}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status !== 'DONE' && task.status !== 'IN_PROGRESS' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
              >
                <Timer className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            {task.status !== 'DONE' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleUpdateTaskStatus(task.id, 'DONE')}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
            {task.status !== 'BLOCKED' && task.status !== 'DONE' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleUpdateTaskStatus(task.id, 'BLOCKED')}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Block
              </Button>
            )}
            {task.status === 'BLOCKED' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleUpdateTaskStatus(task.id, 'TODO')}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Unblock
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TaskList = ({ tasks }: { tasks: Task[] }) => {
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg bg-background/50">
          <p className="text-sm text-muted-foreground">No tasks found</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    );
  };

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
        <ClipboardList className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium">No tasks yet</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        Create tasks to track work items and assign them to team members.
      </p>
      <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create First Task
      </Button>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
          <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="mt-4 text-sm text-red-500">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Please try again later or contact support if the problem persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription className="mt-1">
                Create and manage tasks for this project
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                  {createError && (
                    <div className="flex items-center p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{createError}</span>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Task description"
                      rows={3}
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask({ ...newTask, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })
                        }
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assign To</Label>
                    <select
                      id="assignee"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTask.assigneeId}
                      onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {groupMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isCreatingTask}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingTask}>
                      {isCreatingTask ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Task'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>
      
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="todo">To Do</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="blocked">Blocked</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>

              <TabsContent value="all">
                <TaskList tasks={tasks} />
              </TabsContent>

              <TabsContent value="todo">
                <TaskList tasks={tasks.filter((task) => task.status === 'TODO')} />
              </TabsContent>

              <TabsContent value="in-progress">
                <TaskList tasks={tasks.filter((task) => task.status === 'IN_PROGRESS')} />
              </TabsContent>

              <TabsContent value="completed">
                <TaskList tasks={tasks.filter((task) => task.status === 'DONE')} />
              </TabsContent>

              <TabsContent value="blocked">
                <TaskList tasks={tasks.filter((task) => task.status === 'BLOCKED')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
