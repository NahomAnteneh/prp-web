import { NextResponse } from "next/server";
import type { IssueAuthor, IssueLabel } from "./[number]/route";

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

export interface IssueListResponse {
  items: Issue[];
  totalCount: number;
  nextCursor: number | null;
}

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state") || "open";
    const search = searchParams.get("search") || "";
    const cursor = parseInt(searchParams.get("cursor") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    
    // In a real implementation, you would fetch actual issues from your database/storage
    // This is a production-ready structure, just connect to your actual data source
    
    // Create sample issues - replace with real data in production
    const allIssues: Issue[] = Array.from({ length: 100 }).map((_, i) => {
      const number = i + 1;
      const isOpen = i % 3 !== 0; // 2/3 are open, 1/3 are closed
      
      return {
        id: `issue-${number}`,
        number,
        title: `Issue #${number} - ${isOpen ? "Open" : "Closed"} issue ${search ? `matching "${search}"` : ""}`,
        state: isOpen ? "open" : "closed",
        createdAt: new Date(Date.now() - (number * 24 * 60 * 60 * 1000)).toISOString(),
        updatedAt: new Date(Date.now() - (number * 12 * 60 * 60 * 1000)).toISOString(),
        author: {
          login: `user${number % 5}`,
          avatarUrl: `https://avatars.githubusercontent.com/u/${10000 + number}?v=4`,
        },
        labels: [
          { name: number % 2 === 0 ? "bug" : "enhancement", color: number % 2 === 0 ? "d73a4a" : "0075ca" },
          ...(number % 3 === 0 ? [{ name: "documentation", color: "0075ca" }] : []),
          ...(number % 5 === 0 ? [{ name: "good first issue", color: "7057ff" }] : []),
        ],
        comments: number % 10,
      };
    });
    
    // Filter by state
    let filteredIssues = allIssues;
    if (state !== "all") {
      filteredIssues = allIssues.filter(issue => issue.state === state);
    }
    
    // Filter by search term
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredIssues = filteredIssues.filter(issue => 
        issue.title.toLowerCase().includes(lowerSearch) ||
        issue.labels.some(label => label.name.toLowerCase().includes(lowerSearch))
      );
    }
    
    // Pagination
    const startIndex = (cursor - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedIssues = filteredIssues.slice(startIndex, endIndex);
    
    // Determine next cursor
    const hasNextPage = endIndex < filteredIssues.length;
    
    const response: IssueListResponse = {
      items: paginatedIssues,
      totalCount: filteredIssues.length,
      nextCursor: hasNextPage ? cursor + 1 : null,
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