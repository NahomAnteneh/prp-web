import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface FeedbackSubmitRequest {
  title: string;
  body: string;
  tags?: string[];
  repositoryId: string;
}

interface FeedbackSubmitResponse {
  id: string;
  number: number;
  success: boolean;
  message?: string;
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    
    const body: FeedbackSubmitRequest = await request.json();
    
    // Validate input
    if (!body.title) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }
    
    if (!body.body) {
      return NextResponse.json(
        { success: false, message: "Body content is required" },
        { status: 400 }
      );
    }
    
    if (!body.repositoryId) {
      return NextResponse.json(
        { success: false, message: "Repository ID is required" },
        { status: 400 }
      );
    }
    
    // Get the next feedback number for this repository
    const latestFeedback = await prisma.feedback.findFirst({
      where: { repositoryId: body.repositoryId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    
    const nextNumber = latestFeedback ? latestFeedback.number + 1 : 1;
    
    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: {
        title: body.title,
        body: body.body,
        state: "open",
        number: nextNumber,
        author: { connect: { id: session.user.id } },
        repository: { connect: { id: body.repositoryId } },
        ...(body.tags && body.tags.length > 0 && {
          tags: {
            connectOrCreate: body.tags.map(tagName => ({
              where: { name: tagName },
              create: { 
                name: tagName,
                color: generateRandomColor(),
              },
            })),
          },
        }),
      },
    });
    
    const response: FeedbackSubmitResponse = {
      id: feedback.id,
      number: feedback.number,
      success: true,
      message: "Feedback submitted successfully",
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// Helper function to generate a random color hex code for tags
function generateRandomColor(): string {
  const letters = '0123456789abcdef';
  let color = '';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
} 