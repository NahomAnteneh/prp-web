/**
 * Repository management service functions
 * Abstracts API calls for repository operations
 */

import { getRepositoryEndpoints } from "@/config/api";

// Repository creation
export async function createRepository(name: string, description: string, isPrivate: boolean) {
  const response = await fetch(getRepositoryEndpoints.create(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to create repository: ${response.status}`);
  }

  return response.json();
}

// Repository update
export async function updateRepository(
  username: string, 
  repo: string, 
  updates: { name?: string, description?: string, private?: boolean }
) {
  const response = await fetch(getRepositoryEndpoints.update(username, repo), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update repository: ${response.status}`);
  }

  return response.json();
}

// Repository deletion
export async function deleteRepository(username: string, repo: string) {
  const response = await fetch(getRepositoryEndpoints.delete(username, repo), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete repository: ${response.status}`);
  }

  return response.json();
}

// Fork repository
export async function forkRepository(username: string, repo: string) {
  const response = await fetch(getRepositoryEndpoints.fork(username, repo), {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fork repository: ${response.status}`);
  }

  return response.json();
}

// Get repository branches
export async function getRepositoryBranches(username: string, repo: string) {
  const response = await fetch(getRepositoryEndpoints.branches(username, repo));

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to get branches: ${response.status}`);
  }

  return response.json();
}

// Get repository commits with pagination
export async function getRepositoryCommits(username: string, repo: string, page = 1, limit = 30) {
  const response = await fetch(`${getRepositoryEndpoints.commits(username, repo)}?page=${page}&limit=${limit}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to get commits: ${response.status}`);
  }

  return response.json();
}

// Get file content
export async function getFileContent(username: string, repo: string, ref: string, path: string) {
  const response = await fetch(getRepositoryEndpoints.blob(username, repo, ref, path));

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to get file content: ${response.status}`);
  }

  return response.json();
} 