import { NextRequest, NextResponse } from "next/server";
import { mockProjects } from "../../mock-data";

// Define the enhanced project type
interface EnhancedProject {
  id: string;
  title: string;
  description: string;
  status: string;
  submissionDate: string | null;
  createdAt: string;
  updatedAt: string;
  department: string;
  batchYear: string;
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
  milestones?: {
    title: string;
    description: string;
    deadline: string;
    completed: boolean;
  }[];
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  
  // Get filter parameters
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.getAll("status");
  const departments = url.searchParams.getAll("department");
  const batchYears = url.searchParams.getAll("batchYear");
  const advisors = url.searchParams.getAll("advisor");
  
  // Apply filters to mock projects
  // In a real implementation, this would query a database
  let filteredProjects: EnhancedProject[] = [];
  
  // Add some mock data for demonstration
  const enhancedProjects = mockProjects.map(project => ({
    ...project,
    department: ["Computer Science", "Electrical Engineering", "Mechanical Engineering"][
      Math.floor(Math.random() * 3)
    ],
    batchYear: ["2021", "2022", "2023", "2024"][Math.floor(Math.random() * 4)],
    advisor: project.id === "project-1" 
      ? {
          id: "advisor-1",
          name: "Dr. Alice Johnson",
          username: "alicejohnson",
          profileInfo: {
            expertise: ["Artificial Intelligence", "Machine Learning", "Data Science"],
          }
        }
      : {
          id: "advisor-2",
          name: "Dr. Robert Brown",
          username: "robertbrown",
          profileInfo: {
            expertise: ["Software Engineering", "Web Development"],
          }
        },
    members: [
      {
        userId: "user-1",
        user: {
          id: "user-1",
          name: "John Doe",
          username: "johndoe",
        }
      },
      {
        userId: "user-2",
        user: {
          id: "user-2",
          name: "Jane Smith",
          username: "janesmith",
        }
      }
    ]
  })) as EnhancedProject[];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProjects = enhancedProjects.filter(project => 
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  } else {
    filteredProjects = enhancedProjects;
  }
  
  // Apply status filter
  if (status.length > 0) {
    filteredProjects = filteredProjects.filter(project => 
      status.includes(project.status)
    );
  }
  
  // Apply department filter
  if (departments.length > 0) {
    filteredProjects = filteredProjects.filter(project => 
      departments.includes(project.department)
    );
  }
  
  // Apply batch year filter
  if (batchYears.length > 0) {
    filteredProjects = filteredProjects.filter(project => 
      batchYears.includes(project.batchYear)
    );
  }
  
  // Apply advisor filter
  if (advisors.length > 0) {
    filteredProjects = filteredProjects.filter(project => 
      project.advisor && advisors.includes(project.advisor.name)
    );
  }
  
  // Duplicate some projects to have more data for testing
  if (filteredProjects.length < 5) {
    const duplicates = filteredProjects.map((project, index) => ({
      ...project,
      id: `${project.id}-duplicate-${index}`,
      title: `${project.title} (Copy ${index + 1})`,
    }));
    
    filteredProjects = [...filteredProjects, ...duplicates];
  }
  
  return NextResponse.json(filteredProjects);
} 