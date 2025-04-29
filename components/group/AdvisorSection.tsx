'use client';

import { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Clock, CheckCircle, X, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Unified Group type definition
import { Group } from '@/types/types'; // Assuming a centralized type definition file exists

interface Advisor {
  id: string;
  name: string;
  username: string;
  profileInfo?: {
    expertise?: string[];
    bio?: string;
  };
}

interface AdvisorSectionProps {
  group: Group;
  isLeader: boolean;
  onUpdate: () => void;
}

export default function AdvisorSection({ group, isLeader, onUpdate }: AdvisorSectionProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableAdvisors, setAvailableAdvisors] = useState<Advisor[]>([]);
  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false);

  const hasAdvisor = group.project?.advisor !== null;
  const hasPendingRequest = group.advisorRequests?.find(request => request.status === 'PENDING');
  const hasRejectedRequest = group.advisorRequests?.find(request => request.status === 'REJECTED');

  const fetchAvailableAdvisors = async () => {
    try {
      setIsLoadingAdvisors(true);
      const response = await fetch('/api/advisor/available');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available advisors');
      }

      setAvailableAdvisors(data.advisors);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching advisors', {
        description: errorMessage,
      });
    } finally {
      setIsLoadingAdvisors(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/advisor/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          message: message.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit advisor request');
      }

      toast.success('Request submitted', {
        description: 'Your advisor request has been submitted successfully.',
      });
      
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error submitting request', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestSpecificAdvisor = async (advisorId: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/advisor/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          advisorId,
          message: message.trim() || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit advisor request');
      }

      toast.success('Request submitted', {
        description: 'Your advisor request has been submitted successfully.',
      });
      
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error submitting request', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelRequest = async () => {
    if (!group.advisorRequests?.find(request => request.id)) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/advisor/requests/${group.advisorRequests.find(request => request.id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel request');
      }

      toast.success('Request cancelled', {
        description: 'Your advisor request has been cancelled.',
      });
      
      onUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error cancelling request', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Content for when the group has an advisor
  if (hasAdvisor && group.project?.advisor) {
    const advisor = group.project.advisor;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Advisor Assigned
          </CardTitle>
          <CardDescription>
            Your group has been assigned an advisor for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://avatar.vercel.sh/${advisor.username}`} />
                <AvatarFallback>{advisor.firstName?.[0] || advisor.username[0]}</AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="text-lg font-medium">{advisor.firstName} {advisor.lastName}</h3>
                <p className="text-sm text-muted-foreground">{advisor.username}</p>
                
                {advisor.profileInfo?.expertise && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {advisor.profileInfo.expertise.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {advisor.profileInfo?.bio && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">About</h4>
                <p className="text-sm">{advisor.profileInfo.bio}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Content for a pending advisor request
  if (hasPendingRequest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Advisor Request Pending
          </CardTitle>
          <CardDescription>
            Your request for an advisor is being processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm">
              {group.advisorRequests?.find(request => request.requestedAdvisor) ? (
                <>
                  You have requested <strong>{group.advisorRequests?.find(request => request.requestedAdvisor?.username)?.requestedAdvisor?.username || 'an advisor'}</strong> to be your advisor.
                </>
              ) : (
                <>
                  You have requested any available advisor to be assigned to your group.
                </>
              )}
            </p>
            
            {group.advisorRequests?.find(request => request.requestMessage) && (
              <div className="mt-4 bg-background p-3 rounded-md">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Your Message:</h4>
                <p className="text-sm italic">&ldquo;{group.advisorRequests.find(request => request.requestMessage)?.requestMessage}&rdquo;</p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-4">
              Request submitted on {group.advisorRequests?.find(request => request.createdAt)?.createdAt ? new Date(group.advisorRequests.find(request => request.createdAt)?.createdAt || '').toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </CardContent>
        {isLeader && (
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={cancelRequest}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel Request
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Content for a rejected advisor request
  if (hasRejectedRequest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <X className="h-5 w-5" />
            Advisor Request Rejected
          </CardTitle>
          <CardDescription>
            Your request for an advisor was rejected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm">
              {group.advisorRequests?.find(request => request.requestedAdvisor) ? (
                <>
                  Your request for <strong>{group.advisorRequests.find(request => request.requestedAdvisor?.username)?.requestedAdvisor?.username}</strong> to be your advisor was rejected.
                </>
              ) : (
                <>
                  Your request for an advisor was rejected.
                </>
              )}
            </p>
            
            <p className="text-sm mt-2">
              Please submit a new request for an advisor. You can request a specific advisor or ask for any available advisor.
            </p>
          </div>
        </CardContent>
        {isLeader && (
          <CardFooter className="flex justify-end gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={() => fetchAvailableAdvisors()}
                  disabled={isSubmitting}
                >
                  <User className="h-4 w-4 mr-1" />
                  Request Specific Advisor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request a Specific Advisor</DialogTitle>
                  <DialogDescription>
                    Choose an advisor from the list below and include a message explaining your project.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="mb-4">
                    <label className="text-sm font-medium">Message (Optional)</label>
                    <Textarea
                      placeholder="Briefly describe your project and why you're requesting this advisor..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {isLoadingAdvisors ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    ) : availableAdvisors.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No advisors available at the moment.</p>
                    ) : (
                      availableAdvisors.map((advisor) => (
                        <div key={advisor.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://avatar.vercel.sh/${advisor.username}`} />
                              <AvatarFallback>{advisor.name?.[0] || advisor.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{advisor.name}</p>
                              <p className="text-xs text-muted-foreground">{advisor.username}</p>
                              
                              {advisor.profileInfo?.expertise && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {advisor.profileInfo.expertise.slice(0, 2).map((item, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {item}
                                    </Badge>
                                  ))}
                                  {advisor.profileInfo.expertise.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{advisor.profileInfo.expertise.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => requestSpecificAdvisor(advisor.id)}
                            disabled={isSubmitting}
                          >
                            Request
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
              
            <Button 
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
            >
              Request Any Advisor
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Default content - no advisor and no pending request
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          No Advisor Assigned
        </CardTitle>
        <CardDescription>
          Your group needs an advisor for your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm">
            Each project group needs an advisor to guide your work. The advisor will provide feedback, evaluate progress, and help you overcome challenges.
          </p>
          <p className="text-sm mt-2">
            You can request a specific advisor with expertise in your area of interest, or you can request any available advisor.
          </p>
          
          {isLeader ? (
            <div className="mt-4">
              <label className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                placeholder="Briefly describe your project to help us match you with an appropriate advisor..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          ) : (
            <p className="text-sm font-medium mt-4 text-muted-foreground">
              Only the group leader can request an advisor.
            </p>
          )}
        </div>
      </CardContent>
      {isLeader && (
        <CardFooter className="flex justify-end gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                onClick={() => fetchAvailableAdvisors()}
                disabled={isSubmitting}
              >
                <User className="h-4 w-4 mr-1" />
                Request Specific Advisor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Specific Advisor</DialogTitle>
                <DialogDescription>
                  Choose an advisor from the list below and include a message explaining your project.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-4">
                  <label className="text-sm font-medium">Message (Optional)</label>
                  <Textarea
                    placeholder="Briefly describe your project and why you're requesting this advisor..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {isLoadingAdvisors ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : availableAdvisors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No advisors available at the moment.</p>
                  ) : (
                    availableAdvisors.map((advisor) => (
                      <div key={advisor.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://avatar.vercel.sh/${advisor.username}`} />
                            <AvatarFallback>{advisor.name?.[0] || advisor.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{advisor.name}</p>
                            <p className="text-xs text-muted-foreground">{advisor.username}</p>
                            
                            {advisor.profileInfo?.expertise && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {advisor.profileInfo.expertise.slice(0, 2).map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                                {advisor.profileInfo.expertise.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{advisor.profileInfo.expertise.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => requestSpecificAdvisor(advisor.id)}
                          disabled={isSubmitting}
                        >
                          Request
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            
          <Button 
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
          >
            Request Any Advisor
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}