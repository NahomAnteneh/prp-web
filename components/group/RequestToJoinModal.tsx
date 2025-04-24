'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxSize: number;
  alreadyRequested?: boolean;
}

interface RequestToJoinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestToJoinModal({ onClose, onSuccess }: RequestToJoinModalProps) {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [requestingGroupId, setRequestingGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableGroups();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      setFilteredGroups(
        groups.filter(
          (group) => 
            group.name.toLowerCase().includes(lowerSearchTerm) || 
            (group.description && group.description.toLowerCase().includes(lowerSearchTerm))
        )
      );
    }
  }, [searchTerm, groups]);

  const fetchAvailableGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/groups/available');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available groups');
      }

      setGroups(data.groups);
      setFilteredGroups(data.groups);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching groups', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestToJoin = async (groupId: string) => {
    try {
      setRequestingGroupId(groupId);
      const response = await fetch('/api/groups/request-to-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request joining group');
      }

      toast.success('Request sent', {
        description: 'Your request to join the group has been sent.',
      });
      
      // Update the group in the list to show as "requested"
      setGroups(groups.map(g => 
        g.id === groupId ? { ...g, alreadyRequested: true } : g
      ));
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error sending request', {
        description: errorMessage,
      });
    } finally {
      setRequestingGroupId(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Browse Available Groups</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <ScrollArea className="h-[350px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="ml-2">Loading available groups...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm.trim() !== '' ? 'No groups match your search.' : 'No groups available for joining.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.memberCount}/{group.maxSize}
                      </Badge>
                    </div>
                    <CardDescription>
                      {group.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm" 
                      variant={group.alreadyRequested ? "outline" : "default"}
                      className="w-full"
                      disabled={group.alreadyRequested || requestingGroupId === group.id || group.memberCount >= group.maxSize}
                      onClick={() => requestToJoin(group.id)}
                    >
                      {requestingGroupId === group.id ? (
                        <>
                          <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                          Requesting...
                        </>
                      ) : group.alreadyRequested ? (
                        'Request Sent'
                      ) : group.memberCount >= group.maxSize ? (
                        'Group is Full'
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request to Join
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 