import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      role: Role;
    } & DefaultSession["user"];
  }

  // Extend the built-in user types
  interface User {
    id: string;   // Standard NextAuth property
    userId: string;
    role: Role;
  }
}

// Extend the JWT token types
declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
  }
} 