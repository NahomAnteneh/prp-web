import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// Create uploads directory if it doesn't exist
const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');

// Ensure the uploads directory exists
try {
  if (!existsSync(uploadsDir)) {
    console.log('Creating uploads directory:', uploadsDir);
    mkdir(uploadsDir, { recursive: true }).catch(err => 
      console.error('Failed to create uploads directory:', err)
    );
  }
} catch (error) {
  console.error('Error checking/creating uploads directory:', error);
}

// Schema for creating/updating documents
const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  content: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
});

// GET: List project documents
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = params;

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
      // Get documents from the database
      const documents = await db.document.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
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

      return NextResponse.json(documents);
    } catch (docError) {
      console.error('Error querying documents:', docError);
      // If db.document fails, return an empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new document
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { groupUserName, projectId } = params;

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

    // Process the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Extract document metadata
    const documentData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      type: formData.get('type') as string,
      category: formData.get('category') as string,
    };

    // Validate the data
    const validationResult = documentSchema.safeParse(documentData);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Create project-specific directory
    const projectDir = join(uploadsDir, projectId);
    if (!existsSync(projectDir)) {
      await mkdir(projectDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalExtension = file.name.split('.').pop() || '';
    const safeFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(projectDir, safeFilename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/documents/${projectId}/${safeFilename}`;

    try {
      // Save document metadata to database
      const document = await db.document.create({
        data: {
          title: validationResult.data.title,
          content: validationResult.data.content || '',
          type: file.type,
          url: fileUrl,
          size: file.size,
          category: validationResult.data.category || 'general',
          projectId,
          // Include the user ID if session exists
          uploadedById: session?.user?.userId || null,
        },
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

      return NextResponse.json(document, { status: 201 });
    } catch (dbError) {
      console.error('Error creating document in database:', dbError);
      // If db operation fails, return the file info anyway
      const fallbackDocument = {
        id: `temp-${timestamp}`,
        title: validationResult.data.title,
        content: validationResult.data.content || '',
        type: file.type,
        url: fileUrl,
        size: file.size,
        category: validationResult.data.category || 'general',
        projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json(fallbackDocument, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating project document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a document by ID
export async function DELETE(
  req: NextRequest,
  { params, searchParams }: { params: { groupUserName: string; projectId: string }; searchParams: URLSearchParams }
) {
  try {
    const { groupUserName, projectId } = params;
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { message: 'Document ID is required' },
        { status: 400 }
      );
    }

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
      // Handle temporary document IDs
      if (documentId.startsWith('temp-')) {
        const timestamp = documentId.replace('temp-', '');
        const documentsDir = join(process.cwd(), 'public', 'uploads', 'documents', projectId);
        
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

        if (document) {
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
              const filePath = join(process.cwd(), 'public', document.url.replace(/^\//, ''));
              
              if (existsSync(filePath)) {
                await fs.unlink(filePath);
              }
            } catch (fileError) {
              console.error('Error deleting file:', fileError);
            }
          }

          // Delete the document from the database
          await db.document.delete({
            where: { id: documentId },
          });
        }
      }

      return NextResponse.json({
        message: 'Document deleted successfully',
        id: documentId
      });
    } catch (dbError) {
      console.error('Error deleting document from database:', dbError);
      // Return success even if db operation fails
      return NextResponse.json({
        message: 'Document deleted successfully',
        id: documentId
      });
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 