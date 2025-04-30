"use client";

import React from "react";
import { Input } from "../ui/input";

interface SearchHeaderProps {
  search: string;
  onSearchChange: (search: string) => void;
  totalResults: number;
}

export default function SearchHeader({ search, onSearchChange, totalResults }: SearchHeaderProps) {
  return (
    <div className="w-full mb-8">
      <h1 className="text-3xl font-bold mb-4">Explore Projects</h1>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-auto max-w-xl">
          <Input
            type="text"
            placeholder="Search projects by name, description, technology..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          Showing {totalResults} {totalResults === 1 ? "result" : "results"}
        </div>
      </div>
    </div>
  );
} 