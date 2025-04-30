import { Role } from "@prisma/client"
import { notFound } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import StudentProfilePage from "@/components/student/profile/profile-page"

// Function to safely fetch user data
async function findUserByUsername(username: string) {
  try {
    // In server components, we need to use absolute URLs
    const origin = process.env.NEXT_PUBLIC_API_URL;

    // Try looking up the user by username directly
    const response = await fetch(`${origin}/api/users/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    // If the user is found, return the data
    if (response.ok) {
      return await response.json();
    }
    
    console.log(`User not found for username: ${username}`);
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function UserPage({ params }: { params: { ownerId: string } }) {
  // Check authentication (might be needed for future enhancements)
  await isAuthenticated()
  
  // Retrieve and await the params
  const { ownerId } = await params
  
  // Try to find the user by username
  const userData = await findUserByUsername(ownerId);
  
  // If user not found, return 404
  if (!userData) {
    notFound()
  }
  
  // If user is a student, display the student profile
  if (userData.role === Role.STUDENT) {
    return <StudentProfilePage userId={userData.id} username={userData.username} />
  }
  
  // Default profile page for other user types (can be expanded later)
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">Profile Page for {userData.firstName || userData.username}</h1>
      <p className="mt-4 text-muted-foreground">
        This is a {userData.role.toLowerCase()} profile. Full profile details coming soon.
      </p>
    </div>
  )
}
