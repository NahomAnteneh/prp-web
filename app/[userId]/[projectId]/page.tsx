
export default function ProjectPage({ params }: { params: { projectId: string } }) {
    return (
      <div>
        <h1>Project page {params.projectId}</h1>
      </div>
    )
  }
  