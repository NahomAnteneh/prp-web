"use client";

import { useParams, usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { TreeNode } from "@/app/api/repositories/[owner]/[repo]/tree/route";
import type { FileContent } from "@/app/api/repositories/[owner]/[repo]/file/route";
import FolderView from "@/app/[owner]/[repository]/_components/repository-file-list";
import ContentViewer from "@/components/content-viewer";
import { File, FileX, Folder } from "lucide-react";
import { Skeleton } from "../../../../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../../../components/ui/table";
import { cn } from "@/lib/utils";

const skeletonWidths = [
  "w-32", "w-64", "w-48", "w-56", "w-40", "w-72", "w-80", "w-96",
  "w-52", "w-60", "w-36", "w-44", "w-68", "w-84", "w-88", "w-92",
];

// Helper function to derive folder contents from the full repo tree
const deriveFolderContents = (
  repoTree: TreeNode[],
  folderPath: string
): TreeNode[] => {
  const tree: TreeNode[] = [];
  const subdirs = new Map<string, TreeNode>();
  const prefix = folderPath ? folderPath + "/" : "";
  const pathDepth = folderPath ? folderPath.split("/").length : 0;

  // Set of existing paths from the API response
  const existingPaths = new Set(repoTree.map((node) => node.path));

  for (const node of repoTree) {
    let nodePath = node.path;
    nodePath = nodePath.startsWith("/") ? nodePath.substring(1) : nodePath;

    let isInCorrectPath = false;
    let relativePath = "";
    let currentDepth = nodePath.split("/").length;

    if (!folderPath) {
      isInCorrectPath = true;
      relativePath = nodePath;
    } else if (nodePath.startsWith(prefix)) {
      isInCorrectPath = true;
      relativePath = nodePath.substring(prefix.length);
    }

    if (isInCorrectPath) {
      const relativePathParts = relativePath.split("/");

      if (currentDepth === pathDepth + 1) {
        tree.push(node);
      } else if (currentDepth > pathDepth + 1) {
        const subdirName = nodePath.split("/")[pathDepth];
        const subdirPath = nodePath
          .split("/")
          .slice(0, pathDepth + 1)
          .join("/");

        // Only add synthesized subdir if it doesn't already exist and isn't in the original tree
        if (
          subdirName &&
          !subdirs.has(subdirName) &&
          !existingPaths.has(subdirPath)
        ) {
          const subdirNode: TreeNode = {
            path: subdirPath,
            type: "tree",
          };
          subdirs.set(subdirName, subdirNode);
        }
      }
    }
  }

  tree.push(...Array.from(subdirs.values()));

  tree.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "tree" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  return tree;
};

export default function ExplorerView() {
  const params = useParams<{
    owner: string;
    repository: string;
    branch: string;
    path?: string | string[];
  }>();
  const pathname = decodeURIComponent(usePathname());

  const owner = params?.owner;
  const repository = params?.repository;
  const branch = params?.branch;

  const pathSegments = pathname?.split("/") ?? [];
  const relativePath =
    pathSegments.length > 5 ? pathSegments.slice(5).join("/") : "";
  const formattedPath = decodeURIComponent(relativePath);

  const isBlobView = useMemo(() => pathSegments[3] === "blob", [pathSegments]);
  const isTreeView = useMemo(() => pathSegments[3] === "tree", [pathSegments]);

  // State for API data
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [repoTree, setRepoTree] = useState<TreeNode[] | null>(null);
  const [folderContents, setFolderContents] = useState<TreeNode[] | null>(null);
  
  // Loading and error states
  const [fileLoading, setFileLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  const queryEnabled = !!owner && !!repository && !!branch;

  // Fetch file content if in blob view
  useEffect(() => {
    const fetchFileContent = async () => {
      if (!queryEnabled || !isBlobView || !formattedPath) return;
      
      try {
        setFileLoading(true);
        const response = await fetch(`/api/repositories/${owner}/${repository}/file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: formattedPath,
            branch,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch file content');
        }
        
        const data = await response.json();
        setFileContent(data);
      } catch (err) {
        console.error('Error fetching file content:', err);
        setFileError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setFileLoading(false);
      }
    };
    
    fetchFileContent();
  }, [queryEnabled, isBlobView, owner, repository, branch, formattedPath]);

  // Fetch repository tree
  useEffect(() => {
    const fetchRepoTree = async () => {
      if (!queryEnabled) return;
      
      try {
        setTreeLoading(true);
        const response = await fetch(
          `/api/repositories/${owner}/${repository}/tree?branch=${branch}&recursive=true`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch repository tree');
        }
        
        const data = await response.json();
        setRepoTree(data.tree);
      } catch (err) {
        console.error('Error fetching repository tree:', err);
        setTreeError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setTreeLoading(false);
      }
    };
    
    fetchRepoTree();
  }, [queryEnabled, owner, repository, branch]);

  // Fetch folder view if needed
  useEffect(() => {
    const fetchFolderContents = async () => {
      if (!queryEnabled || !isTreeView || repoTree) return;
      
      try {
        setFolderLoading(true);
        const response = await fetch(
          `/api/repositories/${owner}/${repository}/folders?branch=${branch}&path=${formattedPath}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch folder contents');
        }
        
        const data = await response.json();
        setFolderContents(data);
      } catch (err) {
        console.error('Error fetching folder contents:', err);
        setFolderError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setFolderLoading(false);
      }
    };
    
    fetchFolderContents();
  }, [queryEnabled, isTreeView, repoTree, owner, repository, branch, formattedPath]);

  // Derive folder data from full tree if available
  const derivedFolderData = useMemo(() => {
    if (isTreeView && repoTree) {
      return deriveFolderContents(repoTree, formattedPath);
    }
    return null;
  }, [isTreeView, repoTree, formattedPath]);

  // Loading state
  const isLoading =
    (isTreeView && !derivedFolderData && folderLoading) ||
    (isBlobView && fileLoading);

  if (isLoading && isTreeView) {
    return (
      <div className="">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Empty header to match the actual view */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {i > 5 ? (
                      <File className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Folder
                        className="h-5 w-5 text-muted-foreground"
                        stroke="none"
                        fill="currentColor"
                      />
                    )}
                    <Skeleton className="h-4 w-64 bg-foreground/20" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isLoading && isBlobView) {
    return (
      <div className="p-4 flex flex-col">
        <div className="overflow-auto">
          <div className="flex flex-col gap-1.5 font-mono text-sm">
            {skeletonWidths.map((v, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className={cn("h-4 bg-foreground/20", v)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (isTreeView && treeError && !folderContents) {
    return (
      <div className="text-red-500 p-4">
        Error loading repository tree: {treeError}
      </div>
    );
  }
  if (isTreeView && folderError && !derivedFolderData) {
    return (
      <div className="text-red-500 p-4">
        Error loading folder: {folderError}
      </div>
    );
  }
  if (isBlobView && fileError) {
    return (
      <div className="text-red-500 p-4">
        Error loading file: {fileError}
      </div>
    );
  }

  // Render tree view
  const folderDataToRender = derivedFolderData ?? folderContents;

  if (isTreeView && folderDataToRender && owner && repository && branch) {
    return (
      <div>
        <FolderView
          branch={branch}
          owner={owner}
          repository={repository}
        />
      </div>
    );
  }

  if (isBlobView && !fileContent) {
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

  // Render blob view
  if (isBlobView && fileContent && owner && repository && branch) {
    const url = fileContent.rawUrl;
    return (
      <div className="rounded-lg bg-background flex flex-col">
        <div className="overflow-auto">
          {fileContent ? (
            <ContentViewer file={fileContent} url={url} />
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap p-4">
              No content available
            </pre>
          )}
        </div>
      </div>
    );
  }

  // Fallback or initial state
  return (
    <div className="p-4 text-muted-foreground">
      Select a file or folder to view.
    </div>
  );
}
