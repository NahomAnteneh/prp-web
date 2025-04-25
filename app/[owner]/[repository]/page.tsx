import { Badge } from "@/components/ui/badge";
import FolderView from "./_components/repository-file-list";
import { notFound } from "next/navigation";
import { RepositoryHeader } from "./_components/repository-header";
import RepositoryMarkdown from "./_components/repository-markdown";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

// Define the types for repository data
interface RepositoryData {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    username: string;
  };
  defaultBranchRef: {
    name: string;
    id: string;
  } | null;
  repositoryTopics?: {
    nodes: Array<{
      topic: {
        name: string;
      };
    }>;
  };
  mentionableUsers?: {
    nodes: Array<{
      id: string;
      username?: string;
      name?: string;
      avatarUrl?: string;
    }>;
  };
}

// Define the type for file/folder contents
interface FileNode {
  name: string;
  path: string;
  type: "tree" | "blob";
  size: number;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository } = await params;
  
  // Fetch repository overview using REST API
  const repoOverviewPromise = fetch(
    `/api/repositories/${owner}/${repository}`
  ).then(res => {
    if (!res.ok) throw new Error('Failed to fetch repository overview');
    return res.json() as Promise<RepositoryData>;
  });

  // Fetch folder contents using REST API
  const folderDataPromise = fetch(
    `/api/repositories/${owner}/${repository}/contents?branch=main&path=`
  ).then(res => {
    if (!res.ok) throw new Error('Failed to fetch folder contents');
    return res.json() as Promise<FileNode[]>;
  });

  // Fetch README content using REST API
  const readmeDataPromise = fetch(
    `/api/repositories/${owner}/${repository}/readme?branch=main`
  ).then(res => {
    if (!res.ok) return null;
    return res.text();
  });

  let data: RepositoryData;
  let folderData: FileNode[];
  let readmeData: string | null;

  try {
    [data, folderData, readmeData] = await Promise.all([
      repoOverviewPromise,
      folderDataPromise,
      readmeDataPromise,
    ]);
  } catch (error) {
    console.error('Error fetching repository data:', error);
    notFound();
  }

  if (!data || !folderData) {
    notFound();
  }

  const branch = data.defaultBranchRef?.name ?? "main";

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full flex flex-col gap-4">
      {/* Repository header with name and branch selector */}
      <RepositoryHeader 
        owner={owner} 
        repository={repository}
        description={data.description}
      />

      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="border-x">
            <FolderView
              hardnav={true}
              data={folderData}
              branch={data.defaultBranchRef?.name ?? "main"}
              owner={owner}
              repository={repository}
            />
          </div>

          {readmeData && (
            <div className="border-t p-4 w-full border-x border-b">
              <RepositoryMarkdown
                content={readmeData}
                owner={owner}
                repository={repository}
                branch={branch}
              />
            </div>
          )}
        </div>

        {/* Description / Metadata */}
        <div className="col-span-1 flex flex-col gap-2">
          <section className="flex flex-col gap-2">
            <div className="">
              <h2 className="font-bold">About</h2>
              {data.description && <p>{data.description}</p>}
            </div>
            <div>
              {data.repositoryTopics?.nodes && data.repositoryTopics.nodes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.repositoryTopics.nodes.map((topic) => (
                    <Badge key={topic.topic.name}>{topic.topic.name}</Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Contributors */}
          {data.mentionableUsers?.nodes && data.mentionableUsers.nodes.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold">Contributors</h3>
              <div className="flex flex-wrap gap-1">
                {data.mentionableUsers.nodes.map((user) => (
                  <img
                    key={user.username || user.id}
                    src={user.avatarUrl || `/api/avatar/${user.username}`}
                    alt={user.username || user.name || ""}
                    className="h-8 w-8 rounded-full"
                    title={user.username || user.name || ""}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
