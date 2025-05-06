"use client";

import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Clipboard, Check } from "lucide-react";
import Link from "next/link";
import ShallowLink from "@/components/shallow-link";

interface FileType {
  name: string;
  content?: string;
  url?: string;
  isBinary: boolean;
}

interface BreadcrumbsProps {
  repositoryId: string;
  commitId: string;
  fileData: FileType | null; // File data for blob view
}

export function Breadcrumbs({ repositoryId, commitId, fileData }: BreadcrumbsProps) {
  const pathname = usePathname();
  const [isCopied, setIsCopied] = useState(false);

  // Determine if we're in blob (file) view and derive path
  const segments = pathname.split("/").filter(Boolean);
  const isBlobView = useMemo(() => segments[3] === "blob", [segments]);
  const formattedPath = segments.slice(5).join("/");

  // Get path segments for breadcrumbs
  const path = segments
    .slice(5) // Remove /repository/{repositoryId}/commit/{commitId}/[tree|blob]
    .filter((segment) => segment !== "tree" && segment !== "blob");

  // URL for raw file (from fileData.url)
  const rawUrl = fileData?.url || "";

  const handleCopy = async () => {
    if (fileData?.content) {
      await navigator.clipboard.writeText(fileData.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-stretch gap-2 text-sm text-muted-foreground justify-between">
      <div className="flex items-center gap-2 p-4">
        <Link
          href={`/repository/${repositoryId}`}
          className="hover:text-foreground transition-colors"
        >
          {repositoryId}
        </Link>
        {path.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <span>/</span>
            <ShallowLink
              href={`/repository/${repositoryId}/commit/${commitId}/tree/${path
                .slice(0, index + 1)
                .join("/")}`}
              className="hover:text-foreground transition-colors"
            >
              {decodeURIComponent(segment)}
            </ShallowLink>
          </div>
        ))}
      </div>
      {/* Copy button and raw link for text files in blob view */}
      <div className="flex items-stretch">
        {isBlobView && fileData && !fileData.isBinary && fileData.content && (
          <button
            onClick={handleCopy}
            className="hover:text-foreground transition-all flex items-center gap-1 border-l px-4 border-l-foreground/20 cursor-pointer"
          >
            {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
            {isCopied ? "Copied!" : "Copy"}
          </button>
        )}
        {isBlobView && rawUrl && (
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