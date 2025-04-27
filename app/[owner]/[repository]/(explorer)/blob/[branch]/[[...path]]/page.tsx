import ExplorerView from "@/app/[owner]/[repository]/(explorer)/_components/explorer-view";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    branch: string;
    path?: string[];
  }>;
}

export default async function Page({ params }: PageProps) {
  const awaitedParams = await params;

  const formattedPath = awaitedParams.path ? awaitedParams.path.join("/") : "";

  // Prefetch file content using our API to improve UX
  console.log("Prefetching file content for", {
    owner: awaitedParams.owner,
    repository: awaitedParams.repository,
    branch: awaitedParams.branch,
    path: formattedPath,
  });

  // Use server-side fetch to prefetch the file
  try {
    await fetch(`/api/repositories/${awaitedParams.owner}/${awaitedParams.repository}/file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: formattedPath,
        branch: awaitedParams.branch,
      }),
      cache: "force-cache", // Use Next.js cache to improve performance
    });
  } catch (error) {
    console.error("Error prefetching file content:", error);
  }

  return <ExplorerView />;
}
