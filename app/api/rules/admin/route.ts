import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Create new rules (if none exist)
export async function POST(req: NextRequest) {
  try {
    // Authentication and authorization check
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Check if rules already exist
    const existingRules = await db.rule.findFirst();
    if (existingRules) {
      return NextResponse.json(
        { error: 'Rules already exist. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Validate and parse the request body
    const data = await req.json();
    const { maxGroupSize, advisorRequestDeadline, projectSubmissionDeadline } = data;

    // Validation
    if (!maxGroupSize || !advisorRequestDeadline || !projectSubmissionDeadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the rules
    const rules = await db.rule.create({
      data: {
        maxGroupSize: Number(maxGroupSize),
        advisorRequestDeadline: new Date(advisorRequestDeadline),
        projectSubmissionDeadline: new Date(projectSubmissionDeadline)
      }
    });

    return NextResponse.json({
      message: 'Rules created successfully',
      rules
    });
  } catch (error) {
    console.error('Error creating rules:', error);
    return NextResponse.json(
      { error: 'Failed to create rules' },
      { status: 500 }
    );
  }
}

// Update existing rules
export async function PUT(req: NextRequest) {
  try {
    // Authentication and authorization check
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Find existing rules
    const existingRules = await db.rule.findFirst();
    if (!existingRules) {
      return NextResponse.json(
        { error: 'No rules found. Use POST to create new rules.' },
        { status: 404 }
      );
    }

    // Validate and parse the request body
    const data = await req.json();
    const { maxGroupSize, advisorRequestDeadline, projectSubmissionDeadline } = data;

    // Build update data with only provided fields
    const updateData: {
      maxGroupSize?: number;
      advisorRequestDeadline?: Date;
      projectSubmissionDeadline?: Date;
    } = {};
    
    if (maxGroupSize !== undefined) {
      updateData.maxGroupSize = Number(maxGroupSize);
    }
    
    if (advisorRequestDeadline) {
      updateData.advisorRequestDeadline = new Date(advisorRequestDeadline);
    }
    
    if (projectSubmissionDeadline) {
      updateData.projectSubmissionDeadline = new Date(projectSubmissionDeadline);
    }

    // Update the rules
    const updatedRules = await db.rule.update({
      where: { id: existingRules.id },
      data: updateData
    });

    return NextResponse.json({
      message: 'Rules updated successfully',
      rules: updatedRules
    });
  } catch (error) {
    console.error('Error updating rules:', error);
    return NextResponse.json(
      { error: 'Failed to update rules' },
      { status: 500 }
    );
  }
} 