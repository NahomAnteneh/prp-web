/**
 * API configuration for the repository server
 * 
 * This file centralizes the repository server configuration
 * The API URL can be overridden using the NEXT_PUBLIC_API_URL environment variable
 */

// Default to localhost:8080 if no environment variable is set
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// API endpoint mapping functions to convert from app format to repository server format
export const getRepositoryEndpoints = {
  // Repository overview
  overview: (username: string, repo: string) => 
    `${API_URL}/${username}/${repo}`,
  
  // File tree
  tree: (username: string, repo: string, ref: string, path: string = '') => 
    path ? `${API_URL}/${username}/${repo}/tree/${ref}/${path}` : `${API_URL}/${username}/${repo}/tree/${ref}`,
  
  // File content
  blob: (username: string, repo: string, ref: string, path: string) => 
    `${API_URL}/${username}/${repo}/blob/${ref}/${path}`,
  
  // Commits
  commits: (username: string, repo: string, ref?: string) => 
    ref ? `${API_URL}/${username}/${repo}/commits/${ref}` : `${API_URL}/${username}/${repo}/commits`,
  
  // Branches
  branches: (username: string, repo: string, branchName?: string) => 
    branchName ? `${API_URL}/${username}/${repo}/branches/${branchName}` : `${API_URL}/${username}/${repo}/branches`,
  
  // README (special case, maps to blob with README.md path)
  readme: (username: string, repo: string, ref: string) => 
    `${API_URL}/${username}/${repo}/blob/${ref}/README.md`,
    
  // Repository actions
  create: () => `${API_URL}/create`,
  update: (username: string, repo: string) => `${API_URL}/${username}/${repo}`,
  delete: (username: string, repo: string) => `${API_URL}/${username}/${repo}`,
  fork: (username: string, repo: string) => `${API_URL}/${username}/${repo}/fork`,
  
  // Feedback endpoints (custom extension)
  feedback: {
    list: (username: string, repo: string) => 
      `${API_URL}/${username}/${repo}/feedback`,
    get: (username: string, repo: string, feedbackId: string) => 
      `${API_URL}/${username}/${repo}/feedback/${feedbackId}`,
    create: (username: string, repo: string) => 
      `${API_URL}/${username}/${repo}/feedback`,
    update: (username: string, repo: string, feedbackId: string) => 
      `${API_URL}/${username}/${repo}/feedback/${feedbackId}`
  }
}; 