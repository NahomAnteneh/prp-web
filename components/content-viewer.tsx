"use client";

import ShikiHighlighter from "react-shiki";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Define a custom FileType based on the Prisma schema
interface FileType {
  name: string; // e.g., filePath from FileChange
  content?: string; // Text content for text files (optional)
  url?: string; // URL to file content (for binary or hosted files)
  isBinary: boolean; // Determine if file is binary based on extension or metadata
}

interface ContentProp {
  file: FileType; // Non-null file object
  url: string; // URL to file content (used for binary files or as fallback)
}

const BinaryViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

  const imageFormats = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"];
  const videoFormats = ["mp4", "webm", "ogg"];
  const pdfFormats = ["pdf"];

  if (imageFormats.includes(fileExtension)) {
    return <img src={url} alt={file.name} />;
  } else if (videoFormats.includes(fileExtension)) {
    return (
      <video controls className="max-w-full">
        <source src={url} type={`video/${fileExtension}`} />
        Your browser does not support the video tag.
      </video>
    );
  } else if (pdfFormats.includes(fileExtension)) {
    return (
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          url
        )}`}
        className="w-full h-full min-h-[80vh] border-none"
      />
    );
  }

  // Fallback for unsupported binary files
  return (
    <div className="p-4 font-mono text-xs">
      Binary file not supported for preview: {file.name}
    </div>
  );
};

const useThemeDetector = () => {
  const getCurrentTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
  const mqListener = (e: MediaQueryListEvent) => {
    setIsDarkTheme(e.matches);
  };

  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", mqListener);
    return () => darkThemeMq.removeEventListener("change", mqListener);
  }, []);
  return isDarkTheme;
};

const TextViewer: React.FC<ContentProp> = ({ file, url }) => {
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const { theme } = useTheme();
  const isDarkTheme = useThemeDetector();

  if (fileExtension === "svg") {
    return <img src={url} alt={file.name} />;
  }

  // Use file.content if available (for text files), otherwise fetch content (not implemented here)
  const content = file.content || "";

  return (
    <ShikiHighlighter
      language={fileExtension}
      className="text-sm"
      theme={
        theme === "system"
          ? isDarkTheme
            ? "github-dark-default"
            : "github-light"
          : theme ?? "github-light"
      }
      defaultColor="#000000"
      cssVariablePrefix="shiki"
    >
      {content}
    </ShikiHighlighter>
  );
};

const ContentViewer: React.FC<ContentProp> = ({ file, url }) => {
  return file.isBinary ? (
    <BinaryViewer file={file} url={url} />
  ) : (
    <TextViewer file={file} url={url} />
  );
};

export default ContentViewer;