import { notFound } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import StudentProfilePage from "@/components/student/profile/profile-page"
import { db } from "@/lib/db"
import RepositoryList from "../components/repository/repository-list"

// Define the Role enum that matches Prisma's schema
enum Role {
  STUDENT = "STUDENT",
  ADVISOR = "ADVISOR",
  EVALUATOR = "EVALUATOR",
  ADMIN = "ADMIN"
}

export default async function UserPage({ params }: { params: { owner: string } }) {
  // Check authentication (might be needed for future enhancements)
  await isAuthenticated()
  
  // Fetch user from database
  const user = await db.user.findFirst({
    where: {
      OR: [
        { id: params.owner },
        { username: params.owner }
      ]
    }
  })
  
  // If user not found, return 404
  if (!user) {
    notFound()
  }
  
  // Fetch user's repositories
  const repositories = await fetch(
    `/api/repositories?owner=${user.id}`
  ).then(res => {
    if (!res.ok) return [];
    return res.json();
  });
  
  // If user is a student, display the student profile
  if (user.role === Role.STUDENT) {
    return (
      <div className="space-y-8">
        <StudentProfilePage userId={user.id} />
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Repositories</h2>
          <RepositoryList repositories={repositories} />
        </div>
      </div>
    )
  }
  
  // Default profile page for other user types (can be expanded later)
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile Page for {user.name || user.username}</h1>
        <p className="mt-4 text-muted-foreground">
          This is a {user.role.toLowerCase()} profile. Full profile details coming soon.
        </p>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Repositories</h2>
        <RepositoryList repositories={repositories} />
      </div>
    </div>
  )
}
