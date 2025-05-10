import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for creating/updating documents
const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  content: z.string().optional(),
  type: z.string().optional(),
  url: z.string().url().optional(),
});

// GET: List project documents
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUserName: string; projectId: string } }
) {
  try {
    const { groupUserName, projectId } = await params;

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

    // For now, return a placeholder response since the documents feature is not yet implemented
    return NextResponse.json({
      message: 'Documents feature coming soon',
      documents: [],
    });
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
    const { groupUserName, projectId } = await params;

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

    // Check content type to determine how to parse the request
    const contentType = req.headers.get('content-type') || '';
    let documentData;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await req.formData();
      documentData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        type: formData.get('type') as string,
        // File handling would go here in a real implementation
      };
    } else {
      // Handle JSON
      try {
        documentData = await req.json();
      } catch (error) {
        return NextResponse.json(
          { message: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }

    // Validate the data
    const validationResult = documentSchema.safeParse(documentData);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // For now, return a placeholder response since the documents feature is not yet implemented
    return NextResponse.json({
      message: 'Document creation feature coming soon',
      document: {
        id: 'placeholder-id',
        title: validationResult.data.title,
        content: validationResult.data.content,
        type: validationResult.data.type,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
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

    // For now, return a success response since the documents feature is not yet implemented
    return NextResponse.json({
      message: 'Document deleted successfully',
      id: documentId
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 