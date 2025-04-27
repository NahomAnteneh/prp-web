import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repository: string } }
) {
  try {
    const { owner, repository } = params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const branch = searchParams.get("branch") || "main";

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    // Fetch repository to ensure it exists
    const repositoryData = await prisma.repository.findUnique({
      where: {
        ownerName_name: {
          ownerName: owner,
          name: repository,
        },
      },
    });

    if (!repositoryData) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Fetch file contents from database
    const file = await prisma.file.findFirst({
      where: {
        repositoryId: repositoryData.id,
        path,
        branch,
        type: 'file',
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // If this is a README.md or other Markdown file, return the content directly
    if (path.toLowerCase().endsWith('.md')) {
      return new NextResponse(file.content, {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    }

    // For images
    if (path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
      // If this is a production system, you'd return the actual binary data
      // For this example, we'll assume content has a base64 representation of the image
      const contentType = getContentType(path);
      const imageBuffer = Buffer.from(file.content, 'base64');
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    // For other text files
    return new NextResponse(file.content, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}

// Helper function to determine content type
function getContentType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
  };
  
  return contentTypes[extension || ''] || 'application/octet-stream';
} 