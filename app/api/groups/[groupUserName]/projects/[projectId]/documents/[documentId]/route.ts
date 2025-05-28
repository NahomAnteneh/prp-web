import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// GET: Get a specific document by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; documentId: string } }
) {
  try {
    const { groupUserName, projectId, documentId } = params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    try {
      // Get the document from database
      const document = await db.document.findUnique({
        where: { id: documentId },
        include: {
          uploadedBy: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!document) {
        return NextResponse.json(
          { message: 'Document not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(document);
    } catch (docError) {
      console.error('Error fetching document:', docError);
      // Fall back to placeholder if database query fails
      return NextResponse.json({
        message: 'Document details feature coming soon',
        document: {
          id: documentId,
          title: 'Sample Document',
          content: 'This is a placeholder for document content',
          createdAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error fetching document details:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a document by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { groupUserName, projectId, documentId } = params;
    
    // Check if the project exists and belongs to the group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    try {
      // Handle temporary document IDs
      if (documentId.startsWith('temp-')) {
        const timestamp = documentId.replace('temp-', '');
        const documentsDir = path.join(process.cwd(), 'public', 'uploads', 'documents', projectId);
        
        // If the directory exists, try to find and delete files matching the timestamp
        if (existsSync(documentsDir)) {
          try {
            const files = await fs.readdir(documentsDir);
            const matchingFiles = files.filter(file => file.startsWith(timestamp));
            
            for (const file of matchingFiles) {
              await fs.unlink(path.join(documentsDir, file));
            }
          } catch (fileError) {
            console.error('Error finding/deleting temporary file:', fileError);
          }
        }
      } else {
        // Find the document to get its file path
        const document = await db.document.findUnique({
          where: { id: documentId },
        });

        if (!document) {
          return NextResponse.json(
            { message: 'Document not found' },
            { status: 404 }
          );
        }

        // Check if the document belongs to the project
        if (document.projectId !== projectId) {
          return NextResponse.json(
            { message: 'Document does not belong to this project' },
            { status: 403 }
          );
        }
        
        // Delete the file if it exists
        if (document.url) {
          try {
            // Extract file path from URL (remove the leading slash)
            const filePath = path.join(process.cwd(), 'public', document.url.replace(/^\//, ''));
            
            if (existsSync(filePath)) {
              await fs.unlink(filePath);
            }
          } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue with document deletion even if file deletion fails
          }
        }

        // Delete the document from the database
        await db.document.delete({
          where: { id: documentId },
        });
      }

      return NextResponse.json({ 
        message: 'Document deleted successfully', 
        id: documentId 
      });
    } catch (dbError) {
      console.error('Error with document deletion:', dbError);
      return NextResponse.json(
        { message: 'Error during document deletion', error: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a document by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string; documentId: string } }
) {
  try {
    const { groupUserName, projectId, documentId } = params;

    const group = await db.group.findUnique({
      where: { groupUserName },
      select: { groupUserName: true },
    });

    if (!group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if project exists and belongs to the specified group
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        groupUserName,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found or does not belong to this group' },
        { status: 404 }
      );
    }

    try {
      const body = await req.json();
      const document = await db.document.update({
        where: { id: documentId },
        data: {
          title: body.title,
          content: body.content,
          category: body.category,
        },
      });

      return NextResponse.json(document);
    } catch (dbError) {
      console.error('Error updating document:', dbError);
      return NextResponse.json({
        message: 'Document update feature coming soon',
        document: {
          id: documentId,
          title: 'Updated Document',
          updatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 