import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeedbackStatus } from "@prisma/client";

// GET /api/repositories/[groupUsername]/[repoName]/feedback/[feedbackId]
// Get a specific feedback entry
export async function GET(
  req: NextRequest,
  { params }: { params: { groupUsername: string; repoName: string; feedbackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupUsername, repoName, feedbackId } = params;

    // Check if the repository exists and user has access
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

    // Fetch the feedback
    const feedback = await db.feedback.findUnique({
      where: {
        id: feedbackId,
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

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Check if the feedback belongs to the specified repository
    if (feedback.repositoryName !== repoName || feedback.repositoryGroup !== groupUsername) {
      return NextResponse.json({ error: "Feedback not found in this repository" }, { status: 404 });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// PATCH /api/repositories/[groupUsername]/[repoName]/feedback/[feedbackId]
// Update a feedback's status or content
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupUsername: string; repoName: string; feedbackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupUsername, repoName, feedbackId } = params;
    const updateData = await req.json();

    // Get the feedback to check ownership
    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Check if the feedback belongs to the specified repository
    if (feedback.repositoryName !== repoName || feedback.repositoryGroup !== groupUsername) {
      return NextResponse.json({ error: "Feedback not found in this repository" }, { status: 404 });
    }

    // Only the author or admins can update the feedback content
    if (feedback.authorId !== session.user.userId && 
        session.user.role !== "ADMINISTRATOR") {
      if (updateData.content) {
        return NextResponse.json(
          { error: "Only the author can update feedback content" },
          { status: 403 }
        );
      }
    }

    // Everyone with access can update the status
    const updatedFeedback = await db.feedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        title: updateData.title,
        content: updateData.content,
        status: updateData.status,
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

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

// DELETE /api/repositories/[groupUsername]/[repoName]/feedback/[feedbackId]
// Delete a feedback entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupUsername: string; repoName: string; feedbackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupUsername, repoName, feedbackId } = params;

    // Get the feedback to check ownership
    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Check if the feedback belongs to the specified repository
    if (feedback.repositoryName !== repoName || feedback.repositoryGroup !== groupUsername) {
      return NextResponse.json({ error: "Feedback not found in this repository" }, { status: 404 });
    }

    // Only the author, admins, or group owners can delete feedback
    if (feedback.authorId !== session.user.userId && 
        session.user.role !== "ADMINISTRATOR") {
      
      // Check if user is group leader
      const group = await db.group.findUnique({
        where: { groupUserName: groupUsername },
      });

      if (!group || group.leaderId !== session.user.userId) {
        return NextResponse.json(
          { error: "Only the feedback author, group leader, or administrators can delete feedback" },
          { status: 403 }
        );
      }
    }

    // Delete the feedback
    await db.feedback.delete({
      where: { id: feedbackId },
    });

    return NextResponse.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
} 