"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, 
  MessageSquare, 
  BarChart2,
  Filter
} from 'lucide-react';

interface Activity {
  type: 'feedback' | 'task';
  id: string;
  createdAt?: string;
  updatedAt?: string;
  content?: string;
  title?: string;
  status?: string;
  project: {
    id: string;
    title: string;
    group: {
      groupUserName: string;
      name: string;
    };
  };
}

interface ActivitiesTabProps {
  initialActivities: Activity[];
  onRefreshActivities: () => Promise<void>;
  isRefreshing: boolean;
  onActivitySelect?: (activityId: string, type: string, projectId: string, groupUserName?: string) => void;
}

export default function ActivitiesTab({ 
  initialActivities, 
  onRefreshActivities,
  isRefreshing,
  onActivitySelect 
}: ActivitiesTabProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities || []);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setActivities(initialActivities || []);
  }, [initialActivities]);

  const handleRefreshClick = async () => {
    await onRefreshActivities();
  };

  const handleActivityClick = (activity: Activity) => {
    if (onActivitySelect) {
      onActivitySelect(
        activity.id, 
        activity.type, 
        activity.project.id,
        activity.project.group.groupUserName
      );
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });
  
  const showLoadingSkeleton = isRefreshing && filteredActivities.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Activities</h2>
        <div className="flex items-center space-x-2">
          <Select 
            value={filter} 
            onValueChange={setFilter}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="feedback">Feedback Only</SelectItem>
              <SelectItem value="task">Tasks Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {showLoadingSkeleton ? (
        <div className="space-y-4">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Activities Found</CardTitle>
            <CardDescription>
              {filter !== 'all'
                ? `No ${filter} activities found.`
                : 'You currently don\'t have any activities to display.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <BarChart2 className="h-10 w-10 text-primary/80" />
              </div>
              <h3 className="text-lg font-medium">No Activities Available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Activities will appear here as new events occur in your advised projects.
              </p>
              {filter !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => setFilter('all')}
                  className="mt-2"
                >
                  Show All Activities
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => {
            const date = activity.type === 'feedback' 
              ? new Date(activity.createdAt!) 
              : new Date(activity.updatedAt!);
              
            return (
              <Card 
                key={`${activity.type}-${activity.id}`} 
                className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleActivityClick(activity)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className={`h-10 w-10 mt-1 ${activity.type === 'feedback' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {activity.type === 'feedback' ? (
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <BarChart2 className="h-5 w-5 text-green-500" />
                      )}
                      <AvatarFallback>{activity.type === 'feedback' ? 'FB' : 'TS'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <p className="text-sm font-medium leading-none">
                            {activity.type === 'feedback' 
                              ? 'New Feedback' 
                              : activity.title ? `Task: ${activity.title}` : `Task Status: ${activity.status}`}
                          </p>
                          {activity.type === 'task' && activity.status && (
                             <Badge variant="outline" className="text-xs">{activity.status}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground pt-1">
                        {activity.type === 'feedback' 
                          ? activity.content 
                          : activity.title /* For tasks, display title. Content could be shown if title is not present or in another field */}
                      </p>
                      
                      <div className="flex items-center text-xs text-muted-foreground pt-1 space-x-1.5">
                        <span>Project:</span>
                        <Badge variant="secondary" className="font-normal">
                          {activity.project.title}
                        </Badge>
                        <span>in Group:</span>
                         <Badge variant="secondary" className="font-normal">
                           {activity.project.group.name} ({activity.project.group.groupUserName})
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 