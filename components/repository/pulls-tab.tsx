interface PullsTabProps {
  ownerId: string;
  repoId: string;
}

export function PullsTab({ ownerId, repoId }: PullsTabProps) {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Pull Requests</h2>
      <p className="text-muted-foreground">
        No pull requests have been opened for this repository yet.
      </p>
    </div>
  );
} 