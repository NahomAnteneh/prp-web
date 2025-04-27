"use client";
import Link from "next/link";
import { File as FileIcon, Folder, ChevronRight } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
}

interface FolderViewProps {
  items: FileItem[];
  branch: string;
  owner: string;
  repo: string;
}

export default function FolderView({ items, branch, owner, repo }: FolderViewProps) {
  return (
    <div className="divide-y">
      {items.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          This folder is empty
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.path}
            className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              {item.type === "directory" ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <FileIcon className="h-4 w-4 text-gray-500" />
              )}
              <Link
                href={
                  item.type === "directory"
                    ? `/${owner}/${repo}/tree/${branch}/${item.path}`
                    : `/${owner}/${repo}/blob/${branch}/${item.path}`
                }
                className="hover:underline"
              >
                {item.name}
              </Link>
            </div>
            {item.type === "file" && item.size !== undefined && (
              <div className="text-sm text-muted-foreground">
                {formatBytes(item.size)}
              </div>
            )}
            {item.type === "directory" && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
