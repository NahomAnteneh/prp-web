"use client";

import { useParams, usePathname } from "next/navigation";
import FolderView from "@/components/repository/repository-file-list";
import ContentViewer from "@/components/content-viewer";
import { File, FileX, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// Define types based on Prisma schema
interface TreeNode {
  path: string; // e.g., "src/index.ts"
  type: "file" | "directory";
}

interface FileType {
  name: string; // e.g., filePath
  content?: string; // Text content for text files
  url?: string; // URL for binary files
  isBinary: boolean;
}

// Props interface (data is passed from parent)
interface ExplorerViewProps {
  fileTree: TreeNode[];
  fileData: FileType | null; // For blob view
  isLoading: boolean;
}

const skeletonWidths = [
  "w-32",
  "w-64",
  "w-48",
  "w-56",
  "w-40",
  "w-72",
  "w-80",
  "w-96",
  "w-52",
  "w-60",
  "w-36",
  "w-44",
  "w-68",
  "w-84",
  "w-88",
  "w-92",
];

// Helper function to derive folder contents from the file tree
const deriveFolderContents = (
  repoTree: TreeNode[],
  folderPath: string
): TreeNode[] => {
  const tree: TreeNode[] = [];
  const subdirs = new Map<string, TreeNode>();
  const prefix = folderPath ? folderPath + "/" : "";
  const pathDepth = folderPath ? folderPath.split("/").length : 0;

  // Set of existing paths
  const existingPaths = new Set(repoTree.map((node) => node.path));

  for (const node of repoTree) {
    let nodePath = node.path;
    nodePath = nodePath.startsWith("/") ? nodePath.substring(1) : nodePath;

    let isInCorrectPath = false;
    let relativePath = "";

    if (!folderPath) {
      isInCorrectPath = true;
      relativePath = nodePath;
    } else if (nodePath.startsWith(prefix)) {
      isInCorrectPath = true;
      relativePath = nodePath.substring(prefix.length);
    }

    if (isInCorrectPath) {
      const relativePathParts = relativePath.split("/");
      const currentDepth = nodePath.split("/").length;

      if (currentDepth === pathDepth + 1) {
        tree.push(node);
      } else if (currentDepth > pathDepth + 1) {
        const subdirName = nodePath.split("/")[pathDepth];
        const subdirPath = nodePath
          .split("/")
          .slice(0, pathDepth + 1)
          .join("/");

        if (
          subdirName &&
          !subdirs.has(subdirName) &&
          !existingPaths.has(subdirPath)
        ) {
          const subdirNode: TreeNode = {
            path: subdirPath,
            type: "directory",
          };
          subdirs.set(subdirName, subdirNode);
        }
      }
    }
  }

  tree.push(...Array.from(subdirs.values()));

  tree.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  return tree;
};

export default function ExplorerView({
  fileTree,
  fileData,
  isLoading,
}: ExplorerViewProps) {
  const params = useParams<{
    repositoryId: string;
    commitId: string;
    path?: string | string[];
  }>();
  const pathname = decodeURIComponent(usePathname());

  const repositoryId = params?.repositoryId;
  const commitId = params?.commitId;

  const pathSegments = pathname?.split("/") ?? [];
  const relativePath =
    pathSegments.length > 5 ? pathSegments.slice(5).join("/") : "";
  const formattedPath = decodeURIComponent(relativePath);

  const isBlobView = useMemo(() => pathSegments[3] === "blob", [pathSegments]);
  const isTreeView = useMemo(() => pathSegments[3] === "tree", [pathSegments]);

  // Derive folder data
  const derivedFolderData = useMemo(() => {
    if (isTreeView) {
      return deriveFolderContents(fileTree, formattedPath);
    }
    return null;
  }, [isTreeView, formattedPath, fileTree]);

  if (isLoading && isTreeView) {
    return (
      <div className="">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Empty header */}
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

  // Render Tree View
  if (isTreeView && derivedFolderData && repositoryId && commitId) {
    return (
      <div>
        <FolderView
          data={derivedFolderData}
          repositoryId={repositoryId}
          commitId={commitId}
        />
      </div>
    );
  }

  if (isBlobView && !fileData) {
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

  // Render Blob View
  if (isBlobView && fileData && repositoryId && commitId) {
    const url = fileData.url || "";
    return (
      <div className="rounded-lg bg-background flex flex-col">
        <div className="overflow-auto">
          <ContentViewer file={fileData} url={url} />
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-4 text-muted-foreground">
      Select a file or folder to view.
    </div>
  );
}