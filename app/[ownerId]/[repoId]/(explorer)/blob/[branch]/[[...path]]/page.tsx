"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ContentViewer from "@/components/content-viewer";
import { FileX, GitBranchIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { Breadcrumbs } from "@/components/repository/explorer/breadcrumbs";
import { Button } from "@/components/ui/button";
import ExplorerView from "@/components/repository/explorer/explorer-view";

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
  const { data: session } = useSession();
  
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

  const currentPath = Array.isArray(path) ? path.join("/") : "";

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Breadcrumbs
            ownerId={ownerId as string}
            repoId={repoId as string}
            branch={branch as string}
            path={path}
            fileData={fileData ? {
              name: fileData.name,
              content: fileData.content || undefined,
              isBinary: fileData.isBinary
            } : null}
          />
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <GitBranchIcon className="h-4 w-4" />
          <span>{branch}</span>
        </Button>
      </div>
      
      {error ? (
        <div className="p-4 text-red-600 border rounded-md">
          {error}
        </div>
      ) : isLoading ? (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted/40 border-b p-3">
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="p-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : !fileData ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-4 border rounded-md">
          <FileX className="h-12 w-12" />
          <div className="text-lg font-medium">File not found</div>
          <div className="text-sm">
            The requested file could not be located in this repository.
          </div>
        </div>
      ) : (
        <ExplorerView
          fileTree={[]}
          fileData={{
            name: fileData.name,
            content: fileData.content || undefined,
            isBinary: fileData.isBinary
          }}
          isLoading={false}
        />
      )}
    </div>
  );
}
