"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ExplorerView from "@/components/repository/explorer/explorer-view";

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

  return (
    <ExplorerView
      fileTree={fileTree}
      fileData={null}
      isLoading={isLoading}
    />
  );
}