"use client";

import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Clipboard, Check, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FileType {
  name: string;
  content?: string;
  url?: string;
  isBinary: boolean;
}

interface BreadcrumbsProps {
  ownerId: string;
  repoId: string;
  branch: string;
  path?: string[];
  fileData?: FileType | null; // File data for blob view
}

export function Breadcrumbs({ ownerId, repoId, branch, path = [], fileData }: BreadcrumbsProps) {
  const pathname = usePathname();
  const [isCopied, setIsCopied] = useState(false);

  // Determine if we're in blob (file) view
  const segments = pathname.split("/").filter(Boolean);
  const isBlobView = useMemo(() => segments.includes("blob"), [segments]);
  
  // Get path segments for breadcrumbs
  const pathSegments = Array.isArray(path) ? path : [];

  // URL for raw file
  const rawUrl = fileData?.url || "";

  const handleCopy = async () => {
    if (fileData?.content) {
      await navigator.clipboard.writeText(fileData.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap py-1">
        <Link
          href={`/${ownerId}/${repoId}`}
          className="text-blue-600 hover:underline"
        >
          {repoId}
        </Link>
        
        {pathSegments.length > 0 && (
          <div className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            {pathSegments.map((segment, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                <Link
                  href={`/${ownerId}/${repoId}/${isBlobView ? 'blob' : 'tree'}/${branch}/${pathSegments
                    .slice(0, index + 1)
                    .join("/")}`}
                  className="text-blue-600 hover:underline"
                >
                  {decodeURIComponent(segment)}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Copy button and raw link for text files in blob view */}
      {isBlobView && fileData && (
        <div className="flex items-center">
          {!fileData.isBinary && fileData.content && (
            <button
              onClick={handleCopy}
              className="hover:bg-muted/50 transition-all flex items-center gap-1 px-2 py-1 rounded-md text-sm"
            >
              {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
              {isCopied ? "Copied!" : "Copy"}
            </button>
          )}
          {rawUrl && (
            <a
              href={rawUrl}
              className="hover:bg-muted/50 transition-all flex items-center gap-1 px-2 py-1 rounded-md text-sm ml-2"
            >
              View Raw
            </a>
          )}
        </div>
      )}
    </div>
  );
}