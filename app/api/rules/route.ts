import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Define mock rules as fallback
const mockRules = {
  maxGroupSize: 5,
  advisorRequestDeadline: new Date().toISOString(),
  projectSubmissionDeadline: new Date().toISOString()
};

export async function GET() {
  try {
    // Attempt to get rules from the database
    const dbRules = await db.rule.findFirst();

    // If rules exist in the database, return them
    if (dbRules) {
      return NextResponse.json({
        maxGroupSize: dbRules.maxGroupSize,
        advisorRequestDeadline: dbRules.advisorRequestDeadline,
        projectSubmissionDeadline: dbRules.projectSubmissionDeadline
      });
    }

    // Fall back to mock rules if no database rules exist
    return NextResponse.json(mockRules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}