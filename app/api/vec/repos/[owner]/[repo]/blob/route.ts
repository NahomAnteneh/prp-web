import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const url = new URL(request.url);
    const branch = url.searchParams.get("branch");
    const path = url.searchParams.get("path");

    if (!branch || !path) {
      return NextResponse.json(
        { error: "Missing branch or path parameter" },
        { status: 400 }
      );
    }

    const repository = await db.repository.findUnique({
      where: { ownerId_name: { ownerId: owner, name: repo } },
      include: { branches: true },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const branchRecord = repository.branches.find((b) => b.name === branch);
    if (!branchRecord) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // TODO: Retrieve commit contents and locate file at given path
    const text = ""; // implement actual file content retrieval
    const isBinary = false; // determine if binary

    return NextResponse.json({ text, isBinary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
