"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface Filters {
  search: string;
  status: string[];
  departments: string[];
  batchYears: string[];
  advisors: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  // Example department and batch year data
  const departments = ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Business"];
  const batchYears = ["2024", "2023", "2022", "2021"];
  const statuses = ["ACTIVE", "COMPLETED", "DRAFT"];
  const advisorsList = ["Dr. Alice Johnson", "Dr. Robert Brown", "Dr. Emily Davis", "Dr. Michael Wilson"];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const toggleFilter = (type: keyof Filters, value: string) => {
    if (type === "search") return;
    
    const currentValues = [...(filters[type] as string[])];
    if (currentValues.includes(value)) {
      onFilterChange({
        ...filters,
        [type]: currentValues.filter(item => item !== value)
      });
    } else {
      onFilterChange({
        ...filters,
        [type]: [...currentValues, value]
      });
    }
  };

  const FilterSection = ({ 
    title, 
    items, 
    filterType 
  }: { 
    title: string; 
    items: string[]; 
    filterType: keyof Filters 
  }) => (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = (filters[filterType] as string[]).includes(item);
          return (
            <Badge
              key={item}
              className="cursor-pointer"
              variant={isSelected ? "default" : "outline"}
              onClick={() => toggleFilter(filterType, item)}
            >
              {item}
            </Badge>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="font-medium mb-2">Search</h3>
          <Input
            placeholder="Search projects..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        
        <Separator />
        
        <FilterSection 
          title="Status" 
          items={statuses} 
          filterType="status" 
        />
        
        <Separator />
        
        <FilterSection 
          title="Department" 
          items={departments} 
          filterType="departments" 
        />
        
        <Separator />
        
        <FilterSection 
          title="Batch Year" 
          items={batchYears} 
          filterType="batchYears" 
        />
        
        <Separator />
        
        <FilterSection 
          title="Advisors" 
          items={advisorsList} 
          filterType="advisors" 
        />
        
        <Separator />
        
        <button 
          className="w-full bg-secondary text-secondary-foreground py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
          onClick={() => onFilterChange({
            search: "",
            status: [],
            departments: [],
            batchYears: [],
            advisors: []
          })}
        >
          Clear All Filters
        </button>
      </CardContent>
    </Card>
  );
} 