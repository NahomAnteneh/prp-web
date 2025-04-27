"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch } from "lucide-react";
import type { Branch, BranchesResponse } from "@/app/api/repositories/[owner]/[repo]/branches/route";

export function BranchSelector() {
  const params = useParams<{
    owner: string;
    repository: string;
    branch: string;
  }>();
  const router = useRouter();
  const pathname = usePathname();

  const { owner, repository, branch: currentBranch } = params;
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!owner || !repository) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/repositories/${owner}/${repository}/branches`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch repository branches");
        }
        
        const data: BranchesResponse = await response.json();
        setBranches(data.branches);
        setDefaultBranch(data.defaultBranch);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [owner, repository]);

  // The branch might not be in the URL if the user is at the root explorer path
  // We need to determine the selected branch based on the path or default
  const pathSegments = pathname.split("/");
  const viewTypeIndex = pathSegments.findIndex(
    (seg) => seg === "tree" || seg === "blob"
  );
  const branchFromPath =
    viewTypeIndex !== -1 && pathSegments.length > viewTypeIndex + 1
      ? pathSegments[viewTypeIndex + 1]
      : null;

  const selectedBranch = branchFromPath ?? currentBranch ?? defaultBranch ?? "main";

  const handleBranchChange = (newBranch: string) => {
    if (newBranch === selectedBranch) return;

    // Construct the new path based on the current path structure
    // Assumes structure like /<owner>/<repo>/tree/<branch>/... or /<owner>/<repo>/blob/<branch>/...
    const pathSegments = pathname.split("/");
    const viewTypeIndex = pathSegments.findIndex(
      (seg) => seg === "tree" || seg === "blob"
    );

    if (viewTypeIndex !== -1 && pathSegments.length > viewTypeIndex + 1) {
      // Replace the branch segment
      pathSegments[viewTypeIndex + 1] = newBranch;
      // Keep the rest of the path if it exists
      const newPath = pathSegments.join("/");
      router.push(newPath);
    } else {
      // If not in tree/blob view, navigate to the root tree view of the new branch
      router.push(`/${owner}/${repository}/tree/${newBranch}`);
    }
  };

  if (isLoading) {
    return <div className="p-2 text-sm text-muted-foreground">Loading branches...</div>;
  }

  if (error) {
    return <div className="p-2 text-sm text-muted-foreground">Error: {error}</div>;
  }

  if (!branches.length) {
    return <div className="p-2 text-sm text-muted-foreground">No branches found</div>;
  }

  return (
    <Select value={selectedBranch} onValueChange={handleBranchChange}>
      <SelectTrigger className="w-full h-8 focus:ring-0 focus:ring-offset-0 border-none shadow-none !bg-transparent">
        <div className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap ">
          <span className="truncate font-medium max-w-48 flex items-center">
            <GitBranch className="mr-2 h-4 w-4" />
            {selectedBranch}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
        {branches.map((branch) => (
          <SelectItem
            key={branch.name}
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
