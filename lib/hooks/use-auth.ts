"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { useEffect, useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  
  // Clear any auth errors when session status changes
  useEffect(() => {
    if (status !== 'loading') {
      setAuthError(null);
    }
  }, [status]);
  
  // Sign in with our custom API endpoint
  const login = async (identifier: string, password: string, callbackUrl = "/") => {
    try {
      setAuthError(null);
      
      // Use NextAuth's signIn directly - this is the simplest and most reliable approach
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setAuthError(result.error);
        return { success: false, error: result.error };
      }
      
      if (result?.ok) {
        // Navigate to dashboard or callback URL
        router.push(callbackUrl);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Something went wrong";
      setAuthError(errorMsg);
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };
  
  // Log out user
  const logout = async (callbackUrl = "/") => {
    try {
      setAuthError(null);
      // Clear the JWT token from local storage
      localStorage.removeItem('authToken');
      await signOut({ redirect: false });
      router.push(callbackUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Error logging out";
      setAuthError(errorMsg);
      console.error("Logout error:", error);
    }
  };
  
  // Check if user has specific role
  const hasRole = (role: Role | string) => {
    return user?.role === role;
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    authError,
    clearAuthError: () => setAuthError(null),
  };
} 