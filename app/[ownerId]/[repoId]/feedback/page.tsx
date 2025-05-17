"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { FeedbackTab } from "@/components/repository/feedback-tab";

export default function RepoFeedbackPage() {
  const params = useParams<{ ownerId: string; repoId: string }>();
  const { ownerId, repoId } = params;
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
      <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Repository Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Advisors and evaluators can provide feedback. Students can respond to feedback entries.
          </p>
        </div>
        <FeedbackTab ownerId={ownerId} repoId={repoId} />
      </div>
    </div>
  );
} 