import { NextResponse } from "next/server";
import type { TreeNode } from "../tree/route";

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get("branch") || "main";
  const path = searchParams.get("path") || "";
  
  try {
    // In a real implementation, you would fetch folder contents from your storage system
    // This is a production-ready structure, just connect to your actual data source
    
    // Sample folder content - replace with actual data in production
    const folderContents: TreeNode[] = [];
    
    // Generate appropriate content based on the requested path
    if (!path || path === "") {
      folderContents.push(
        { path: "src", type: "tree" },
        { path: "docs", type: "tree" },
        { path: "tests", type: "tree" },
        { path: "package.json", type: "blob" },
        { path: "README.md", type: "blob" },
        { path: "tsconfig.json", type: "blob" }
      );
    } else if (path === "src") {
      folderContents.push(
        { path: "src/components", type: "tree" },
        { path: "src/utils", type: "tree" },
        { path: "src/pages", type: "tree" },
        { path: "src/index.ts", type: "blob" },
        { path: "src/types.ts", type: "blob" }
      );
    } else if (path === "src/components") {
      folderContents.push(
        { path: "src/components/Button.tsx", type: "blob" },
        { path: "src/components/Card.tsx", type: "blob" },
        { path: "src/components/index.ts", type: "blob" }
      );
    } else if (path === "docs") {
      folderContents.push(
        { path: "docs/getting-started.md", type: "blob" },
        { path: "docs/api.md", type: "blob" }
      );
    } else if (path === "tests") {
      folderContents.push(
        { path: "tests/unit", type: "tree" },
        { path: "tests/integration", type: "tree" }
      );
    } else if (path === "tests/unit") {
      folderContents.push(
        { path: "tests/unit/helpers.test.ts", type: "blob" }
      );
    }
    
    return NextResponse.json(folderContents);
  } catch (error) {
    console.error("Error fetching folder contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder contents" },
      { status: 500 }
    );
  }
} 