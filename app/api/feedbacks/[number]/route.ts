import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface FeedbackAuthor {
  name: string;
  avatarUrl: string;
}

export interface FeedbackTag {
  name: string;
  color: string;
}

export interface FeedbackComment {
  id: string;
  body: string;
  createdAt: string;
  author: FeedbackAuthor;
}

export interface FeedbackDetail {
  id: string;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  author: FeedbackAuthor;
  tags: FeedbackTag[];
  comments: FeedbackComment[];
}

export async function GET(
  request: Request,
  { params }: { params: { number: string } }
) {
  try {
    const number = parseInt(params.number, 10);
    
    if (isNaN(number)) {
      return NextResponse.json(
        { error: "Invalid feedback number" },
        { status: 400 }
      );
    }
    
    // Fetch the feedback with all related data
    const feedback = await prisma.feedback.findUnique({
      where: { number },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }
    
    // Transform to the expected response format
    const response: FeedbackDetail = {
      id: feedback.id,
      number: feedback.number,
      title: feedback.title,
      body: feedback.body,
      state: feedback.state as "open" | "closed",
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
      author: {
        name: feedback.author.name,
        avatarUrl: feedback.author.avatarUrl || `https://avatar.vercel.sh/${feedback.author.name}`,
      },
      tags: feedback.tags.map(tag => ({
        name: tag.name,
        color: tag.color,
      })),
      comments: feedback.comments.map(comment => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: {
          name: comment.author.name,
          avatarUrl: comment.author.avatarUrl || `https://avatar.vercel.sh/${comment.author.name}`,
        },
      })),
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching feedback details:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback details" },
      { status: 500 }
    );
  }
} 