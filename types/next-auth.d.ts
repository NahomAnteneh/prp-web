import NextAuth, { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
    } & DefaultSession["user"];
  }

  // Extend the built-in user types
  interface User {
    id: string;
    username: string;
    role: Role;
  }
}

// Extend the JWT token types
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
  }
} 