import { Role } from "@prisma/client"
import { notFound } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import StudentProfilePage from "@/components/student/profile/profile-page"
import { db } from "@/lib/db"

export default async function UserPage({ params }: { params: { ownerId: string } }) {
  // Check authentication (might be needed for future enhancements)
  await isAuthenticated()
  
  // Fetch user from database
  const owner = await db.user.findFirst({
    where: {
      OR: [
        { username: params.ownerId }
      ]
    }
  })
  
  // If user not found, return 404
  if (!owner) {
    notFound()
  }


  
  // If user is a student, display the student profile
  if (owner.role === Role.STUDENT) {
    return <StudentProfilePage userId={params.ownerId} />
  }
  
  // Default profile page for other user types (can be expanded later)
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">Profile Page for {owner.firstName || owner.username}</h1>
      <p className="mt-4 text-muted-foreground">
        This is a {owner.role.toLowerCase()} profile. Full profile details coming soon.
      </p>
    </div>
  )
}
