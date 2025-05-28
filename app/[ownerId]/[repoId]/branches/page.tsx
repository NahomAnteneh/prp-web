"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RepositoryHeader } from "@/components/repository/repository-header";
import { GitBranchIcon } from "lucide-react";

export default function Branches() {
  const params = useParams<{ ownerId: string; repoId: string }>();
  const { ownerId, repoId } = params;
  const { data: session } = useSession();

  return (
    <>
      <RepositoryHeader owner={ownerId} repository={repoId} session={session} />
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranchIcon className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Branches</h1>
          </div>
          <div className="text-muted-foreground">
            Here is the list of all the branches
          </div>
        </div>
      </div>
    </>
  );
}
