
export default function UserPage({ params }: { params: { userId: string } }) {
  return (
    <div>
      <h1>Profile Page for {params.userId}</h1>
    </div>
  )
}
