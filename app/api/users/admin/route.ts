import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

// Schema for validating bulk user operations
const bulkOperationSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user ID is required"),
  operation: z.enum(["delete", "changeRole", "export", "verifyEmail"]),
  // Optional fields for specific operations
  newRole: z.enum(["STUDENT", "ADVISOR", "EVALUATOR", "ADMINISTRATOR"]).optional(),
});

// Admin-only endpoint for bulk operations on users
export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = bulkOperationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userIds, operation, newRole } = validationResult.data;

    // Execute the requested operation
    switch (operation) {
      case "delete":
        return await handleBulkDelete(userIds);
      
      case "changeRole":
        if (!newRole) {
          return NextResponse.json(
            { error: "New role is required for changeRole operation" },
            { status: 400 }
          );
        }
        return await handleBulkRoleChange(userIds, newRole as Role);
      
      case "export":
        return await handleExportUsers(userIds);
      
      case "verifyEmail":
        return await handleBulkEmailVerification(userIds);
      
      default:
        return NextResponse.json(
          { error: "Unsupported operation" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing admin user operation:", error);
    return NextResponse.json(
      { error: "Failed to process admin user operation" },
      { status: 500 }
    );
  }
}

// Get all users (admin only with extended information)
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // Higher limit for admin
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query filter
    const filter: any = {};
    
    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Prepare sort order
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get users with pagination and all admin-visible fields
    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Include relationship counts for admin view
        _count: {
          select: {
            groupsMemberOf: true,
            advisedProjects: true,
            evaluatedProjects: true,
            tasksAssigned: true,
            repositoriesOwned: true,
          }
        }
      },
      skip,
      take: limit,
      orderBy,
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where: filter });
    
    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin user data" },
      { status: 500 }
    );
  }
}

// Handler for bulk delete operation
async function handleBulkDelete(userIds: string[]) {
  try {
    // Delete users in a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const deletedCount = await tx.user.deleteMany({
        where: {
          id: {
            in: userIds
          }
        }
      });

      return deletedCount;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} user(s)`,
      count: result.count
    });
  } catch (error) {
    console.error("Error during bulk delete:", error);
    return NextResponse.json(
      { error: "Failed to delete users. Some users may have associated data preventing deletion." },
      { status: 500 }
    );
  }
}

// Handler for bulk role change operation
async function handleBulkRoleChange(userIds: string[], newRole: Role) {
  try {
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        role: newRole
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated role for ${result.count} user(s)`,
      count: result.count
    });
  } catch (error) {
    console.error("Error during bulk role change:", error);
    return NextResponse.json(
      { error: "Failed to update user roles" },
      { status: 500 }
    );
  }
}

// Handler for user data export operation
async function handleExportUsers(userIds: string[]) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Don't include password hash or other sensitive info
        // Include counts of related entities
        _count: {
          select: {
            groupsMemberOf: true,
            advisedProjects: true,
            evaluatedProjects: true,
            repositoriesOwned: true,
          }
        }
      }
    });

    // Transform users for export
    const exportData = users.map(user => ({
      id: user.id,
      username: user.username,
      fullName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      groupCount: user._count.groupsMemberOf,
      advisedProjectsCount: user._count.advisedProjects,
      evaluatedProjectsCount: user._count.evaluatedProjects,
      repositoriesCount: user._count.repositoriesOwned,
    }));

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error during user export:", error);
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}

// Handler for bulk email verification operation
async function handleBulkEmailVerification(userIds: string[]) {
  try {
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully verified email for ${result.count} user(s)`,
      count: result.count
    });
  } catch (error) {
    console.error("Error during bulk email verification:", error);
    return NextResponse.json(
      { error: "Failed to verify user emails" },
      { status: 500 }
    );
  }
}
