import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repository: string } }
) {
  try {
    const { owner, repository } = params;

    // Get repository data from database
    const repositoryData = await prisma.repository.findUnique({
      where: {
        ownerName_name: {
          ownerName: owner,
          name: repository,
        },
      },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
          },
        },
        contributors: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        stars: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!repositoryData) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Transform the data to the expected format
    const response = {
      id: repositoryData.id,
      name: repositoryData.name,
      description: repositoryData.description,
      defaultBranch: repositoryData.defaultBranch || "main",
      topics: repositoryData.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
      })),
      contributors: repositoryData.contributors.map(user => ({
        id: user.id,
        name: user.name || user.username,
        avatarUrl: user.avatarUrl || `https://avatar.vercel.sh/${user.username}`,
      })),
      starCount: repositoryData.stars.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching repository overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository overview" },
      { status: 500 }
    );
  }
} 