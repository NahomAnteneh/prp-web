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
  members: { userId: string }[];
  invites: GroupInvite[];
}

export default function GroupPage() {
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
    // If user not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // Fetch current user's group information
      fetchGroupData();
      // Fetch rules including max group size
      fetchMaxGroupSize();
    }
  }, [status, session, router]);

  const userId = session?.user.userId;

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/groups/my-group');
      const data = await response.json();

      if (response.ok) {
        setGroupData({
          ...data,
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
  if (!groupData) {
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
      <Navbar />
      <div className="container mx-auto py-6 max-w-6xl">
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <h2 className="text-xl font-bold mb-4">Group Overview</h2>
            <GroupOverview
              group={groupData}
              maxGroupSize={maxGroupSize}
              isLeader={userId === groupData.leaderId}
              onUpdate={fetchGroupData}
            />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectsList
              groupId={groupData.id}
              isLeader={userId === groupData.leaderId}
            />
          </TabsContent>

          <TabsContent value="repositories" className="mt-6">
            <RepositoriesList
              groupId={groupData.id}
              groupName={groupData.name}
              isLeader={userId === groupData.leaderId}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <GroupSettings
              group={groupData}
              maxGroupSize={maxGroupSize}
              isLeader={!!userId && userId === groupData.leaderId}
              onUpdate={fetchGroupData}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </>
  );
}