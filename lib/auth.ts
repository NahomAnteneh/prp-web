import { getServerSession } from "next-auth";
import { cache } from "react";
import { Role } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Use React cache to prevent multiple session fetches within a request
export const getSession = cache(async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
});

// Utility to get the current user from the session
export const getCurrentUser = cache(async () => {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
});

// Utility to check if user is authenticated
export const isAuthenticated = cache(async () => {
  try {
    const session = await getSession();
    return !!session?.user;
  } catch (error) {
    console.error("Authentication check error:", error);
    return false;
  }
});

// Utility to check if user has specific role
export const hasRole = cache(async (role: Role | string) => {
  try {
    const user = await getCurrentUser();
    return user?.role === role;
  } catch (error) {
    console.error("Role check error:", error);
    return false;
  }
}); 