import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { owner, repo } = params;
    const repository = await db.repository.findUnique({
      where: { ownerId_name: { ownerId: owner, name: repo } },
      include: {
        project: true,
        branches: { select: { name: true } },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const overview = {
      name: repository.name,
      description: repository.project?.description || null,
      defaultBranch: repository.branches[0]?.name || null,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
      size: 0, // calculate if needed
      tags: [], // implement if tags exist
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
