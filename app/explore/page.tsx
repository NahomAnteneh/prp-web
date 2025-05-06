'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { fetchProjects, Project } from '@/components/explore/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Define types explicitly
interface ProfileInfo {
  id: string;
  name: string;
  username: string;
  profileInfo?: any; // Flexible for nested data
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  department?: string;
  batchYear?: string;
  advisor?: string;
  profileInfo?: ProfileInfo;
}

export default function Explore() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: [] as string[],
    departments: [] as string[],
    batchYears: [] as string[],
    advisors: [] as string[],
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sample filter options (replace with actual data from API if available)
  const filterOptions = {
    status: ['Active', 'Completed', 'Pending'],
    departments: ['Computer Science', 'Engineering', 'Mathematics'],
    batchYears: ['2023', '2024', '2025'],
    advisors: ['Dr. Smith', 'Prof. Jones', 'Dr. Brown'],
  };

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
        // Log raw data for debugging
        console.log('Raw API response:', data);

        // Transform data to ensure it matches Project type
        const transformedData = data.map((item: any): Project => ({
          id: item.id || '',
          title: item.title || 'Untitled Project',
          description: item.description || undefined,
          status: item.status || undefined,
          department: item.department || undefined,
          batchYear: item.batchYear || undefined,
          advisor: item.advisor || undefined,
          profileInfo: item.profileInfo
            ? {
                id: item.profileInfo.id || '',
                name: item.profileInfo.name || '',
                username: item.profileInfo.username || '',
                profileInfo: item.profileInfo.profileInfo || undefined,
              }
            : undefined,
        }));

        setProjects(transformedData);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Error fetching projects', {
          description: 'Unable to load projects. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    getProjects();
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleCheckboxChange = (category: keyof typeof filters, value: string) => {
    const currentValues = filters[category];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    handleFilterChange({ ...filters, [category]: updatedValues });
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              value={filters.search}
              onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
              placeholder="Search projects..."
              className="pl-10 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
              aria-label="Search projects"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} found
          </p>
        </div>

        <Separator className="my-6 border-gray-200 dark:border-gray-700" />

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mobile Filter Dropdown */}
                <div className="md:hidden">
                  <Select
                    value={isFilterOpen ? 'open' : 'closed'}
                    onValueChange={(value) => setIsFilterOpen(value === 'open')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Show Filters</SelectItem>
                      <SelectItem value="closed">Hide Filters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Filter Content */}
                <div className={`${isFilterOpen ? 'block' : 'hidden'} md:block space-y-6`}>
                  {/* Status Filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Status</h3>
                    {filterOptions.status.map((status) => (
                      <div key={status} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => handleCheckboxChange('status', status)}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {/* Department Filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Department</h3>
                    {filterOptions.departments.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={filters.departments.includes(dept)}
                          onCheckedChange={() => handleCheckboxChange('departments', dept)}
                        />
                        <Label htmlFor={`dept-${dept}`} className="text-sm">
                          {dept}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {/* Batch Year Filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Batch Year</h3>
                    {filterOptions.batchYears.map((year) => (
                      <div key={year} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`year-${year}`}
                          checked={filters.batchYears.includes(year)}
                          onCheckedChange={() => handleCheckboxChange('batchYears', year)}
                        />
                        <Label htmlFor={`year-${year}`} className="text-sm">
                          {year}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {/* Advisor Filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Advisor</h3>
                    {filterOptions.advisors.map((advisor) => (
                      <div key={advisor} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`advisor-${advisor}`}
                          checked={filters.advisors.includes(advisor)}
                          onCheckedChange={() => handleCheckboxChange('advisors', advisor)}
                        />
                        <Label htmlFor={`advisor-${advisor}`} className="text-sm">
                          {advisor}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Project Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                  <p className="text-center text-muted-foreground col-span-full">
                    No projects found. Try adjusting your filters.
                  </p>
                ) : (
                  projects.map((project) => (
                    <Card
                      key={project.id}
                      className="border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          {project.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {project.description || 'No description available.'}
                        </p>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            {project.status || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Department:</span>{' '}
                            {project.department || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Batch Year:</span>{' '}
                            {project.batchYear || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Advisor:</span>{' '}
                            {project.advisor || 'N/A'}
                          </p>
                          {project.profileInfo && (
                            <p>
                              <span className="font-medium">Created by:</span>{' '}
                              {project.profileInfo.name || project.profileInfo.username || 'N/A'}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="link"
                          className="mt-4 text-blue-600 hover:text-blue-700 p-0"
                          onClick={() => {
                            console.log(`View project: ${project.id}`);
                          }}
                        >
                          View Project
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}