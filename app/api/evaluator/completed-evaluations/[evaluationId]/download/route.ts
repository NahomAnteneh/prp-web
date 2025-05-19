import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Note: In a real application, you would use a library like PDFKit or jsPDF 
// to generate a PDF on the server side, or render an HTML template and convert it to PDF.
// For this example, we're returning a text-based simplified "report" as a file download.

export async function GET(
  request: NextRequest,
  { params }: { params: { evaluationId: string } }
) {
  try {
    const evaluationId = params.evaluationId;
    
    if (!evaluationId) {
      return NextResponse.json({ error: 'Evaluation ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.userId;
    
    // Verify the user is an evaluator
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { 
        userId: true,
        firstName: true,
        lastName: true,
        role: true
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'EVALUATOR') {
      return NextResponse.json({ error: 'Access denied. User is not an evaluator' }, { status: 403 });
    }
    
    // Verify the evaluation exists and belongs to this evaluator
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        authorId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            submissionDate: true,
            group: {
              select: {
                name: true,
                groupUserName: true,
              },
            },
          },
        },
      },
    });
    
    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Parse criteriaData into a more usable format
    const criteriaData = evaluation.criteriaData as any || {};
    const criteria = criteriaData.criteria || [];
    
    // Generate a simple text-based report
    // In a real application, you would generate a more sophisticated PDF
    const reportContent = `
EVALUATION REPORT
=====================================

Project: ${evaluation.project.title}
Group: ${evaluation.project.group.name}
Submission Date: ${evaluation.project.submissionDate ? new Date(evaluation.project.submissionDate).toLocaleDateString() : 'Not submitted'}
Evaluation Date: ${new Date(evaluation.createdAt).toLocaleDateString()}
Evaluator: ${user.firstName} ${user.lastName}

OVERALL SCORE: ${evaluation.score ? evaluation.score.toFixed(1) : 'N/A'}/10

CRITERIA EVALUATION:
${criteria.map((criterion: any) => 
  `- ${criterion.name} (Weight: ${criterion.weight}%): ${criterion.score}/10
   Comments: ${criterion.comments || 'No comments provided'}`
).join('\n\n')}

OVERALL COMMENTS:
${evaluation.comments || 'No overall comments provided'}

=====================================
Generated on: ${new Date().toLocaleString()}
Report ID: ${evaluationId}
`;

    // Create a response with the report content
    const response = new NextResponse(reportContent);
    
    // Set headers for file download
    response.headers.set('Content-Type', 'text/plain');
    response.headers.set('Content-Disposition', `attachment; filename="evaluation-report-${evaluationId}.txt"`);
    
    return response;
    
  } catch (error) {
    console.error('Error generating evaluation report:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluation report' },
      { status: 500 }
    );
  }
} 