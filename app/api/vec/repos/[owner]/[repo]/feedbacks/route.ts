import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const stateParam = url.searchParams.get("state")?.toUpperCase() || "ALL";
    const search = url.searchParams.get("search") || "";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const cursor = url.searchParams.get("cursor");

    // Find repository by owner and name
    const repository = await db.repository.findUnique({
      where: { ownerId_name: { ownerId: owner, name: repo } },
    });
    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Build filter
    const where: any = { repositoryId: repository.id };
    if (stateParam !== "ALL") {
      where.status = stateParam;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    // Fetch feedbacks with pagination
    const items = await db.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Determine next cursor
    const nextCursor = items.length === limit
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({ items, nextCursor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
