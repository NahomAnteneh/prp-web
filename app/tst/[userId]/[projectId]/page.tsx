import { Metadata } from 'next';

// Generate metadata that properly handles async params
export async function generateMetadata({ 
  params 
}: { 
  params: { userId: string, projectId: string } 
}): Promise<Metadata> {
  // Await the params
  const userId = params.userId;
  const projectId = params.projectId;
  
  return {
    title: `Project ${projectId} - User ${userId}`,
  };
}

export default async function ProjectPage({ 
  params 
}: { 
  params: { userId: string, projectId: string } 
}) {
  // Safely await and destructure params
  const userId = params.userId;
  const projectId = params.projectId;
  
  return (
    <div>
      <h1>Project page {projectId}</h1>
      <p>User: {userId}</p>
    </div>
  );
}
  