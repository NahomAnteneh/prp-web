"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ContentViewer from "@/components/content-viewer";
import { FileX } from "lucide-react";

interface FileData {
  name: string;
  path: string;
  content: string | null;
  isBinary: boolean;
}

export default function BlobPage() {
  const params = useParams<{ 
    ownerId: string; 
    repoId: string; 
    branch: string;
    path: string[];
  }>();
  
  const { ownerId, repoId, branch, path = [] } = params;
  
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch file content
  useEffect(() => {
    if (!ownerId || !repoId || !branch || !path || path.length === 0) return;
    
    const fetchFileContent = async () => {
      setIsLoading(true);
      try {
        const filePath = Array.isArray(path) ? path.join("/") : path;
        const response = await fetch(
          `/api/groups/${ownerId}/repositories/${repoId}/content/${branch}/${filePath}`
        );
        
        if (!response.ok) {
          if (response.status === 404) {
            setFileData(null);
          } else {
            throw new Error("Failed to fetch file content");
          }
        } else {
          const data = await response.json();
          setFileData(data);
        }
      } catch (err) {
        console.error("Error fetching file content:", err);
        setError("Failed to load file content");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFileContent();
  }, [ownerId, repoId, branch, path]);

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-4">
        <FileX className="h-12 w-12" />
        <div className="text-lg font-medium">File not found</div>
        <div className="text-sm">
          The requested file could not be located in this repository.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-background flex flex-col">
      <div className="overflow-auto">
        <ContentViewer 
          file={{
            name: fileData.name,
            content: fileData.content || undefined,
            isBinary: fileData.isBinary
          }} 
          url={fileData.isBinary ? `/api/groups/${ownerId}/repositories/${repoId}/content/${branch}/${fileData.path}?raw=true` : ""}
        />
      </div>
    </div>
  );
}
