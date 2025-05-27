"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, ThumbsUp, ThumbsDown, X, Loader2, BellRing } from 'lucide-react'; // Added BellRing for empty state
import { Spinner } from '@/components/ui/spinner'; // Ensure Spinner is imported if used
import { Badge } from "@/components/ui/badge"; // Added Badge import
import { toast } from "sonner";

// Interfaces (align with AdvisorDashboardTabs)
interface AdvisorRequestProject { // If requests can be for specific projects
    id: string;
    title: string;
    description: string | null;
}

interface AdvisorRequest {
  id: string;
  status: string;
  requestMessage: string | null;
  createdAt: string;
  groupUserName: string; // Added to align with parent component
  group: {
    // id: string; // Replaced by groupUserName
    groupUserName: string; // Align with parent and API structure
    name: string;
    description: string | null;
    leader: {
      // id: string; // Replaced by userId
      userId: string; // Align with parent and API structure
      name: string | null; // Display name
      username: string; // Login username from API if available and needed
    };
    // project?: { // Changed to projects to match parent type if requests can be for multiple or more detailed project info
    //   id: string;
    //   title: string;
    //   description: string | null;
    // };
    projects?: AdvisorRequestProject[]; // Aligned with parent if used
  };
}

interface RequestsTabProps {
  pendingRequests: AdvisorRequest[];
  isLoading: boolean; // For initial load or overall refresh of this tab's data
  isProcessingRequest: string | null; // ID of the request being processed
  onRefreshRequests: () => Promise<void>;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onRejectRequest: (requestId: string) => Promise<void>;
}

export default function RequestsTab({ 
  pendingRequests, 
  isLoading, 
  isProcessingRequest,
  onRefreshRequests,
  onAcceptRequest,
  onRejectRequest
}: RequestsTabProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    requestId: string | null;
    action: 'accept' | 'reject' | null;
    groupName: string;
  }>({
    open: false,
    requestId: null,
    action: null,
    groupName: ''
  });

  const openConfirmDialog = (requestId: string, action: 'accept' | 'reject', groupName: string) => {
    setConfirmDialog({
      open: true,
      requestId,
      action,
      groupName
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      requestId: null,
      action: null,
      groupName: ''
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.requestId || !confirmDialog.action) return;
    
    if (confirmDialog.action === 'accept') {
      await onAcceptRequest(confirmDialog.requestId);
    } else {
      await onRejectRequest(confirmDialog.requestId);
    }
    closeConfirmDialog(); // Close dialog after action is initiated
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Advisor Requests</CardTitle>
          <CardDescription>Review and respond to requests from student groups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Pending Advisor Requests</CardTitle>
            <CardDescription>
              Groups requesting you as their advisor.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRefreshRequests}
            disabled={isLoading || !!isProcessingRequest}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading && !isProcessingRequest ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {pendingRequests && pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3 transition-all hover:shadow-md bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{request.group.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Led by: {request.group.leader.name || request.group.leader.username}
                      </p>
                      {request.group.projects && request.group.projects.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Related Project(s): {request.group.projects.map(p => p.title).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={request.status === 'PENDING' ? 'outline' : 'secondary'} className={request.status === 'PENDING' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}>{request.status}</Badge>
                  </div>
                  
                  {request.requestMessage && (
                    <div className="border-l-2 border-border pl-3 py-1.5 text-sm italic bg-muted/50 rounded-r-md">
                      "{request.requestMessage}"
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2 border-t border-border mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      onClick={() => openConfirmDialog(request.id, 'reject', request.group.name)}
                      disabled={!!isProcessingRequest}
                    >
                      {isProcessingRequest === request.id && confirmDialog.action === 'reject' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 mr-2" />
                      )}
                      Decline
                    </Button>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => openConfirmDialog(request.id, 'accept', request.group.name)}
                      disabled={!!isProcessingRequest}
                    >
                      {isProcessingRequest === request.id && confirmDialog.action === 'accept' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4 mr-2" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <BellRing className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Pending Requests</h3>
              <p className="text-sm text-muted-foreground">You have no new advisor requests at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDialog.open} onOpenChange={(isOpen) => !isOpen && closeConfirmDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'accept' 
                ? 'Accept Advisor Request?' 
                : 'Decline Advisor Request?'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'accept' 
                ? `You are about to become the advisor for ${confirmDialog.groupName}.`
                : `You are about to decline the request from ${confirmDialog.groupName}.`}
              This action can affect project progression.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-2 mt-4"> {/* Added gap and mt for better spacing */}
            <Button 
              variant="outline" 
              onClick={closeConfirmDialog}
              disabled={!!isProcessingRequest} 
            >
              Cancel
            </Button>
            <Button 
              variant={confirmDialog.action === 'accept' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={!!isProcessingRequest}
            >
              {isProcessingRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmDialog.action === 'accept' ? 'Accept' : 'Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 