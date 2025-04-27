import { NextResponse } from "next/server";

export interface FileContent {
  text: string;
  isBinary: boolean;
  size: number;
  encoding: string;
  rawUrl: string;
  extension: string;
}

export async function POST(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { path, branch = "main" } = await request.json();
    
    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      );
    }
    
    // Extract file extension from path
    const extension = path.split('.').pop() || '';
    
    // Determine if the file is likely binary based on extension
    // This list should be expanded in a real implementation
    const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'exe'];
    const isBinary = binaryExtensions.includes(extension.toLowerCase());
    
    // In a real implementation, you would fetch the actual file content from your storage
    // You would need to implement logic to read from your file storage system
    const fileContent: FileContent = {
      text: isBinary ? "" : `Content of ${path} in ${params.owner}/${params.repo} (${branch})`,
      isBinary,
      size: 1024, // Example size
      encoding: isBinary ? "base64" : "utf-8",
      rawUrl: `/api/repositories/${params.owner}/${params.repo}/file/raw?path=${encodeURIComponent(path)}&branch=${branch}`,
      extension
    };
    
    return NextResponse.json(fileContent);
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch file content" },
      { status: 500 }
    );
  }
}

// For raw file content
export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const branch = searchParams.get("branch") || "main";
  
  if (!path) {
    return NextResponse.json(
      { error: "Path is required" },
      { status: 400 }
    );
  }
  
  try {
    // In a real implementation, you would fetch the raw file from your storage
    // For binary files, you would return the appropriate content type and data
    // This is a placeholder implementation
    
    const extension = path.split('.').pop() || '';
    const binaryExtensions = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'exe'];
    const isBinary = binaryExtensions.includes(extension.toLowerCase());
    
    if (isBinary) {
      // For binary files, you would return the appropriate content type
      // Here we're just returning a placeholder text
      return new NextResponse(
        `Binary content for ${path}`,
        {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
          },
        }
      );
    }
    
    // For text files
    return new NextResponse(
      `Content of ${path} in ${params.owner}/${params.repo} (${branch})`,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching raw file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw file content" },
      { status: 500 }
    );
  }
} 