interface IssuesTabProps {
  ownerId: string;
  repoId: string;
}

export function IssuesTab({ ownerId, repoId }: IssuesTabProps) {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Issues</h2>
      <p className="text-muted-foreground">
        No issues have been created for this repository yet.
      </p>
    </div>
  );
} 