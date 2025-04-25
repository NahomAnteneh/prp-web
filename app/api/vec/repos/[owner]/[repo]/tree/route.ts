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
    const recursive = url.searchParams.get("recursive") === "true";

    // Validate branch
    if (!branch) {
      return NextResponse.json({ error: "Missing branch parameter" }, { status: 400 });
    }

    // Find repository by owner and name
    const repository = await db.repository.findUnique({
      where: { ownerId_name: { ownerId: owner, name: repo } },
      include: { branches: true },
    });
    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Find branch record
    const branchRecord = repository.branches.find((b) => b.name === branch);
    if (!branchRecord) {
      return NextResponse.json({ tree: [], truncated: false });
    }

    // TODO: Implement tree extraction (from branchRecord.headCommitId)
    const tree: Array<{ path: string; type: "tree" | "blob" }> = [];
    const truncated = false;

    return NextResponse.json({ tree, truncated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
