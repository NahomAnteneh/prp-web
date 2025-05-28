"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  headCommitId: string;
}

interface BranchSelectorProps {
  repositoryId: string;
  branches: Branch[];
  defaultBranch: string; // Name of the default branch
}

export function BranchSelector({ repositoryId, branches, defaultBranch }: BranchSelectorProps) {
  const params = useParams<{ commitId: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const currentCommitId = params?.commitId;

  // Find the selected branch based on commitId or default branch
  const selectedBranch = branches.find((b) => b.headCommitId === currentCommitId)?.name ?? defaultBranch;

  // Determine view type and path from URL
  const pathSegments = pathname.split("/");
  const viewTypeIndex = pathSegments.findIndex((seg) => seg === "tree" || seg === "blob");
  const pathFromUrl = viewTypeIndex !== -1 && pathSegments.length > viewTypeIndex + 2
    ? pathSegments.slice(viewTypeIndex + 2).join("/")
    : "";

  const handleBranchChange = (newBranchName: string) => {
    if (newBranchName === selectedBranch) return;

    // Find the headCommitId for the selected branch
    const newBranch = branches.find((b) => b.name === newBranchName);
    if (!newBranch) return;

    // Construct the new path
    const viewTypeIndex = pathSegments.findIndex((seg) => seg === "tree" || seg === "blob");
    if (viewTypeIndex !== -1 && pathSegments.length > viewTypeIndex + 1) {
      // Replace the commitId segment
      pathSegments[viewTypeIndex + 1] = newBranch.headCommitId;
      const newPath = pathSegments.join("/");
      router.push(newPath);
    } else {
      // Navigate to the root tree view of the new branch
      router.push(`/repository/${repositoryId}/commit/${newBranch.headCommitId}/tree`);
    }
  };

  if (!branches.length) {
    return (
      <div className="p-2 text-sm text-muted-foreground">No branches found</div>
    );
  }

  return (
    <Select value={selectedBranch} onValueChange={handleBranchChange}>
      <SelectTrigger className="w-full h-8 focus:ring-0 focus:ring-offset-0 border-none shadow-none !bg-transparent">
        <div className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="truncate font-medium max-w-48 flex items-center">
            <GitBranch className="mr-2 h-4 w-4" />
            {selectedBranch}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
        {branches.map((branch) => (
          <SelectItem
            key={branch.id}
            value={branch.name}
            className="w-full truncate"
            title={branch.name}
          >
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}