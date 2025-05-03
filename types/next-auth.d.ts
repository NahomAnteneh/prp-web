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