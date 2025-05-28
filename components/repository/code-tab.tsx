"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitBranchIcon,
  UsersIcon,
  ClockIcon,
  FileIcon,
  FolderIcon,
  ChevronRightIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { EmptyRepositoryWelcome } from "./empty-repository-welcome";
import { getRepositoryEndpoints } from "@/config/api";

interface TreeNode {
  path: string;
  type: "file" | "directory";
}

interface Commit {
  id: string;
  message: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  } | null;
}

interface CodeTabProps {
  ownerId: string;
  repoId: string;
  defaultBranchName: string;
}

export function CodeTab({ ownerId, repoId, defaultBranchName }: CodeTabProps) {
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [isFileTreeLoading, setIsFileTreeLoading] = useState(true);
  const [lastCommit, setLastCommit] = useState<Commit | null>(null);
  const [readme, setReadme] = useState<string>("");

  // Fetch file tree and related data
  useEffect(() => {
    async function fetchData() {
      setIsFileTreeLoading(true);
      
      try {
        // Use the new endpoint mapping
        const treeResponse = await fetch(
          getRepositoryEndpoints.tree(ownerId, repoId, defaultBranchName)
        );
        
        if (treeResponse.ok) {
          const { tree } = await treeResponse.json();
          setFileTree(tree as TreeNode[]);
        }

        // Fetch README
        try {
          const readmeResponse = await fetch(
            getRepositoryEndpoints.readme(ownerId, repoId, defaultBranchName)
          );
          
          if (readmeResponse.ok) {
            const { content } = await readmeResponse.json();
            // Sanitize and convert markdown to HTML
            const htmlContent = DOMPurify.sanitize(await marked(content));
            setReadme(htmlContent);
          }
        } catch (readmeError) {
          console.warn("Failed to load README:", readmeError);
        }

        // Fetch last commit
        try {
          const commitsResponse = await fetch(
            `${getRepositoryEndpoints.commits(ownerId, repoId)}?limit=1`
          );
          if (commitsResponse.ok) {
            const commits: Commit[] = await commitsResponse.json();
            if (commits?.length > 0) {
              setLastCommit(commits[0]);
            }
          }
        } catch (commitError) {
          console.warn("Failed to load commits:", commitError);
        }
      } catch (error) {
        console.error("Error fetching repository file tree:", error);
      } finally {
        setIsFileTreeLoading(false);
      }
    }

    if (defaultBranchName) {
      fetchData();
    }
  }, [ownerId, repoId, defaultBranchName]);

  if (isFileTreeLoading) {
    return (
      <div className="border rounded-lg shadow-sm overflow-hidden p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 mb-3">
            {i % 2 === 0 ? (
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <Skeleton className="h-4 w-64" />
          </div>
        ))}
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <EmptyRepositoryWelcome 
        ownerId={ownerId} 
        repoId={repoId} 
        defaultBranchName={defaultBranchName} 
      />
    );
  }

  return (
    <>
      {/* File Explorer */}
      <div className="border rounded-lg shadow-sm overflow-hidden">
        {/* Branch selector and code navigation */}
        <div className="bg-muted/40 border-b p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <GitBranchIcon className="h-4 w-4" />
              <span>{defaultBranchName}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <span>Code</span>
            </Button>
          </div>
        </div>
        
        {/* Last commit info */}
        {lastCommit && (
          <div className="bg-background border-b p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium">
                  {lastCommit.author 
                    ? `${lastCommit.author.firstName} ${lastCommit.author.lastName}` 
                    : 'Unknown'}
                </span>
                <span className="text-muted-foreground text-sm">
                  {lastCommit.message && lastCommit.message.length > 60 
                    ? `${lastCommit.message.substring(0, 60)}...` 
                    : lastCommit.message || 'No commit message'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {new Date(lastCommit.createdAt).toLocaleDateString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {lastCommit.id.substring(0, 7)}
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        {/* File explorer */}
        <div className="bg-background divide-y">
          {fileTree.sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === "directory" ? -1 : 1;
              }
              return a.path.localeCompare(b.path);
            })
            .map((item, index) => {
              const pathParts = item.path.split('/');
              const name = pathParts[pathParts.length - 1];
              
              if (pathParts.length !== 1) return null;
              
              return (
                <Link 
                  key={index}
                  href={`/${ownerId}/${repoId}/${item.type === 'directory' ? 'tree' : 'blob'}/${defaultBranchName}/${item.path}`}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.type === 'directory' ? (
                      <FolderIcon className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{name}</span>
                  </div>
                  {item.type === 'directory' && (
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Link>
              );
            }).filter(Boolean)}
        </div>
      </div>

      {/* Display README if available */}
      {readme && (
        <div className="border rounded-lg shadow-sm overflow-hidden mt-6">
          <div className="bg-muted/40 border-b p-4">
            <h2 className="font-semibold">README.md</h2>
          </div>
          <div className="p-6 bg-background">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: readme }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 