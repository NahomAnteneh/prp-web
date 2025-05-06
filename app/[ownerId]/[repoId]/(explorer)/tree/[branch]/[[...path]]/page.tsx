import ExplorerView from "@/components/repository/explorer/explorer-view";

export default function Page() {
  // This page simply renders the client component,
  // which handles data fetching and rendering based on the URL.
  return (
    <ExplorerView
      fileTree={[]} // Replace with actual fileTree data
      fileData={null} // Replace with actual fileData
      isLoading={false} // Replace with actual loading state
    />
  );
}