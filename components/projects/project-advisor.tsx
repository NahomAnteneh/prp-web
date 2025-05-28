'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Send, Clock, Loader2, UserPlus, Star, HelpCircle } from 'lucide-react';
import { AdvisorRequestModal } from './advisor-request-modal';
import { AdvisorRating } from './advisor-rating';
import { AdvisorFeedback } from './advisor-feedback';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  department?: string;
  institution?: string;
  expertise?: string[];
}

interface AdvisorRequest {
  id: string;
  status: string;
  requestMessage: string | null;
  createdAt: string;
  requestedAdvisorId: string;
  requestedAdvisor: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface AdviceRequest {
  id: string;
  topic: string;
  description: string;
  status: 'PENDING' | 'ANSWERED';
  createdAt: string;
  response?: {
    content: string;
    createdAt: string;
  };
}

interface ProjectAdvisorProps {
  ownerId: string;
  projectId: string;
}

export function ProjectAdvisor({ ownerId, projectId }: ProjectAdvisorProps) {
  const [advisor, setAdvisor] = useState<User | null>(null);
  const [advisorRequest, setAdvisorRequest] = useState<AdvisorRequest | null>(null);
  const [adviceRequests, setAdviceRequests] = useState<AdviceRequest[]>([]);
  const [newAdviceTopic, setNewAdviceTopic] = useState('');
  const [newAdviceDescription, setNewAdviceDescription] = useState('');
  const [adviceResponse, setAdviceResponse] = useState('');
  const [selectedAdviceRequest, setSelectedAdviceRequest] = useState<AdviceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAdvice, setIsSubmittingAdvice] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchAdvisorData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch advisor data
      const advisorResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor`);
      
      if (advisorResponse.ok) {
        const advisorData = await advisorResponse.json();
        setAdvisor(advisorData.advisor);
        
        // Fetch advice requests
        const adviceResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor/advice`);
        
        if (adviceResponse.ok) {
          const adviceData = await adviceResponse.json();
          setAdviceRequests(adviceData);
        } else {
          console.error('Failed to fetch advice requests:', adviceResponse.statusText);
        }
      } else if (advisorResponse.status === 404) {
        // No advisor assigned, check for pending requests
        const requestResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor-request`);
        
        if (requestResponse.ok) {
          const requestData = await requestResponse.json();
          setAdvisorRequest(requestData.request || null);
        }
      } else {
        throw new Error(`Failed to fetch advisor: ${advisorResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching advisor data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load advisor data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisorData();
  }, [ownerId, projectId]);
  
  const handleSubmitAdviceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdviceTopic.trim() || !newAdviceDescription.trim()) {
      toast.error('Please provide both a topic and description');
      return;
    }
    
    try {
      setIsSubmittingAdvice(true);
      
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor/advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: newAdviceTopic.trim(),
          description: newAdviceDescription.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit advice request');
      }
      
      toast.success('Advice request submitted');
      setNewAdviceTopic('');
      setNewAdviceDescription('');
      setIsAdviceDialogOpen(false);
      
      // Refresh the advice requests list
      fetchAdvisorData();
    } catch (error) {
      console.error('Error submitting advice request:', error);
      toast.error('Failed to submit request', { 
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsSubmittingAdvice(false);
    }
  };
  
  const handleSubmitAdviceResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adviceResponse.trim() || !selectedAdviceRequest) {
      toast.error('Please provide a response');
      return;
    }
    
    try {
      setIsSubmittingResponse(true);
      
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor/advice/${selectedAdviceRequest.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: adviceResponse.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit response');
      }
      
      toast.success('Response submitted');
      setAdviceResponse('');
      setIsResponseDialogOpen(false);
      setSelectedAdviceRequest(null);
      
      // Refresh the advice requests list
      fetchAdvisorData();
    } catch (error) {
      console.error('Error submitting advice response:', error);
      toast.error('Failed to submit response', { 
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Advisor</CardTitle>
        <CardDescription>
          Your designated advisor for this project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="mt-4 text-sm text-muted-foreground">Loading advisor information...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : advisorRequest ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Clock className="h-12 w-12 text-amber-500/80 mb-4" />
            <h3 className="text-lg font-medium text-center mb-2">Advisor Request Pending</h3>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Request sent to {advisorRequest.requestedAdvisor.firstName} {advisorRequest.requestedAdvisor.lastName}
              <br />on {formatDate(advisorRequest.createdAt)}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={async () => {
                if (confirm('Are you sure you want to cancel this advisor request?')) {
                  try {
                    const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor-request/${advisorRequest.id}`, {
                      method: 'DELETE',
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to cancel request');
                    }
                    
                    toast.success('Advisor request cancelled');
                    setAdvisorRequest(null);
                  } catch (error) {
                    toast.error('Failed to cancel request');
                    console.error(error);
                  }
                }
              }}
            >
              Cancel Request
            </Button>
          </div>
        ) : !advisor ? (
          <div className="flex flex-col items-center justify-center py-10">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Advisor Assigned</h3>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Request an advisor to get expert guidance for your project
            </p>
            
            <AdvisorRequestModal 
              ownerId={ownerId}
              projectId={projectId} 
              onRequestComplete={fetchAdvisorData}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20">
                  {advisor.profileImageUrl ? (
                    <AvatarImage src={advisor.profileImageUrl} alt={`${advisor.firstName} ${advisor.lastName}`} />
                  ) : (
                    <AvatarFallback>{getInitials(advisor.firstName, advisor.lastName)}</AvatarFallback>
                  )}
                </Avatar>
                <h3 className="mt-4 text-lg font-medium">
                  {advisor.firstName} {advisor.lastName}
                </h3>
                <Badge className="mt-1">{advisor.role}</Badge>
                {advisor.department && (
                  <p className="mt-2 text-sm text-center text-muted-foreground">
                    {advisor.department}
                    {advisor.institution && `, ${advisor.institution}`}
                  </p>
                )}
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${advisor.email}`} 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {advisor.email}
                  </a>
                </div>
                
                {advisor.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${advisor.phoneNumber}`} 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {advisor.phoneNumber}
                    </a>
                  </div>
                )}
                
                {advisor.expertise && advisor.expertise.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Areas of Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {advisor.expertise.map((area) => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-2 mt-6">
                  <AdvisorRating
                    ownerId={ownerId}
                    projectId={projectId}
                    advisorId={advisor.userId}
                    advisorName={`${advisor.firstName} ${advisor.lastName}`}
                    onRatingComplete={fetchAdvisorData}
                  />
                  
                  <AdvisorFeedback
                    ownerId={ownerId}
                    projectId={projectId}
                    onFeedbackComplete={fetchAdvisorData}
                  />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Advice Requests</h3>
                
                <Dialog open={isAdviceDialogOpen} onOpenChange={setIsAdviceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Request Advice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Advice</DialogTitle>
                      <DialogDescription>
                        Ask your advisor for specific guidance on your project.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAdviceRequest}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="topic" className="text-sm font-medium">Topic</label>
                          <Input
                            id="topic"
                            placeholder="E.g., Project Architecture, Database Design"
                            value={newAdviceTopic}
                            onChange={(e) => setNewAdviceTopic(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="description" className="text-sm font-medium">Description</label>
                          <Textarea
                            id="description"
                            placeholder="Describe what you need help with in detail..."
                            value={newAdviceDescription}
                            onChange={(e) => setNewAdviceDescription(e.target.value)}
                            className="resize-none min-h-[150px]"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" type="button">Cancel</Button>
                        </DialogClose>
                        <Button 
                          type="submit" 
                          disabled={isSubmittingAdvice || !newAdviceTopic.trim() || !newAdviceDescription.trim()}
                        >
                          {isSubmittingAdvice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Respond to Advice Request</DialogTitle>
                      <DialogDescription>
                        Provide your guidance to the student's request.
                      </DialogDescription>
                    </DialogHeader>
                    {selectedAdviceRequest && (
                      <form onSubmit={handleSubmitAdviceResponse}>
                        <div className="grid gap-4 py-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Topic</h4>
                            <p className="text-sm">{selectedAdviceRequest.topic}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Description</h4>
                            <p className="text-sm bg-muted p-3 rounded-md">
                              {selectedAdviceRequest.description}
                            </p>
                          </div>
                          <div className="grid gap-2">
                            <label htmlFor="response" className="text-sm font-medium">Your Response</label>
                            <Textarea
                              id="response"
                              placeholder="Provide your guidance here..."
                              className="min-h-[150px]"
                              value={adviceResponse}
                              onChange={(e) => setAdviceResponse(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" type="button">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="submit" 
                            disabled={isSubmittingResponse || !adviceResponse.trim()}
                          >
                            {isSubmittingResponse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Response
                          </Button>
                        </DialogFooter>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="border rounded-lg p-4 h-[400px] overflow-y-auto">
                {adviceRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <HelpCircle className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No advice requests yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the "Request Advice" button to ask for specific guidance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adviceRequests.map((request) => (
                      <div key={request.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{request.topic}</h4>
                          <Badge variant={request.status === 'PENDING' ? 'outline' : 'default'}>
                            {request.status === 'PENDING' ? 'Pending' : 'Answered'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-3">{request.description}</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Requested on {formatDate(request.createdAt)}
                        </p>
                        
                        {request.response && (
                          <div className="bg-muted p-3 rounded-md mt-3">
                            <h5 className="text-sm font-medium mb-1">Advisor Response</h5>
                            <p className="text-sm">{request.response.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Responded on {formatDate(request.response.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 