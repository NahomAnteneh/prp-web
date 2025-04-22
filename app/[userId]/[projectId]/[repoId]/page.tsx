
export default function UserPage({ params }: { params: { repoId: string, projectId: string } }) {
    return (
      <div>
        <h1>Repository Name:  {params.repoId} <br></br>  Project name: {params.projectId}</h1>
      </div>
    )
  }
  