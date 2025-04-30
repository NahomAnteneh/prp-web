// API service for fetching projects

export interface ProjectFilters {
  search?: string;
  status?: string[];
  departments?: string[];
  batchYears?: string[];
  advisors?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  advisor?: {
    id: string;
    name: string;
    username: string;
    profileInfo?: {
      expertise?: string[];
    };
  };
  members?: {
    userId: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
  }[];
}

export async function fetchProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => {
        queryParams.append('status', status);
      });
    }
    
    if (filters.departments && filters.departments.length > 0) {
      filters.departments.forEach(dept => {
        queryParams.append('department', dept);
      });
    }
    
    if (filters.batchYears && filters.batchYears.length > 0) {
      filters.batchYears.forEach(year => {
        queryParams.append('batchYear', year);
      });
    }
    
    if (filters.advisors && filters.advisors.length > 0) {
      filters.advisors.forEach(advisor => {
        queryParams.append('advisor', advisor);
      });
    }
    
    const response = await fetch(`/api/projects/public?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
} 