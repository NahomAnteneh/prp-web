'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Send, Clock, Loader2 } from 'lucide-react';

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

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: User;
  isRead: boolean;
}

interface ProjectAdvisorProps {
  ownerId: string;
  projectId: string;
}

export function ProjectAdvisor({ ownerId, projectId }: ProjectAdvisorProps) {
  const [advisor, setAdvisor] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdvisorData = async () => {
      try {
        setIsLoading(true);
        // Fetch advisor data
        const advisorResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor`);
        
        if (!advisorResponse.ok) {
          throw new Error(`Failed to fetch advisor: ${advisorResponse.statusText}`);
        }
        
        const advisorData = await advisorResponse.json();
        setAdvisor(advisorData);
        
        // Fetch advisor messages
        const messagesResponse = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor/messages`);
        
        if (!messagesResponse.ok) {
          throw new Error(`Failed to fetch messages: ${messagesResponse.statusText}`);
        }
        
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching advisor data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load advisor data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvisorData();
  }, [ownerId, projectId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const sentMessage = await response.json();
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
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
        ) : advisor ? (
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
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a 
                    href={`mailto:${advisor.email}`} 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {advisor.email}
                  </a>
                </div>
                
                {advisor.phoneNumber && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={`tel:${advisor.phoneNumber}`} 
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {advisor.phoneNumber}
                    </a>
                  </div>
                )}
                
                {advisor.expertise && advisor.expertise.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {advisor.expertise.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="border rounded-lg p-4 h-[400px] flex flex-col">
                <h3 className="text-sm font-medium mb-3">Advisor Messages</h3>
                
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Send a message to your advisor to get started.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex gap-2 max-w-[80%] ${
                          message.sender.role === 'ADVISOR' 
                            ? 'mr-auto' 
                            : 'ml-auto flex-row-reverse'
                        }`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {message.sender.profileImageUrl ? (
                            <AvatarImage 
                              src={message.sender.profileImageUrl} 
                              alt={`${message.sender.firstName} ${message.sender.lastName}`} 
                            />
                          ) : (
                            <AvatarFallback>
                              {getInitials(message.sender.firstName, message.sender.lastName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className={`rounded-lg p-3 ${
                            message.sender.role === 'ADVISOR' 
                              ? 'bg-muted' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
                  <Textarea 
                    placeholder="Type a message..." 
                    className="min-h-[40px] resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim() || isSending}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No advisor has been assigned to this project yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 