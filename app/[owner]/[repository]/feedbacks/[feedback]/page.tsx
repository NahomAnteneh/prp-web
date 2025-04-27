import { Suspense } from "react";
import { FeedbackClient } from "./feedback-client";

interface PageProps {
  params: Promise<{
    owner: string;
    repository: string;
    feedback: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { owner, repository, feedback } = await params;

  return (
    <div className="p-4 mx-auto md:max-w-7xl w-full">
      <Suspense fallback={<div>Loading feedback...</div>}>
        <FeedbackClient
          owner={owner}
          repository={repository}
          feedbackNumber={parseInt(feedback, 10)}
        />
      </Suspense>
    </div>
  );
}
