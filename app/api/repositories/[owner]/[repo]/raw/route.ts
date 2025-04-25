import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ChangeType } from '@prisma/client';

// GET raw file content
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch') || 'main';
    const path = url.searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
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

    // Find branch
    const branchRecord = repository.branches.find((b: { name: string }) => b.name === branch);
    if (!branchRecord) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Get commit ID the branch points to
    const headCommitId = branchRecord.headCommitId;
    
    // Function to recursively find the most recent file content for a path
    const getFileContent = async (commitId: string, filePath: string, visitedCommits = new Set<string>()): Promise<string | null> => {
      // Prevent circular references
      if (visitedCommits.has(commitId)) {
        return null;
      }
      visitedCommits.add(commitId);
      
      // Get the commit with file changes
      const commit = await db.commit.findUnique({
        where: { id: commitId },
        include: {
          fileChanges: {
            where: { filePath }
          }
        }
      });
      
      if (!commit) {
        return null;
      }
      
      // If this commit has changes for this file
      if (commit.fileChanges.length > 0) {
        const fileChange = commit.fileChanges[0];
        
        // If the file was deleted in this commit, return null
        if (fileChange.changeType === ChangeType.DELETED) {
          return null;
        }
        
        // If the file was added or modified, get its content
        if (fileChange.fileContentHash) {
          const fileContent = await db.fileContent.findUnique({
            where: { hash: fileChange.fileContentHash }
          });
          
          if (fileContent) {
            return fileContent.content;
          }
        }
      }
      
      // If file wasn't found or was deleted, check parent commits
      for (const parentId of commit.parentCommitIDs) {
        const content = await getFileContent(parentId, filePath, visitedCommits);
        if (content) {
          return content;
        }
      }
      
      return null;
    };
    
    // Get file content
    const content = await getFileContent(headCommitId, path);
    
    if (!content) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Determine content type based on file extension
    const fileExtension = path.split('.').pop()?.toLowerCase();
    let contentType = 'text/plain';
    
    // Set appropriate content type based on file extension
    switch (fileExtension) {
      case 'html':
        contentType = 'text/html';
        break;
      case 'css':
        contentType = 'text/css';
        break;
      case 'js':
        contentType = 'application/javascript';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'md':
        contentType = 'text/markdown';
        break;
      default:
        contentType = 'text/plain';
    }
    
    // Return content with appropriate content type
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
      }
    });
    
  } catch (error) {
    console.error('Error fetching file content:', error);
    return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 });
  }
} 