"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Folder, File } from "lucide-react";
import ShallowLink from "@/components/shallow-link";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Define custom TreeNode type based on Prisma schema
interface TreeNode {
  path: string; // e.g., "src/index.ts" from FileChange.filePath
  type: "file" | "directory"; // "file" for files, "directory" for inferred folders
}

// Define props interface
interface FolderViewProps {
  data: TreeNode[];
  repositoryId: string; // Repository ID from schema
  commitId: string; // Commit ID from schema
  hardnav?: boolean; // Whether to use hard navigation (Link) or shallow navigation (ShallowLink)
}

export function FolderView({
  data,
  repositoryId,
  commitId,
  hardnav = false,
}: FolderViewProps) {
  const pathname = usePathname();

  // Get path segments from pathname
  const pathSegments = pathname ? pathname.split("/").slice(5) : [];
  const currentRelativePath = decodeURIComponent(pathSegments.join("/"));

  // Use props for base paths
  const basePath = `/repository/${repositoryId}/`;
  const folderBasePath = `${basePath}commit/${commitId}/tree/`;
  const fileBasePath = `${basePath}commit/${commitId}/blob/`;

  // Determine parent path based on current relative path
  const isRoot = currentRelativePath === "";
  const parentPath = isRoot
    ? folderBasePath
    : folderBasePath + currentRelativePath.split("/").slice(0, -1).join("/");

  if (!data) {
    return <div>No data available.</div>;
  }

  const LinkComponent = hardnav ? Link : ShallowLink;

  return (
    <div className="">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* <TableHead className="w-full text-muted-foreground">Name</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Parent directory row */}
          {isRoot ? null : (
            <TableRow className="hover:bg-muted/30">
              <TableCell className="font-medium">
                <LinkComponent
                  className="flex items-center gap-2"
                  href={parentPath}
                >
                  <Folder
                    className="h-5 w-5 text-muted-foreground"
                    stroke=""
                    fill="currentColor"
                  />
                  <span>..</span>
                </LinkComponent>
              </TableCell>
            </TableRow>
          )}

          {/* Sort directories first, then files */}
          {data
            .sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === "directory" ? -1 : 1;
              }
              return a.path.localeCompare(b.path);
            })
            .map((node) => {
              const link = node.path;
              // Construct full href using base paths
              const href = `${
                node.type === "directory" ? folderBasePath : fileBasePath
              }${link}`;

              return (
                <TableRow
                  key={node.path}
                  className="hover:bg-muted/30 !border-b"
                >
                  <TableCell className="font-medium">
                    <LinkComponent
                      className="flex items-center gap-2 hover:underline"
                      href={href}
                    >
                      {node.type === "directory" ? (
                        <Folder
                          className="h-5 w-5 text-muted-foreground"
                          stroke="none"
                          fill="currentColor"
                        />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span>{getFileName(node.path)}</span>
                    </LinkComponent>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper function to get the file or directory name from the path
function getFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? "unknown";
}

export default FolderView;