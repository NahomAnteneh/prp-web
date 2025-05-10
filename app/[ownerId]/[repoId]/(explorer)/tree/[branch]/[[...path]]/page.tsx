"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ExplorerView from "@/components/repository/explorer/explorer-view";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { useSession } from "next-auth/react";
import { Breadcrumbs } from "@/components/repository/explorer/breadcrumbs";
import { Button } from "@/components/ui/button";
import { GitBranchIcon } from "lucide-react";

// Define types
interface TreeNode {
  path: string;
  type: "file" | "directory";
}

export default function Page() {
  const params = useParams<{ 
    ownerId: string; 
    repoId: string; 
    branch: string;
    path?: string[];
  }>();
  
  const { ownerId, repoId, branch, path = [] } = params;
  const { data: session } = useSession();
  
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch file tree
  useEffect(() => {
    if (!ownerId || !repoId || !branch) return;
    
    const fetchFileTree = async () => {
      setIsLoading(true);
      try {
        const pathQuery = Array.isArray(path) && path.length > 0 
          ? `/${path.join("/")}` 
          : "";
        
        const response = await fetch(
          `/api/groups/${ownerId}/repositories/${repoId}/tree/${branch}${pathQuery}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch file tree");
        }
        
        const data = await response.json();
        setFileTree(data.tree);
      } catch (err) {
        console.error("Error fetching file tree:", err);
        setError("Failed to load file tree");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFileTree();
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
          />
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <GitBranchIcon className="h-4 w-4" />
          <span>{branch}</span>
        </Button>
      </div>
      
      <ExplorerView
        fileTree={fileTree}
        fileData={null}
        isLoading={isLoading}
      />
    </div>
  );
}