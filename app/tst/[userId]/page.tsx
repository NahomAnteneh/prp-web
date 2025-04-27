import { Role } from "@prisma/client"
import { notFound } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import StudentProfilePage from "@/components/student/profile/profile-page"
import { db } from "@/lib/db"

export default async function UserPage({ params }: { params: { userId: string } }) {
  // Check authentication (might be needed for future enhancements)
  await isAuthenticated();

  // Await params to ensure proper handling of dynamic routes
  const { userId } = await params;

  // Fetch user from database
  const user = await db.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { username: userId }
      ]
    }
  });

  // If user not found, return 404
  if (!user) {
    notFound();
  }

  // If user is a student, display the student profile
  if (user.role === Role.STUDENT) {
    return <StudentProfilePage userId={userId} />;
  }

  // Default profile page for other user types (can be expanded later)
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">Profile Page for {user.username}</h1>
      <p className="mt-4 text-muted-foreground">
        This is a {user.role.toLowerCase()} profile. Full profile details coming soon.
      </p>
    </div>
  );
}
