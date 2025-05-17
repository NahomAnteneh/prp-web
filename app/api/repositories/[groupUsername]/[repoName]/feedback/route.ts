import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeedbackStatus } from "@prisma/client";

// GET /api/repositories/[groupUsername]/[repoName]/feedback
// Fetch all feedback for a specific repository
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUsername: string; repoName: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupUsername, repoName } = params;

    // Check if the repository exists
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repoName,
          groupUserName: groupUsername,
        },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Check if the repository is private and if user has access
    if (repository.isPrivate) {
      // Check if user is a member of the group or an advisor/evaluator
      const isMember = await db.groupMember.findUnique({
        where: {
          groupUserName_userId: {
            groupUserName: groupUsername,
            userId: session.user.userId,
          },
        },
      });

      const isAdvisorOrEvaluator = 
        session.user.role === "ADVISOR" || 
        session.user.role === "EVALUATOR" ||
        session.user.role === "ADMINISTRATOR";

      if (!isMember && !isAdvisorOrEvaluator) {
        return NextResponse.json(
          { error: "You don't have access to this repository" },
          { status: 403 }
        );
      }
    }

    // Fetch all feedback for the repository
    const feedback = await db.feedback.findMany({
      where: {
        repositoryName: repoName,
        repositoryGroup: groupUsername,
      },
      include: {
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching repository feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository feedback" },
      { status: 500 }
    );
  }
}

// POST /api/repositories/[groupUsername]/[repoName]/feedback
// Create a new feedback for a repository
export async function POST(
  req: NextRequest,
  { params }: { params: { groupUsername: string; repoName: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only advisors and evaluators can post feedback
    if (
      session.user.role !== "ADVISOR" &&
      session.user.role !== "EVALUATOR" &&
      session.user.role !== "ADMINISTRATOR"
    ) {
      return NextResponse.json(
        { error: "Only advisors and evaluators can provide feedback" },
        { status: 403 }
      );
    }

    const { groupUsername, repoName } = params;
    const { title, content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Feedback content is required" },
        { status: 400 }
      );
    }

    // Check if the repository exists
    const repository = await db.repository.findUnique({
      where: {
        name_groupUserName: {
          name: repoName,
          groupUserName: groupUsername,
        },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Create the feedback
    const feedback = await db.feedback.create({
      data: {
        title,
        content,
        status: FeedbackStatus.OPEN,
        authorId: session.user.userId,
        repositoryName: repoName,
        repositoryGroup: groupUsername,
      },
      include: {
        author: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Error creating repository feedback:", error);
    return NextResponse.json(
      { error: "Failed to create repository feedback" },
      { status: 500 }
    );
  }
} 