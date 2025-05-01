"use client";

import { Role } from "@prisma/client"; // Assuming Role enum is accessible
import { notFound, useParams } from "next/navigation"; // Use useParams hook
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/auth";
import StudentProfilePage from "@/components/student/profile/profile-page";
import { useSession } from "next-auth/react";
import router from "next/router";

// Define an interface for the user data structure
interface UserData {
  id: string;
  username: string;
  role: Role;
  firstName?: string;
  // Add other potential user fields if needed
}

export default function UserPage() {
  // Use the useParams hook to get route parameters
  const params = useParams();
  const ownerId = params?.ownerId as string;
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // State to track if the user was not found
  const [isNotFound, setIsNotFound] = useState(false);

  // useEffect hook for data fetching on component mount or when ownerId changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      // Fetch current user's group information
      findUserByUsername(ownerId);
    }
  }, [ownerId, status]); // Re-run effect if ownerId changes

  // Handle the not found case - calling notFound() directly doesn't work in Client Components
  // You might redirect, show a message, or render a specific component
  useEffect(() => {
    if (isNotFound) {
      // Option 1: Redirect (requires useRouter hook from 'next/navigation')
      // import { useRouter } from 'next/navigation';
      // const router = useRouter();
      // router.push('/404'); // Or your custom 404 page

      // Option 2: Use Next.js notFound() - this might trigger the nearest not-found.js file
      notFound();
    }
  }, [isNotFound]);

  async function findUserByUsername(username: string) {
    setIsNotFound(false); // Reset not found state
    setUserData(null); // Reset user data

    try {


      const response = await fetch(`/api/users/${username}`);

      if (response.ok) {
        const data: UserData = await response.json();
        setUserData(data); // Set user data on success
      } else if (response.status === 404) {
        console.log(`User not found for username: ${username}`);
        setIsNotFound(true); // Set not found state
      } else {
        // Handle other non-OK responses
        console.error(`Error fetching user: ${response.statusText}`);
        setIsNotFound(true); // Treat other errors as not found for simplicity here
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setIsNotFound(true); // Set not found on network or other errors
    } finally {
    }
  }

  // If user data exists, render the profile based on role
  if (userData) {
    if (userData.role === Role.STUDENT) {
      return <StudentProfilePage userId={userData.id} username={userData.username} owner={ownerId === userData.username} />;
    }

    // Default profile page for other user types
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold">Profile Page for {userData.firstName || userData.username}</h1>
        <p className="mt-4 text-muted-foreground">
          This is a {userData.role.toLowerCase()} profile. Full profile details coming soon.
        </p>
      </div>
    );
  }

  // If not loading and no user data (and notFound hasn't redirected yet),
  // you might render a fallback or null. The notFound() call should handle this.
  return null; // Or a fallback UI while notFound() processes
}
