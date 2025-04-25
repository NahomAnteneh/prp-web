import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Define interfaces for our file types
interface FileNode {
  name: string;
  path: string;
  type: 'tree' | 'blob';
  size: number;
}

// GET repository folder/file contents
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch') || 'main';
    const path = url.searchParams.get('path') || '';
    
    // Find repository
    const repository = await db.repository.findUnique({
      where: { 
        ownerId_name: { 
          ownerId: owner, 
          name: repo 
        } 
      },
      include: {
        branches: true
      }
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Find the requested branch
    const branchRecord = repository.branches.find((b: { id: string; name: string }) => b.name === branch);
    if (!branchRecord) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Get commit ID the branch points to
    const headCommitId = branchRecord.headCommitId;
    
    // Find the commit
    const commit = await db.commit.findUnique({
      where: { id: headCommitId },
      include: {
        fileChanges: true
      }
    });

    if (!commit) {
      return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
    }
    
    // Filter file changes to get content at requested path
    const pathPrefix = path.endsWith('/') ? path : `${path}/`;
    
    // Get all files/directories at current path level
    const contents = commit.fileChanges
      .filter((fileChange: { filePath: string }) => {
        // If we're at root, get all files/dirs at root level
        if (!path) {
          return !fileChange.filePath.includes('/') || 
                  fileChange.filePath.indexOf('/') === fileChange.filePath.length - 1;
        }
        
        // If we're in a directory, get all files/dirs at this level
        return fileChange.filePath.startsWith(pathPrefix) && 
               (fileChange.filePath.substring(pathPrefix.length).indexOf('/') === -1 || 
                fileChange.filePath.substring(pathPrefix.length).indexOf('/') === 
                fileChange.filePath.substring(pathPrefix.length).length - 1);
      })
      .map((fileChange: { filePath: string }) => {
        const name = path ? 
          fileChange.filePath.substring(pathPrefix.length).replace(/\/$/, '') : 
          fileChange.filePath.replace(/\/$/, '');
        
        // Determine if this is a directory or file
        const isDirectory = fileChange.filePath.endsWith('/');
        
        return {
          name,
          path: fileChange.filePath,
          type: isDirectory ? 'tree' : 'blob',
          size: 0 // Add file size if available
        } as FileNode;
      });
    
    // Remove duplicates (we might have multiple file changes for same path)
    const uniqueContents = contents.filter((item: FileNode, index: number, self: FileNode[]) => 
      index === self.findIndex((t: FileNode) => t.path === item.path)
    );
    
    return NextResponse.json(uniqueContents);
    
  } catch (error) {
    console.error('Error fetching repository contents:', error);
    return NextResponse.json({ error: 'Failed to fetch repository contents' }, { status: 500 });
  }
} 