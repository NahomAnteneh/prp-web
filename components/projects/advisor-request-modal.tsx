'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, User, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Advisor {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileInfo?: {
    expertise?: string[];
    bio?: string;
    institution?: string;
    department?: string;
  };
  currentProjects: number;
  isAvailable: boolean;
  availableSlots: number;
}

interface AdvisorRequestModalProps {
  ownerId: string;
  projectId: string;
  onRequestComplete: () => void;
}

export function AdvisorRequestModal({ ownerId, projectId, onRequestComplete }: AdvisorRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAdvisors();
    }
  }, [isOpen]);

  const fetchAdvisors = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advisor/avilable');
      
      if (!response.ok) {
        throw new Error('Failed to fetch advisors');
      }
      
      const data = await response.json();
      setAdvisors(data.data);
    } catch (error) {
      console.error('Error fetching advisors:', error);
      toast.error('Failed to load advisors', {
        description: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedAdvisor) {
      toast.error('Please select an advisor');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestedAdvisorId: selectedAdvisor,
          requestMessage: requestMessage.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send request');
      }

      toast.success('Request sent successfully', {
        description: 'The advisor will be notified of your request.'
      });
      
      setIsOpen(false);
      onRequestComplete();
    } catch (error) {
      console.error('Error sending advisor request:', error);
      toast.error('Failed to send request', {
        description: error instanceof Error ? error.message : 'Please try again later.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredAdvisors = advisors.filter(advisor => {
    const fullName = `${advisor.firstName} ${advisor.lastName}`.toLowerCase();
    const expertise = advisor.profileInfo?.expertise?.join(' ').toLowerCase() || '';
    const institution = advisor.profileInfo?.institution?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           expertise.includes(searchLower) || 
           institution.includes(searchLower);
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Request Advisor</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request an Advisor</DialogTitle>
          <DialogDescription>
            Browse and select an advisor for your project. Available advisors are shown below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, expertise, or institution..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-4 my-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAdvisors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No advisors match your search' : 'No advisors available'}
            </div>
          ) : (
            filteredAdvisors.map((advisor) => (
              <Card 
                key={advisor.userId} 
                className={`cursor-pointer transition-all ${
                  selectedAdvisor === advisor.userId 
                    ? 'border-primary ring-1 ring-primary' 
                    : 'hover:border-muted-foreground'
                }`}
                onClick={() => setSelectedAdvisor(advisor.userId)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://avatar.vercel.sh/${advisor.email}`} />
                    <AvatarFallback>{getInitials(advisor.firstName, advisor.lastName)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{advisor.firstName} {advisor.lastName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {advisor.profileInfo?.department}
                          {advisor.profileInfo?.institution && `, ${advisor.profileInfo.institution}`}
                        </p>
                      </div>
                      <Badge variant={advisor.isAvailable ? "outline" : "secondary"}>
                        {advisor.isAvailable 
                          ? `${advisor.availableSlots} slot${advisor.availableSlots !== 1 ? 's' : ''} available` 
                          : 'No slots available'}
                      </Badge>
                    </div>
                    
                    {advisor.profileInfo?.expertise && advisor.profileInfo.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {advisor.profileInfo.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {advisor.profileInfo?.bio && (
                      <p className="text-sm mt-2 line-clamp-2">{advisor.profileInfo.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {selectedAdvisor && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium">Add a message (optional)</h4>
            <Textarea 
              placeholder="Explain why you're requesting this advisor and any specific needs for your project..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendRequest} 
            disabled={!selectedAdvisor || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending request...
              </>
            ) : (
              'Send request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 