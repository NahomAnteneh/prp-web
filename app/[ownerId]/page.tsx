"use client";

import { Group, Role } from "@prisma/client"; // Assuming Role enum is accessible
import { notFound, useParams } from "next/navigation"; // Use useParams hook
import { useEffect, useState } from "react";
import StudentProfilePage from "@/components/student/profile/profile-page";
import AdvisorProfilePage from "@/components/advisor/profile/profile-page";
import { useSession } from "next-auth/react";
import GroupPage from "@/components/group/group-page";

// Define an interface for the user data structure
interface UserData {
  userId: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}

// Define an interface for the group data structure
// interface GroupData {
//   groupId: string;
//   name: string;
// }

export default function UserPage() {
  // Use the useParams hook to get route parameters
  const params = useParams();
  const ownerId = params?.ownerId as string;
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    checkIfGroupOrUser(ownerId);
  }, [ownerId, status]);

  useEffect(() => {
    if (isNotFound) {
      notFound();
    }
  }, [isNotFound]);

  async function checkIfGroupOrUser(id: string) {
    setIsNotFound(false); // Reset not found state
    setUserData(null); // Reset user data
    setGroupData(null); // Reset group data

    try {
      // Check if it is a group
      const groupResponse = await fetch(`/api/groups/${id}`);

      if (groupResponse.ok) {
        const group: Group = await groupResponse.json();
        setGroupData(group); // Set group data on success
        return;
      }

      // If not a group, check if it is a user
      const userResponse = await fetch(`/api/users/${id}`);

      if (userResponse.ok) {
        const user: UserData = await userResponse.json();
        setUserData(user); // Set user data on success
      } else if (userResponse.status === 404) {
        console.log(`Entity not found for ID: ${id}`);
        setIsNotFound(true); // Set not found state
      } else {
        // Handle other non-OK responses
        console.error(`Error fetching entity: ${userResponse.statusText}`);
        setIsNotFound(true); // Treat other errors as not found for simplicity here
      }
    } catch (error) {
      console.error("Error fetching entity:", error);
      setIsNotFound(true); // Set not found on network or other errors
    }
  }

  // If group data exists, render the group page
  if (groupData) {
    return (
      <div>
        <div className="bg-blue-50 py-2 border-b mb-4">
          <div className="container mx-auto">
            <h1 className="text-lg text-blue-800 font-medium">Viewing Group Profile</h1>
          </div>
        </div>
        <GroupPage groupData={groupData} isVisitor={status !== "authenticated"} />
      </div>
    );
  }

  // If user data exists, render the profile based on role
  if (userData) {
    const isVisitor = status !== "authenticated";
    
    if (userData.role === Role.STUDENT) {
      return (
        <>
          <div className="bg-blue-50 py-2 border-b mb-4">
            <div className="container mx-auto">
              <h1 className="text-lg text-blue-800 font-medium">Viewing Student Profile</h1>
            </div>
          </div>
          <StudentProfilePage userId={userData.userId} username={userData.userId} visitor={isVisitor} />
        </>
      );
    }
    
    if (userData.role === Role.ADVISOR) {
      return (
        <>
          <div className="bg-blue-50 py-2 border-b mb-4">
            <div className="container mx-auto">
              <h1 className="text-lg text-blue-800 font-medium">Viewing Advisor Profile</h1>
            </div>
          </div>
          <AdvisorProfilePage userId={userData.userId} username={userData.userId} visitor={isVisitor} />
        </>
      );
    }

    // Default profile page for other user types
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-blue-50 py-2 border-b mb-4 -mx-4">
          <div className="container mx-auto">
            <h1 className="text-lg text-blue-800 font-medium">Viewing Profile</h1>
          </div>
        </div>
        <h1 className="text-3xl font-bold">Profile Page for {userData.firstName || userData.userId}</h1>
        <p className="mt-4 text-muted-foreground">
          This is a {userData.role.toLowerCase()} profile. Full profile details coming soon.
        </p>
      </div>
    );
  }

  // If not loading and no user or group data (and notFound hasn't redirected yet),
  // you might render a fallback or null. The notFound() call should handle this.
  return null; // Or a fallback UI while notFound() processes
}
