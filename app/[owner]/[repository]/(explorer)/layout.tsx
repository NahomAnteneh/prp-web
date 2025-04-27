import { FileTree } from "./_components/file-tree";
import { BranchSelector } from "./_components/branch-selector";
import { Breadcrumbs } from "./_components/breadcrumbs";
import { notFound } from "next/navigation";
import type { TreeResponse } from "@/app/api/repositories/[owner]/[repo]/tree/route";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

export default async function ExplorerLayout({
  children,
  params,
}: LayoutProps) {
  const { owner, repository } = await params;

  let fileTreeInitial: TreeResponse | null = null;
  try {
    const response = await fetch(
      `/api/repositories/${owner}/${repository}/tree?branch=HEAD&recursive=false`,
      { next: { revalidate: 60 } } // Revalidate data every minute
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch repository tree: ${response.statusText}`);
    }
    
    fileTreeInitial = await response.json();
  } catch (error) {
    console.error("Error fetching repository tree:", error);
    if ((error as any)?.message?.includes("404")) {
      notFound();
    }
  }

  return (
    <>
      {fileTreeInitial && (
        <div className="grid grid-cols-12 w-full h-screen">
          <div className="col-span-3 border-r border-foreground/20 overflow-y-auto flex flex-col">
            <div className="border-b border-foreground/20 flex flex-col items-stretch gap-2 p-2">
              <BranchSelector />
            </div>

            <div className="flex-grow overflow-y-auto">
              <FileTree initialData={fileTreeInitial} />
            </div>
          </div>
          <div className="col-span-9 overflow-y-auto">
            <div className="border-b border-foreground/20">
              <Breadcrumbs />
            </div>
            <div className="">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
