"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RepositoryHeader } from "@/components/repository/repository-header";

export default function FeedbackList() {
  const params = useParams<{ ownerId: string; repoId: string }>();
  const { ownerId, repoId } = params;
  const { data: session } = useSession();

  return (
    <>
      <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Repository Feedbacks</h1>
          <div className="text-muted-foreground">
            Here all the feedbacks are listed for the selected repository
          </div>
        </div>
      </div>
    </>
  );
}
