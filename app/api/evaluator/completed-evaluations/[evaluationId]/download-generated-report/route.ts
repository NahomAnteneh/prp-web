import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/evaluator/completed-evaluations/:evaluationId/download-generated-report
export async function GET(
  request: Request,
  { params }: { params: { evaluationId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || session.user.role !== Role.EVALUATOR) {
    return NextResponse.json(
      { error: 'Unauthorized. Must be an evaluator to download reports.' },
      { status: 401 }
    );
  }

  const { evaluationId } = params;
  const evaluatorId = session.user.userId;

  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        id: evaluationId,
        authorId: evaluatorId, // Ensure evaluator owns this evaluation
      },
      include: {
        project: {
          select: {
            title: true,
            group: { select: { name: true } },
          },
        },
        author: { select: { firstName: true, lastName: true } }
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found or access denied.' }, { status: 404 });
    }

    // Placeholder for PDF generation
    // In a real application, you would use a library like PDFKit, pdf-lib, or Puppeteer to generate a PDF here.
    // For now, returning JSON data that could be used to build a report.
    const reportData = {
      reportTitle: `Evaluation Report for: ${evaluation.project.title}`,
      projectTitle: evaluation.project.title,
      groupName: evaluation.project.group.name,
      evaluatedBy: `${evaluation.author.firstName} ${evaluation.author.lastName}`,
      evaluationDate: evaluation.createdAt.toISOString(),
      score: evaluation.score,
      comments: evaluation.comments,
      criteria: evaluation.criteriaData, // Assuming criteriaData is structured appropriately
    };

    // Simulating a PDF file name for the content-disposition header if we were sending a PDF
    // const filename = `Evaluation_Report_${evaluation.project.title.replace(/[^a-z0-9_.-]/gi, '_')}_${evaluation.id.substring(0,8)}.pdf`;
    
    // To make the frontend toast "Report downloaded successfully" without erroring on blob(),
    // we need to send a response that *can* be blobbed, like simple text or an actual blob.
    // Sending JSON with a content-type that makes sense for a file download intent.
    // However, the frontend expects response.blob(). JSON.stringify is text.
    
    // For now, to avoid frontend error and indicate placeholder:
    const textContent = `PDF Generation Placeholder for Evaluation ID: ${evaluationId}\nData: ${JSON.stringify(reportData, null, 2)}`;
    return new NextResponse(textContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="evaluation_report_${evaluationId}.txt"`,
        }
    });

    // If actual PDF generation was here, it would be more like:
    // const pdfBytes = await generatePdfFunction(reportData); // Your PDF generation logic
    // return new NextResponse(pdfBytes, {
    //   status: 200,
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `attachment; filename="${filename}"`,
    //   }
    // });

  } catch (error) {
    console.error(`Error generating report for evaluation ${evaluationId}:`, error);
    return NextResponse.json(
      { error: 'Internal server error while generating report.' },
      { status: 500 }
    );
  }
} 