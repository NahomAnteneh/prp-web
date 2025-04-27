import { NextResponse } from "next/server";

export interface Repository {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  stargazerCount: number;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const isThirdParty = searchParams.get("thirdParty") === "true";

  try {
    // In a real implementation, fetch data from your database or API
    // For demonstration, we'll return a sample list of repositories
    let repositories: Repository[] = [
      {
        id: "1",
        name: "project-one",
        description: "A sample project repository",
        isPrivate: false,
        stargazerCount: 42,
        updatedAt: new Date().toISOString(),
        owner: {
          login: "user123",
          avatarUrl: "/avatar.png",
        },
      },
      {
        id: "2",
        name: "web-app",
        description: "Web application with modern features",
        isPrivate: true,
        stargazerCount: 15,
        updatedAt: new Date().toISOString(),
        owner: {
          login: "user123",
          avatarUrl: "/avatar.png",
        },
      },
      {
        id: "3",
        name: "api-service",
        description: "Backend API service",
        isPrivate: false,
        stargazerCount: 28,
        updatedAt: new Date().toISOString(),
        owner: {
          login: "user123",
          avatarUrl: "/avatar.png",
        },
      },
    ];

    // If searching, filter repositories
    if (query) {
      repositories = repositories.filter(
        (repo) =>
          repo.name.toLowerCase().includes(query.toLowerCase()) ||
          (repo.description &&
            repo.description.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // For third-party search, we would typically query external APIs
    if (isThirdParty) {
      // In a real implementation, fetch from external source
      // For demonstration, add a sample third-party repository
      if (query && query.length > 2) {
        repositories.push({
          id: "external-1",
          name: "external-repo",
          description: `Third-party repository matching "${query}"`,
          isPrivate: false,
          stargazerCount: 1240,
          updatedAt: new Date().toISOString(),
          owner: {
            login: "external-org",
            avatarUrl: "/external-avatar.png",
          },
        });
      }
    }

    return NextResponse.json(repositories);
  } catch (error) {
    console.error("Error searching repositories:", error);
    return NextResponse.json(
      { error: "Failed to search repositories" },
      { status: 500 }
    );
  }
} 