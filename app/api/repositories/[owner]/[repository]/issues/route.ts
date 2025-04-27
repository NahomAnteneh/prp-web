import { NextRequest, NextResponse } from "next/server";

export interface IssueAuthor {
  login: string;
  avatarUrl: string;
}

export interface IssueLabel {
  name: string;
  color: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  author: IssueAuthor;
  labels: IssueLabel[];
  comments: number;
}

interface IssuesResponse {
  issues: Issue[];
  nextCursor: string | null;
  totalCount: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repository: string } }
) {
  try {
    const { owner, repository } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const state = searchParams.get("state") || "open";
    const search = searchParams.get("search") || "";
    const cursor = searchParams.get("cursor") || null;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    // TODO: In a production environment, this should query a database
    // This is a mock implementation for demonstration purposes
    const mockIssues: Issue[] = Array.from({ length: 20 }).map((_, index) => {
      const issueNumber = index + 1;
      return {
        id: `issue_${issueNumber}`,
        number: issueNumber,
        title: `Issue #${issueNumber}: ${search ? `Related to ${search}` : 'Sample Issue'}`,
        state: index % 3 === 0 ? "closed" : "open",
        createdAt: new Date(Date.now() - (20 - index) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000).toISOString(),
        author: {
          login: `user${(index % 5) + 1}`,
          avatarUrl: `https://avatars.githubusercontent.com/u/${(index % 5) + 1}?v=4`,
        },
        labels: [
          { name: index % 2 === 0 ? "bug" : "enhancement", color: index % 2 === 0 ? "d73a4a" : "a2eeef" },
          ...(index % 3 === 0 ? [{ name: "documentation", color: "0075ca" }] : []),
        ],
        comments: index % 5,
      };
    });
    
    // Filter issues
    let filteredIssues = mockIssues
      .filter(issue => state === "all" || issue.state === state)
      .filter(issue => !search || issue.title.toLowerCase().includes(search.toLowerCase()));
    
    // Determine pagination
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + limit;
    const paginatedIssues = filteredIssues.slice(startIndex, endIndex);
    
    // Create response with pagination info
    const response: IssuesResponse = {
      issues: paginatedIssues,
      nextCursor: endIndex < filteredIssues.length ? endIndex.toString() : null,
      totalCount: filteredIssues.length,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
} 