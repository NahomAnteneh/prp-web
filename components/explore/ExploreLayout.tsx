"use client";

import React from "react";
import ProjectList from "./ProjectList";
import FilterSidebar from "./FilterSidebar";

export default function ExploreLayout({
  projects,
  filters,
  onFilterChange,
}: {
  projects: any[];
  filters: any;
  onFilterChange: (filters: any) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-screen-2xl mx-auto px-4">
      <div className="w-full md:w-64 flex-shrink-0">
        <FilterSidebar filters={filters} onFilterChange={onFilterChange} />
      </div>
      <div className="flex-grow">
        <ProjectList projects={projects} />
      </div>
    </div>
  );
} 