"use client";

import { useParams, usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Clipboard, Check } from "lucide-react";
import Link from "next/link";
import type { FileContent } from "@/app/api/repositories/[owner]/[repo]/file/route";

export function Breadcrumbs() {
  const params = useParams();
  const pathname = usePathname();
  const { owner, repository } = params;
  const [isCopied, setIsCopied] = useState(false);
  const [fileData, setFileData] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if we're in blob (file) view and derive branch and path
  const segments = pathname.split("/").filter(Boolean);
  const isBlobView = useMemo(() => segments[2] === "blob", [segments]);
  const branch = segments[3] || "";
  const formattedPath = segments.slice(4).join("/");

  // Fetch file content for blob view
  useEffect(() => {
    const fetchFileContent = async () => {
      if (!isBlobView || !formattedPath || !owner || !repository) return;
      
      try {
        setIsLoading(true);
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
        setFileData(data);
      } catch (err) {
        console.error('Error fetching file content:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFileContent();
  }, [isBlobView, formattedPath, owner, repository, branch]);

  // Get the path segments after the repository name
  const path = pathname
    .split("/")
    .filter(Boolean)
    .slice(3) // Remove owner, repository, and tree/blob
    .filter((segment) => segment !== "tree" && segment !== "blob");

  // Construct the raw file URL using our API
  const rawUrl = fileData?.rawUrl || 
    `/api/repositories/${owner}/${repository}/file/raw?path=${encodeURIComponent(formattedPath)}&branch=${branch}`;

  const handleCopy = async () => {
    if (fileData?.text) {
      await navigator.clipboard.writeText(fileData.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-stretch gap-2 text-sm text-muted-foreground justify-between">
      <div className="flex items-center gap-2 p-4">
        <Link
          href={`/${owner}/${repository}`}
          className="hover:text-foreground transition-colors"
        >
          {repository}
        </Link>
        {path.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <span>/</span>
            <Link
              href={`/${owner}/${repository}/tree/${path
                .slice(0, index + 1)
                .join("/")}`}
              className="hover:text-foreground transition-colors"
            >
              {decodeURIComponent(segment)}
            </Link>
          </div>
        ))}
      </div>
      {/* Copy button for text files in blob view */}
      <div className="flex items-stretch">
        {isBlobView &&
          fileData &&
          !fileData.isBinary && (
            <button
              onClick={handleCopy}
              className="hover:text-foreground transition-all flex items-center gap-1 border-l px-4 border-l-foreground/20 cursor-pointer"
            >
              {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
              {isCopied ? "Copied!" : "Copy"}
            </button>
          )}

        {isBlobView && (
          <a
            href={rawUrl}
            className="hover:text-foreground transition-colors flex items-center gap-1 border-l border-l-foreground/20 px-4 hover:underline"
          >
            View Raw
          </a>
        )}
      </div>
    </div>
  );
}
