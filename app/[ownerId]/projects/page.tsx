'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import ProjectsList from '@/components/project/projects-list';
import Navbar from '@/components/student/navbar';
import Footer from '@/components/student/footer';

interface GroupData {
  id: string;
  name: string;
  leaderId: string | null;
}

export default function ProjectsPage() {
  const params = useParams();
  const ownerId = params?.ownerId as string;
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!ownerId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch group information: ${response.statusText}`);
        }
        
        const data: GroupData = await response.json();
        setGroupData(data);
        
        // Check if current user is the group leader
        if (status === 'authenticated' && session?.user?.userId === data.leaderId) {
          setIsLeader(true);
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
        setError('Error loading group information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchGroupData();
    }
  }, [ownerId, session, status]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="container mx-auto py-10 text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                Error Loading Projects
              </h2>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        ) : !groupData ? (
          <div className="container mx-auto py-10 text-center">
            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
              <h2 className="text-xl font-semibold text-amber-700 dark:text-amber-400 mb-2">
                Group Not Found
              </h2>
              <p className="text-amber-600 dark:text-amber-300">
                We couldn't find a group with the ID '{ownerId}'. Please check the URL and try again.
              </p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto py-10">
            <ProjectsList groupId={groupData.id} isLeader={isLeader} ownerId={ownerId} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
