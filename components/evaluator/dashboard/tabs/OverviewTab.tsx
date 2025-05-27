'use client';

import React from 'react';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Megaphone, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  ClipboardList, // For Total Assigned
  Clock,         // For In Progress
  // MessageSquare  // Removed as Pending Feedback card is removed
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  link?: string;
  type?: 'info' | 'warning' | 'success' | 'urgent';
}

interface EvaluatorOverviewStats {
  totalAssigned: number;
  inProgress: number;
  completedThisWeek: number;
  // pendingFeedback: number; // Removed as per request
  averageEvaluationTime: string; 
}

interface OverviewTabProps {
  evaluatorName: string | null;
  announcements: Announcement[];
  stats: EvaluatorOverviewStats;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const AnnouncementIcon = ({ type }: { type?: Announcement['type'] }) => {
  switch (type) {
    case 'urgent':
      return <Zap className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />;
  }
};

export default function OverviewTab({ evaluatorName, announcements, stats, onRefresh, isRefreshing }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {evaluatorName || 'Evaluator'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your evaluation overview and latest announcements.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex-shrink-0 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Announcements</CardTitle>
            <CardDescription>Latest updates and important information for evaluators.</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements && announcements.length > 0 ? (
              <ScrollArea className="max-h-96 pr-3">
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 border bg-muted/30 rounded-lg flex items-start hover:shadow-sm transition-shadow">
                      <AnnouncementIcon type={announcement.type} />
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-md">{announcement.title}</h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(announcement.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{announcement.content}</p>
                        {announcement.link && (
                          <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:underline">
                            <a href={announcement.link} target="_blank" rel="noopener noreferrer">
                              Read More &rarr;
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-10">
                <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No announcements at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Adjusted grid and removed Pending Feedback */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3"> {/* Adjusted to lg:grid-cols-3 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned Projects</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Projects assigned for evaluation</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Evaluations you are working on</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Evaluations This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisWeek}</div>
            <p className="text-xs text-muted-foreground">Completed in the last 7 days</p>
          </CardContent>
        </Card>
        {/* Removed Pending Feedback Card */}
      </div>
    </div>
  );
} 