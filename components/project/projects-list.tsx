import { useState, useEffect } from 'react';

interface ProjectsListProps {
  groupId: string;
  isLeader: boolean;
  ownerId: string;
}

export default function ProjectsList({ groupId, isLeader, ownerId }: ProjectsListProps) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [groupId]);

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div className="grid gap-4">
          {projects.map((project: any) => (
            <div key={project.id} className="p-4 border rounded-lg">
              <h2 className="font-semibold">{project.name}</h2>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 