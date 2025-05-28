'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Settings, Code } from 'lucide-react';
import GroupOverview from '@/components/group/GroupOverview';
import ProjectsList from '@/components/group/ProjectsList';
import RepositoriesList from '@/components/group/RepositoriesList';
import GroupSettings from '@/components/group/GroupSettings';
import CreateGroupModal from '@/components/group/CreateGroupModal';
import JoinGroupModal from '@/components/group/JoinGroupModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/student/navbar';
import Footer from '@/components/student/footer';
import { Group, GroupInvite } from '@prisma/client';
import { toast } from 'sonner';

// Define the expected type for groupData, including relations
interface GroupWithRelations extends Group {
  id: string;
  members: { 
    userId: string;
    user?: {
      userId: string;
      firstName?: string;
      lastName?: string;
    };
  }[];
  invites: GroupInvite[];
  repositories?: Array<{
    name: string;
    groupUserName: string;
    description?: string;
    id?: string; // Keep id for backward compatibility
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

// Add props interface for the component
interface GroupPageProps {
  groupData?: Group & { id: string };
  isVisitor?: boolean;
}

export default function GroupPage({ groupData: propGroupData, isVisitor }: GroupPageProps = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<GroupWithRelations | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [maxGroupSize, setMaxGroupSize] = useState(4); // Default, will be updated from rules

  const defaultTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (tab: string) => {
    router.push(`/group?tab=${tab}`);
  };

  useEffect(() => {
    // If we have provided group data from props (visitor mode), use it directly
    if (propGroupData) {
      setGroupData({
        ...propGroupData,
        id: propGroupData.id || '', // Ensure id is set
        members: [],  // Initialize with empty arrays since we might not have full data
        invites: [],
      });
      setLoading(false);
      return;
    }

    // If user not authenticated and not in visitor mode, redirect to login
    if (status === 'unauthenticated' && !isVisitor) {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' || isVisitor) {
      // Fetch current user's group information if no props provided
      if (!propGroupData) {
        fetchGroupData();
      }
      // Fetch rules including max group size
      fetchMaxGroupSize();
    }
  }, [status, session, router, propGroupData, isVisitor]);

  const userId = session?.user.userId;

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups/my-group');
      const data = await response.json();

      if (response.ok) {
        setGroupData({
          ...data,
          // Ensure id is properly set
          id: data.id,
          members: Array.isArray(data.members) ? data.members : [],
          invites: Array.isArray(data.invites) ? data.invites : [],
        });
      } else {
        // User doesn't have a group
        setGroupData(null);
        toast.info('No group found', {
          description: 'You are not part of any group. Create or join one to continue.',
        });
      }
    } catch (error) {
      console.error('Failed to fetch group data:', error);
      toast.error('Error fetching group data', {
        description: 'Something went wrong while loading your group information.',
      });
      setGroupData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaxGroupSize = async () => {
    try {
      const response = await fetch('/api/rules');
      const data = await response.json();

      if (response.ok && typeof data.maxGroupSize === 'number') {
        setMaxGroupSize(data.maxGroupSize);
      } else {
        console.warn('Invalid maxGroupSize received:', data.maxGroupSize);
      }
    } catch (error) {
      console.error('Failed to fetch max group size:', error);
      toast.error('Error fetching rules', {
        description: 'Could not load group size rules. Using default value.',
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading group information...</span>
      </div>
    );
  }

  // User is not part of a group - show options to create or join one
  if (!groupData && !isVisitor) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 max-w-5xl">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">You are not part of any group</h1>
            <p className="text-muted-foreground mb-6">
              As a student, you must be part of a project group. You can create a new group,
              join one with an invitation code, or request to join an existing group.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
              <Button
                size="lg"
                onClick={() => setShowCreateGroupModal(true)}
              >
                Create a Group
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowJoinGroupModal(true)}
              >
                Join via Invitation Code
              </Button>
            </div>
          </div>

          {/* Modals */}
          {showCreateGroupModal && (
            <CreateGroupModal
              maxGroupSize={maxGroupSize}
              onClose={() => setShowCreateGroupModal(false)}
              onSuccess={fetchGroupData}
            />
          )}

          {showJoinGroupModal && (
            <JoinGroupModal
              onClose={() => setShowJoinGroupModal(false)}
              onSuccess={fetchGroupData}
            />
          )}
        </div>
        <Footer />
      </>
    );
  }

  // User has a group - show group dashboard
  return (
    <>
      {isVisitor ? (
        // Use a simplified navbar for visitors
        <div className="bg-background border-b py-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Group Profile</h1>
          </div>
        </div>
      ) : (
        <Navbar />
      )}
      <div className="container mx-auto py-6 max-w-6xl">
        {groupData && (
          <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="mb-8">
            <TabsList className={`grid w-full ${isVisitor ? 'grid-cols-3' : 'grid-cols-4'}`}>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Projects</span>
              </TabsTrigger>
              <TabsTrigger value="repositories" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Repositories</span>
              </TabsTrigger>
              {!isVisitor && (
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <h2 className="text-xl font-bold mb-4">Group Overview</h2>
              <GroupOverview
                group={groupData}
                maxGroupSize={maxGroupSize}
                isLeader={!isVisitor && userId === groupData.leaderId}
                onUpdate={!isVisitor ? fetchGroupData : undefined}
              />
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <h2 className="text-xl font-bold mb-4">Group Projects</h2>
              {groupData.groupUserName ? (
                <ProjectsList
                  groupUserName={groupData.groupUserName}
                  isLeader={!isVisitor && userId === groupData.leaderId}
                />
              ) : (
                <div className="p-4 border rounded bg-muted/30">
                  <p>Unable to load projects. Group username is missing.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="repositories" className="mt-6">
              <h2 className="text-xl font-bold mb-4">Group Repositories</h2>
              {groupData.groupUserName ? (
                <RepositoriesList
                  groupUserName={groupData.groupUserName}
                  isLeader={!isVisitor && userId === groupData.leaderId}
                  groupName={groupData.name}
                />
              ) : (
                <div className="p-4 border rounded bg-muted/30">
                  <p>Unable to load repositories. Group username is missing.</p>
                </div>
              )}
            </TabsContent>

            {!isVisitor && (
              <TabsContent value="settings" className="mt-6">
                <h2 className="text-xl font-bold mb-4">Group Settings</h2>
                <GroupSettings
                  group={groupData}
                  isLeader={userId === groupData.leaderId}
                  onUpdate={fetchGroupData}
                  maxGroupSize={maxGroupSize}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
      <Footer />
    </>
  );
}