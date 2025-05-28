import { NextResponse } from "next/server";
import { PrismaClient, AdvisorRequestStatus, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Initialize Prisma client
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.userId;

    // Verify user is an advisor
    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user || user.role !== Role.ADVISOR) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 }
      );
    }

    if (!action || (action !== "accept" && action !== "reject")) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the advisor request
    const advisorRequest = await prisma.advisorRequest.findUnique({
      where: { id: requestId },
      include: {
        group: {
          include: {
            projects: true,
          },
        },
      },
    });

    if (!advisorRequest) {
      return NextResponse.json(
        { error: "Advisor request not found" },
        { status: 404 }
      );
    }

    // Verify the request is for this advisor
    if (advisorRequest.requestedAdvisorId !== userId) {
      return NextResponse.json(
        { error: "This request is not for you" },
        { status: 403 }
      );
    }

    // Verify the request is in pending status
    if (advisorRequest.status !== AdvisorRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Update the request status based on the action
    const newStatus = action === "accept" 
      ? AdvisorRequestStatus.ACCEPTED 
      : AdvisorRequestStatus.REJECTED;

    // Update the request status
    await prisma.advisorRequest.update({
      where: { id: requestId },
      data: { 
        status: newStatus,
        responseMessage: body.message || null,
      },
    });

    // If accepted, update the specific project's advisor
    if (action === "accept" && advisorRequest.projectId) {
      await prisma.project.update({
        where: { id: advisorRequest.projectId },
        data: { advisorId: userId },
      });

      // Create notification for group members that advisor accepted
      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId: advisorRequest.groupId },
        select: { userId: true },
      });

      // Create notifications for all group members
      await Promise.all(
        groupMembers.map(member => 
          prisma.notification.create({
            data: {
              message: `Your request for an advisor has been accepted by ${user.firstName || "an advisor"}`,
              recipientId: member.userId,
              read: false,
              link: `/dashboard/project/${advisorRequest.projectId}`,
            },
          })
        )
      );
    } else if (action === "reject") {
      // Create notification for group members that advisor rejected
      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId: advisorRequest.groupId },
        select: { userId: true },
      });

      // Create notifications for all group members
      await Promise.all(
        groupMembers.map(member => 
          prisma.notification.create({
            data: {
              message: `Your request for an advisor has been rejected`,
              recipientId: member.userId,
              read: false,
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Advisor request ${action === "accept" ? "accepted" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Error handling advisor request:", error);
    return NextResponse.json(
      { error: "Failed to handle advisor request" },
      { status: 500 }
    );
  }
}