"use client";

import React from 'react';
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ImgHTMLAttributes } from 'react';

interface MarkdownContentProps {
  content: string;
  owner: string;
  repository: string;
  branch: string;
}

// Add a helper function to transform image URLs.
function transformImgUrl(
  src: string | undefined,
  owner: string,
  repository: string,
  branch: string
): string {
  // Your logic to change the image URL.
  if (!src) return "";

  if (src.startsWith("http")) {
    return src;
  }

  // Use your own content API endpoint
  return `/api/repositories/${owner}/${repository}/raw?branch=${branch || 'main'}&path=${src}`;
}

export function RepositoryMarkdown({ content, owner, repository, branch }: MarkdownContentProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => {
            const safeSrc = typeof src === 'string' ? src : '';
            return (
              <img
                src={transformImgUrl(safeSrc, owner, repository, branch)}
                alt={alt || ""}
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

export default RepositoryMarkdown; 