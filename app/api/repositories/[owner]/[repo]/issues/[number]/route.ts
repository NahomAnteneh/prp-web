import { NextResponse } from "next/server";

export interface IssueAuthor {
  login: string;
  avatarUrl: string;
}

export interface IssueLabel {
  name: string;
  color: string;
}

export interface IssueComment {
  id: string;
  body: string;
  createdAt: string;
  author: IssueAuthor;
}

export interface IssueDetail {
  id: string;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  author: IssueAuthor;
  labels: IssueLabel[];
  comments: IssueComment[];
}

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string; number: string } }
) {
  try {
    const { owner, repo, number } = params;
    
    // TODO: In a production environment, this should be fetched from a database
    // This is a mock implementation for demonstration purposes
    const issue: IssueDetail = {
      id: "issue_" + number,
      number: parseInt(number),
      title: `Issue #${number}: Sample Issue`,
      body: "This is a detailed description of the issue with all necessary information.",
      state: "open",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        login: "user1",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      },
      labels: [
        { name: "bug", color: "d73a4a" },
        { name: "enhancement", color: "a2eeef" },
      ],
      comments: [
        {
          id: "comment_1",
          body: "This is a comment on the issue.",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          author: {
            login: "user2",
            avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
          },
        },
        {
          id: "comment_2",
          body: "This is another comment with more details.",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          author: {
            login: "user3",
            avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
          },
        },
      ],
    };

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue details" },
      { status: 500 }
    );
  }
} 