import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repository: string } }
) {
  try {
    const { owner, repository } = params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "";
    const branch = searchParams.get("branch") || "main";

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

    // Fetch folder contents from database
    const files = await prisma.file.findMany({
      where: {
        repositoryId: repositoryData.id,
        parentPath: path,
        branch,
      },
      orderBy: [
        { type: 'asc' }, // Directories first
        { name: 'asc' },  // Then alphabetically by name
      ],
    });

    // Transform to expected format
    const items: FileItem[] = files.map(file => ({
      name: file.name,
      path: file.path,
      type: file.type as 'file' | 'directory',
      ...(file.type === 'file' && { size: file.size }),
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching repository tree:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository tree" },
      { status: 500 }
    );
  }
} 