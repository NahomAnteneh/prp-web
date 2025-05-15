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
  User
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
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: string;
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
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    deadline: ''
  });

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks`);

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }

        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [ownerId, projectId]);

  // Fetch group members
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const response = await fetch(`/api/groups/${ownerId}/members`);

        if (!response.ok) {
          throw new Error(`Failed to fetch group members: ${response.statusText}`);
        }

        const data = await response.json();
        setGroupMembers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching group members:', error);
        setGroupMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchGroupMembers();
  }, [ownerId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      const createdTask = await response.json();
      setTasks([createdTask, ...tasks]);
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        deadline: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      alert(error instanceof Error ? error.message : 'Failed to update task');
    }
  };

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
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
    }
  };

  const isTaskOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).getTime() !== 0;
  };

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return 'Unassigned';
    const assignee = groupMembers.find(member => member.userId === assigneeId);
    return assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'No date set';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            Create and manage tasks for this project
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
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
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assign To</Label>
                <select
                  id="assignee"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newTask.assigneeId}
                  onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {!isLoadingMembers && groupMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Create tasks to track work items and assign them to team members.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="todo">To Do</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                
                <TabsContent value="all" className="space-y-4 mt-4">
                  {tasks.map((task, index) => (
                    <div key={task.id || `task-${index}`} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium flex items-center">
                            {task.title}
                            {isTaskOverdue(task?.deadline || '') && task.status !== 'COMPLETED' && (
                              <span className="inline-flex ml-2 items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Overdue
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Assigned to: {getAssigneeName(task?.assigneeId)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(task?.status || 'TODO')}>
                            {task?.status || 'TODO'}
                          </Badge>
                          <Badge className={getPriorityColor(task?.priority || 'MEDIUM')}>
                            {task?.priority || 'MEDIUM'}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-2 text-sm line-clamp-2">{task.description || 'No description'}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task?.deadline || '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {formatDate(task?.createdAt || '')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {task.status !== 'COMPLETED' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          {task.status === 'TODO' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                            >
                              <Timer className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="todo" className="space-y-4 mt-4">
                  {tasks
                    .filter((task) => task?.status === 'TODO')
                    .map((task, index) => (
                      <div key={task.id || `todo-task-${index}`} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium flex items-center">
                              {task.title}
                              {isTaskOverdue(task?.deadline || '') && (
                                <span className="inline-flex ml-2 items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                  Overdue
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Assigned to: {getAssigneeName(task?.assigneeId)}</span>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(task?.priority || 'MEDIUM')}>
                            {task?.priority || 'MEDIUM'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm line-clamp-2">{task.description || 'No description'}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task?.deadline || '')}
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                          >
                            <Timer className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(task => task?.status === 'TODO').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm text-muted-foreground">No to-do tasks</p>
                      </div>
                    )}
                </TabsContent>
                
                <TabsContent value="in-progress" className="space-y-4 mt-4">
                  {tasks
                    .filter((task) => task?.status === 'IN_PROGRESS')
                    .map((task, index) => (
                      <div key={task.id || `progress-task-${index}`} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium flex items-center">
                              {task.title}
                              {isTaskOverdue(task?.deadline || '') && (
                                <span className="inline-flex ml-2 items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                  Overdue
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Assigned to: {getAssigneeName(task?.assigneeId)}</span>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(task?.priority || 'MEDIUM')}>
                            {task?.priority || 'MEDIUM'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm line-clamp-2">{task.description || 'No description'}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task?.deadline || '')}
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(task => task?.status === 'IN_PROGRESS').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm text-muted-foreground">No in-progress tasks</p>
                      </div>
                    )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-4 mt-4">
                  {tasks
                    .filter((task) => task?.status === 'COMPLETED')
                    .map((task, index) => (
                      <div key={task.id || `completed-task-${index}`} className="border rounded-lg p-4 hover:border-primary/50 transition-colors opacity-75">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium flex items-center">
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Completed by: {getAssigneeName(task?.assigneeId)}</span>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(task?.priority || 'MEDIUM')}>
                            {task?.priority || 'MEDIUM'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm line-clamp-2">{task.description || 'No description'}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task?.deadline || '')}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed on {formatDate(task?.updatedAt || '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(task => task?.status === 'COMPLETED').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm text-muted-foreground">No completed tasks</p>
                      </div>
                    )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 