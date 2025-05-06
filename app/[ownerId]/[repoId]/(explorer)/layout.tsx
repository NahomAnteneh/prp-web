import { FileTree } from "@/components/repository/explorer/file-tree";
import { BranchSelector } from "@/components/repository/explorer/branch-selector";
import { Breadcrumbs } from "@/components/repository/explorer/breadcrumbs";
import { notFound } from "next/navigation";

interface TreeNode {
  path: string; // e.g., "src/index.ts"
  type: "file" | "directory";
}

interface FileType {
  name: string;
  content?: string;
  url?: string;
  isBinary: boolean;
}

interface Branch {
  id: string;
  name: string;
  headCommitId: string;
}

interface Repository {
  id: string;
  name: string;
  groupId: string;
  defaultBranch?: string;
}

interface Commit {
  id: string;
  repositoryId: string;
}

interface FileChange {
  id: string;
  commitId: string;
  filePath: string;
  changeType: string;
  content?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    ownerId: string; // Maps to Group.id
    repoId: string; // Maps to Repository.name
    commitId?: string; // Optional, defaults to latest commit
  }>;
}

export default async function ExplorerLayout({ children, params }: LayoutProps) {
  const { ownerId, repoId, commitId } = await params;

  // Fetch group to verify ownerId
  const groupResponse = await fetch(`http://localhost:3000/api/groups/${ownerId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!groupResponse.ok) {
    notFound();
  }
  const group = await groupResponse.json();

  // Fetch repository using groupId and repoId (Repository.name)
  const repoResponse = await fetch(`http://localhost:3000/api/repositories/${group.id}/${repoId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!repoResponse.ok) {
    notFound();
  }
  const repository: Repository = await repoResponse.json();

  const repositoryId = repository.id;

  // Determine commitId (use provided or fetch latest from default branch)
  let finalCommitId = commitId;
  if (!finalCommitId) {
    // Fetch branches
    const branchesResponse = await fetch(`http://localhost:3000/api/branches/${repositoryId}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!branchesResponse.ok) {
      notFound();
    }
    const branches: Branch[] = await branchesResponse.json();

    const defaultBranch = branches.find((b) => b.name === repository.defaultBranch) || branches[0];
    if (!defaultBranch) {
      notFound();
    }
    finalCommitId = defaultBranch.headCommitId;
  }

  // Verify commit exists
  const commitResponse = await fetch(`http://localhost:3000/api/commits/${finalCommitId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!commitResponse.ok) {
    notFound();
  }
  const commit: Commit = await commitResponse.json();

  // Fetch file changes for the commit
  const fileChangesResponse = await fetch(`http://localhost:3000/api/file-changes/${finalCommitId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!fileChangesResponse.ok) {
    notFound();
  }
  const fileChanges: FileChange[] = await fileChangesResponse.json();

  // Fetch branches
  const branchesResponse = await fetch(`http://localhost:3000/api/branches/${repositoryId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!branchesResponse.ok) {
    notFound();
  }
  const branches: Branch[] = await branchesResponse.json();

  const defaultBranch = repository.defaultBranch ?? branches[0]?.name ?? "main";

  // Build file tree
  const fileTreeInitial: TreeNode[] = [];
  const directories = new Set<string>();

  for (const file of fileChanges) {
    if (file.changeType !== "DELETED") {
      fileTreeInitial.push({ path: file.filePath, type: "file" });
      const parts = file.filePath.split("/");
      for (let i = 1; i < parts.length; i++) {
        directories.add(parts.slice(0, i).join("/"));
      }
    }
  }

  directories.forEach((dir) => {
    fileTreeInitial.push({ path: dir, type: "directory" });
  });

  // Sort tree (directories first, then files)
  fileTreeInitial.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  // Construct fileData (null for tree view, populated in ExplorerView for blob view)
  const fileData: FileType | null = null;

  return (
    <>
      {fileTreeInitial.length > 0 && (
        <div className="grid grid-cols-12 w-full h-screen">
          <div className="col-span-3 border-r border-foreground/20 overflow-y-auto flex flex-col">
            <div className="border-b border-foreground/20 flex flex-col items-stretch gap-2 p-2">
              <BranchSelector
                repositoryId={repositoryId}
                branches={branches}
                defaultBranch={defaultBranch}
              />
            </div>
            <div className="flex-grow overflow-y-auto">
              <FileTree
                initialData={fileTreeInitial}
                repositoryId={repositoryId}
                commitId={finalCommitId}
              />
            </div>
          </div>
          <div className="col-span-9 overflow-y-auto">
            <div className="border-b border-foreground/20">
              <Breadcrumbs
                repositoryId={repositoryId}
                commitId={finalCommitId}
                fileData={fileData}
              />
            </div>
            <div className="">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}