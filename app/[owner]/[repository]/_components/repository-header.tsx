"use client";

import Link from "next/link";
import { Menu, Github, GitGraph, GitBranchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepositoryNav } from "./repository-nav";
import ShallowLink from "@/components/shallow-link";
import { BranchSelector } from "../(explorer)/_components/branch-selector";

interface RepositoryHeaderProps {
  owner: string;
  repository: string;
  description?: string;
  session?: {
    user: {
      name?: string;
    };
  } | null;
}

export function RepositoryHeader({
  owner,
  repository,
  description,
  session,
}: RepositoryHeaderProps) {
  return (
    <header className="bg-background">
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-foreground">{repository}</h1>
          {description && (
            <p className="text-sm text-muted-foreground ml-4">{description}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="w-64 bg-white dark:bg-transparent rounded-md border">
            <BranchSelector />
          </div>
          <div className="">
            {/* Star button can be added here if needed */}
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="mt-4">
        <RepositoryNav owner={owner} repository={repository} />
      </div>
    </header>
  );
}

export default RepositoryHeader;
