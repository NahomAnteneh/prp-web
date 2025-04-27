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

export interface Feedback {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  author: FeedbackAuthor;
  tags: FeedbackTag[];
  commentCount: number;
}

export interface FeedbackListResponse {
  items: Feedback[];
  totalCount: number;
  nextCursor: number | null;
}

interface FeedbackData {
  id: string;
  number: number;
  title: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  _count: {
    comments: number;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state") || "open";
    const search = searchParams.get("search") || "";
    const cursor = parseInt(searchParams.get("cursor") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    
    // Calculate pagination offsets
    const skip = (cursor - 1) * limit;
    
    // Build the where clause for filtering
    const where: any = {};
    
    // Filter by state if not 'all'
    if (state !== "all") {
      where.state = state;
    }
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { tags: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }
    
    // Count total matching records for pagination
    const totalCount = await prisma.feedback.count({ where });
    
    // Fetch the feedback items with related data
    const feedbacks = await prisma.feedback.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
    
    // Transform the data to match the expected response format
    const items: Feedback[] = feedbacks.map((feedback: FeedbackData) => ({
      id: feedback.id,
      number: feedback.number,
      title: feedback.title,
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
      commentCount: feedback._count.comments,
    }));
    
    // Determine if there are more pages
    const hasNextPage = skip + items.length < totalCount;
    
    // Prepare the response
    const response: FeedbackListResponse = {
      items,
      totalCount,
      nextCursor: hasNextPage ? cursor + 1 : null,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
} 