"use client";

import React, { useEffect, useState } from "react";
import ExploreLayout from "@/components/explore/ExploreLayout";
import SearchHeader from "@/components/explore/SearchHeader";
import { fetchProjects, Project } from "@/components/explore/api";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
export default function Explore() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    status: [] as string[],
    departments: [] as string[],
    batchYears: [] as string[],
    advisors: [] as string[],
  });

  useEffect(() => {
    const getProjects = async () => {
      setLoading(true);
      try {
        const data = await fetchProjects({
          search: filters.search,
          status: filters.status,
          departments: filters.departments,
          batchYears: filters.batchYears,
          advisors: filters.advisors,
        });
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    getProjects();
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <>
    <Navbar />
    <div className="container mx-auto py-8">
      <SearchHeader
        search={filters.search}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        totalResults={projects.length}
      />
      
      <Separator className="my-6" />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ExploreLayout
          projects={projects}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
    <Footer />
</>

  );
}
