'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ProjectCard, { Project } from './project-card';
import CreateProjectModal from './create-project-modal';
import { useSession } from 'next-auth/react';

interface ProjectsListProps {
  groupId: string;
  isLeader: boolean;
  ownerId: string;
}

interface ProjectResponse {
  projects: Project[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function ProjectsList({ groupId, isLeader, ownerId }: ProjectsListProps) {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [projectData, setProjectData] = useState<ProjectResponse>({
    projects: [],
    pagination: { total: 0, limit: 5, offset: 0, hasMore: false }
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = async (offset: number, limit: number, append: boolean = false) => {
    try {
      const loadingAction = append ? setIsLoadingMore : setIsLoading;
      loadingAction(true);
      
      const url = `/api/groups/${groupId}/projects?offset=${offset}&limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects');
      }

      // Ensure data has the expected structure
      const normalizedData: ProjectResponse = {
        projects: Array.isArray(data.projects) ? data.projects.slice(0, limit) : Array.isArray(data) ? data.slice(0, limit) : [],
        pagination: data.pagination || {
          total: Array.isArray(data.projects) ? data.projects.length : Array.isArray(data) ? data.length : 0,
          limit,
          offset,
          hasMore: (Array.isArray(data.projects) ? data.projects.length : Array.isArray(data) ? data.length : 0) > offset + limit
        }
      };

      if (append) {
        setProjectData({
          projects: [...projectData.projects, ...normalizedData.projects],
          pagination: normalizedData.pagination
        });
      } else {
        setProjectData(normalizedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      toast.error('Error fetching projects', {
        description: errorMessage,
      });
      setProjectData({
        projects: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchProjects(0, 5);
    }
  }, [groupId]);

  const handleLoadMore = () => {
    if (projectData.pagination.hasMore) {
      const newOffset = projectData.pagination.offset + projectData.pagination.limit;
      fetchProjects(newOffset, projectData.pagination.limit, true);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        {isLeader && status === "authenticated" && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projectData.projects.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <h3 className="text-xl font-medium mb-2">No Projects Found</h3>
          <p className="text-muted-foreground mb-6">
            {isLeader 
              ? "This group doesn't have any projects yet. Create your first project to get started."
              : "This group doesn't have any projects yet."}
          </p>
          {isLeader && status === "authenticated" && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {projectData.projects.map((project) => (
              <ProjectCard key={project.id} project={project} ownerId={ownerId} />
            ))}
          </div>
          
          {projectData.pagination.hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                disabled={isLoadingMore}
                onClick={handleLoadMore}
                className="min-w-[150px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
      
      {isLeader && (
        <CreateProjectModal
          groupId={groupId}
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={() => fetchProjects(0, 5)}
        />
      )}
    </div>
  );
} 