import { FeedbacksClient } from "./feedbacks-client";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
  }>;
  searchParams: Promise<{
    state?: "open" | "closed" | "all";
    search?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ owner, repository }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <FeedbacksClient
      owner={owner}
      repository={repository}
      initialState={resolvedSearchParams.state ?? "open"}
      initialSearch={resolvedSearchParams.search}
    />
  );
}
