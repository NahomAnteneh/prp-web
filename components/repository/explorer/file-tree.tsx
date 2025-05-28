"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import ShallowLink from "@/components/shallow-link";

// ----------- Types -----------
interface TreeNode {
  path: string; // e.g., "src/index.ts"
  type: "file" | "directory";
}

interface ProcessedTreeNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children: Record<string, ProcessedTreeNode>;
}

interface FileTreeProps {
  className?: string;
  initialData: TreeNode[]; // Array of TreeNode from Prisma
  repositoryId: string;
  commitId: string;
}

// ----------- Helper to build hierarchical tree -----------

function buildTree(nodes: TreeNode[]): ProcessedTreeNode {
  const root: ProcessedTreeNode = {
    name: "root",
    type: "directory",
    path: "",
    children: {},
  };

  // Sort so directories appear before files, then alphabetical
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const node of sortedNodes) {
    const pathParts = node.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (!part) continue;

      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === pathParts.length - 1;

      if (!currentLevel.children[part]) {
        currentLevel.children[part] = {
          name: part,
          type: isLastPart && node.type === "file" ? "file" : "directory",
          path: currentPath,
          children: {},
        };
      }

      currentLevel = currentLevel.children[part];
    }
  }

  return root;
}

// ----------- Recursive Tree Node Component -----------

interface TreeNodeProps {
  node: ProcessedTreeNode;
  level: number;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
  selectedFile: string | null;
  setSelectedFile: (path: string) => void;
  repositoryId: string;
  commitId: string;
}

function TreeNode({
  node,
  level,
  expandedFolders,
  toggleFolder,
  selectedFile,
  setSelectedFile,
  repositoryId,
  commitId,
}: TreeNodeProps) {
  const pathname = usePathname();

  const isDirectory = node.type === "directory";
  const isExpanded = expandedFolders[node.path];
  const hasChildren = Object.keys(node.children).length > 0;
  const childrenArray = Object.values(node.children);

  // Construct link path for the node
  const linkBase = `/repository/${repositoryId}/commit/${commitId}/${isDirectory ? "tree" : "blob"}`;
  const linkPath = `${linkBase}/${node.path}`;
  const isSelected = pathname === linkPath;

  // Skip the "root" node and just render its children
  if (node.name === "root") {
    return (
      <>
        {childrenArray.map((child, index) => (
          <TreeNode
            key={child.path}
            node={child}
            level={0}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            repositoryId={repositoryId}
            commitId={commitId}
          />
        ))}
      </>
    );
  }

  if (isDirectory) {
    return (
      <div className="select-none group">
        {/* DIRECTORY ROW */}
        <div
          className={cn("flex items-center py-1 px-2 relative")}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Guide lines on hover */}
          {level > 0 && (
            <div
              className="absolute left-0 top-0 h-full group-hover:border-l"
              style={{ left: `${(level - 1) * 16 + 8}px` }}
            />
          )}
          {level > 0 && (
            <div
              className="absolute top-1/2 h-0 group-hover:border-t"
              style={{
                left: `${(level - 1) * 16 + 8}px`,
                width: "8px",
                transform: "translateY(-50%)",
              }}
            />
          )}

          {/* Chevron toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
              className="mr-1 h-4 w-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="mr-1 h-4 w-4" />
          )}

          {/* Directory link */}
          <ShallowLink
            href={linkPath}
            className="flex items-center flex-1 no-underline cursor-pointer"
          >
            <Folder className="h-4 w-4 text-[#6b9eff] mr-2" />
            <span className="text-sm">{node.name}</span>
          </ShallowLink>
        </div>

        {/* CHILDREN */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {childrenArray.map((child, index) => (
              <TreeNode
                key={child.path}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                repositoryId={repositoryId}
                commitId={commitId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // FILE NODE
  return (
    <ShallowLink
      href={linkPath}
      className={cn("flex items-center py-1 px-2 relative no-underline group")}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
    >
      {/* Guide lines on hover */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 h-full group-hover:border-l"
          style={{ left: `${(level - 1) * 16 + 8}px` }}
        />
      )}
      {level > 0 && (
        <div
          className="absolute top-1/2 h-0 group-hover:border-t"
          style={{
            left: `${(level - 1) * 16 + 8}px`,
            width: "8px",
            transform: "translateY(-50%)",
          }}
        />
      )}

      <span className="mr-1 h-4 w-4" />
      <File className="h-4 w-4 text-gray-400 mr-2" />
      <span className="text-sm hover:underline">{node.name}</span>
    </ShallowLink>
  );
}

// ----------- Main FileTree Component -----------

export function FileTree({ className, initialData, repositoryId, commitId }: FileTreeProps) {
  const pathname = usePathname();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const processedTree = useMemo(() => {
    if (!initialData) return null;
    return buildTree(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!processedTree || !pathname) return;
    const splitted = pathname.split("/");
    const index = splitted.findIndex((part) => part === "blob" || part === "tree");
    if (index === -1 || splitted.length <= index + 2) return;
    // Expand each segment in the path
    const subPath = splitted.slice(index + 2).join("/");
    if (!subPath) return;
    let currentPath = "";
    for (const segment of subPath.split("/")) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      setExpandedFolders((prev) => ({ ...prev, [currentPath]: true }));
    }
  }, [pathname, processedTree]);

  if (!processedTree) {
    return <div className="text-center">No data available</div>;
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className={cn("overflow-auto", className)}>
      <TreeNode
        node={processedTree}
        level={0}
        expandedFolders={expandedFolders}
        toggleFolder={toggleFolder}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        repositoryId={repositoryId}
        commitId={commitId}
      />
    </div>
  );
}