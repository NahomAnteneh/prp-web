'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  recipientId: string;
  recipient: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  isFromGroup: boolean;
}

interface Group {
  id: string;
  name: string;
  project?: {
    advisorId: string | null;
    advisor: {
      id: string;
      name: string;
      username: string;
    } | null;
  };
}

interface MessageAdvisorProps {
  group: Group;
}

export default function MessageAdvisor({ group }: MessageAdvisorProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasAdvisor = !!group.project?.advisor;

  useEffect(() => {
    if (hasAdvisor) {
      fetchMessages();
      // Set up polling for new messages every 30 seconds
      const intervalId = setInterval(fetchMessages, 30000);
      return () => clearInterval(intervalId);
    }
  }, [group.id, hasAdvisor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!hasAdvisor) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${group.id}/messages`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }

      setMessages(data.messages || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching messages', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !hasAdvisor || !group.project?.advisor?.id) return;
    
    try {
      setIsSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          recipientId: group.project.advisor.id,
          groupId: group.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setNewMessage('');
      
      // Add the new message to the list
      fetchMessages();
      
      // Scroll to the bottom
      scrollToBottom();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error sending message', {
        description: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatMessageDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Function to group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString('en-US');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  };
  
  // Group the messages by date
  const groupedMessages = groupMessagesByDate(messages);

  // If no advisor is assigned
  if (!hasAdvisor) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium">No Advisor Assigned</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mt-1">
            Your group doesn&apos;t have an advisor assigned yet. Once you have an advisor, you&apos;ll be able to send them messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-18rem)]">
      <div className="bg-muted/30 p-3 rounded-t-lg flex items-center gap-3">
        <Avatar>
          <AvatarImage src={`https://avatar.vercel.sh/${group.project?.advisor?.username}`} />
          <AvatarFallback>
            {group.project?.advisor?.name?.[0] || group.project?.advisor?.username?.[0] || 'A'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{group.project?.advisor?.name}</h3>
          <p className="text-xs text-muted-foreground">Advisor</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-6 bg-background rounded-b-lg border">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation with your advisor.</p>
            </div>
          </div>
        ) : (
          <div>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">
                      {formatMessageDate(group.messages[0].createdAt)}
                    </span>
                  </div>
                </div>
                
                {group.messages.map((message) => {
                  const isFromCurrentUser = message.isFromGroup;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex items-start gap-2 ${isFromCurrentUser ? 'justify-end' : ''}`}
                    >
                      {!isFromCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${message.sender.username}`} />
                          <AvatarFallback>
                            {message.sender.name?.[0] || message.sender.username[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div 
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isFromCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        {!isFromCurrentUser && (
                          <p className="text-xs font-medium mb-1">
                            {message.sender.name || message.sender.username}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {message.content}
                        </p>
                        <p className={`text-xs mt-1 ${isFromCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                      
                      {isFromCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={`https://avatar.vercel.sh/${session?.user?.username || 'user'}`} 
                          />
                          <AvatarFallback>
                            {session?.user?.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <CardFooter className="border rounded-lg mt-4 p-2 flex items-center gap-2 bg-background">
        <Textarea
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button 
          size="icon" 
          className="h-10 w-10"
          disabled={!newMessage.trim() || isSending}
          onClick={sendMessage}
        >
          <Send className="h-5 w-5" />
        </Button>
      </CardFooter>
    </div>
  );
} 