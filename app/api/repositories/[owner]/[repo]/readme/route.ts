import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET repository README content
export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const branch = url.searchParams.get('branch') || 'main';
    
    // Find the repository
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
    const branchRecord = repository.branches.find((b: { name: string }) => b.name === branch);
    if (!branchRecord) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Get the commit ID the branch points to
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
    
    // Look for README.md (or other README variants)
    const readmePatterns = ['README.md', 'Readme.md', 'readme.md', 'README.txt', 'readme.txt'];
    
    // Find the first matching README file
    const readmeFile = commit.fileChanges.find((fileChange: { filePath: string; fileContentHash?: string }) => 
      readmePatterns.some(pattern => fileChange.filePath === pattern)
    );
    
    if (!readmeFile || !readmeFile.fileContentHash) {
      return NextResponse.json({ error: 'README not found' }, { status: 404 });
    }
    
    // In a real implementation, retrieve file content from storage based on the hash
    // Query the database or file storage system to get the actual content
    try {
      // Attempt to retrieve file content by hash
      const fileContent = await db.fileContent.findUnique({
        where: { hash: readmeFile.fileContentHash }
      });
      
      if (fileContent) {
        // Return actual file content from the database
        return new NextResponse(fileContent.content, {
          headers: {
            'Content-Type': 'text/plain',
          }
        });
      }
      
      // If we couldn't find content in the database, return an error
      return NextResponse.json({ error: 'README content not found' }, { status: 404 });
      
    } catch (error) {
      console.error('Error retrieving file content:', error);
      return NextResponse.json({ error: 'Failed to retrieve README content' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error fetching README:', error);
    return NextResponse.json({ error: 'Failed to fetch README' }, { status: 500 });
  }
} 