import { Badge } from "@/components/ui/badge";
import { BranchSelector } from "./(explorer)/_components/branch-selector";
import FolderView from "./_components/repository-file-list";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
}

// Add a helper function to transform image URLs.
function transformImgUrl(
  src: string | undefined,
  owner: string,
  repository: string,
  branch?: string
): string {
  if (!src) return "";

  if (src.startsWith("http")) {
    return src;
  }

  // Use relative URL for local files
  return `/api/repositories/${owner}/${repository}/file?path=${src}&branch=${branch || "main"}`;
}

interface RepositoryData {
  id: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  topics: Array<{ id: string; name: string }>;
  contributors: Array<{ id: string; name: string; avatarUrl: string }>;
  starCount: number;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository } = await params;
  
  // Fetch repository data
  const repoResponse = await fetch(`/api/repositories/${owner}/${repository}/overview`);
  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      notFound();
    }
    throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`);
  }
  const data: RepositoryData = await repoResponse.json();
  
  // Fetch folder contents
  const folderResponse = await fetch(`/api/repositories/${owner}/${repository}/tree?path=&branch=${data.defaultBranch || "main"}`);
  if (!folderResponse.ok) {
    throw new Error(`Failed to fetch repository contents: ${folderResponse.statusText}`);
  }
  const folderItems: FileItem[] = await folderResponse.json();
  
  // Fetch README content
  const readmeResponse = await fetch(`/api/repositories/${owner}/${repository}/file?path=README.md&branch=${data.defaultBranch || "main"}`);
  let readmeData = "";
  if (readmeResponse.ok) {
    readmeData = await readmeResponse.text();
  }

  const branch = data.defaultBranch || "main";

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full flex flex-col gap-4">
      {/* Branch selector and repo name row */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground ">{repository}</h1>
        <div className="flex items-center justify-between">
          <div className="w-64 bg-white dark:bg-transparent rounded-md border">
            <BranchSelector />
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-4 gap-8">
        {/* File Browser and README */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="border-x">
            <FolderView
              items={folderItems}
              branch={branch}
              owner={owner}
              repo={repository}
            />
          </div>

          {readmeData && (
            <div className="border-t p-4 w-full border-x border-b">
              <div className="prose dark:prose-invert max-w-none">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ node, ...props }) => (
                      <img
                        src={transformImgUrl(props.src, owner, repository, branch)}
                        alt={props.alt || ""}
                        {...props}
                      />
                    ),
                  }}
                >
                  {readmeData}
                </Markdown>
              </div>
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
              {data.topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.topics.map((topic) => (
                    <Badge key={topic.id}>{topic.name}</Badge>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Contributors */}
          {data.contributors.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold">Contributors</h3>
              <div className="flex flex-wrap gap-1">
                {data.contributors.map((user) => (
                  <img
                    key={user.id}
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                    title={user.name}
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
