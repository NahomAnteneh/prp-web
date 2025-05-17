"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { PullsTab } from "@/components/repository/pulls-tab";

export default function RepoPullsPage() {
  const params = useParams<{ ownerId: string; repoId: string }>();
  const { ownerId, repoId } = params;
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
      <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <PullsTab ownerId={ownerId} repoId={repoId} />
      </div>
    </div>
  );
} 