import { getServerSession } from "next-auth";
import { cache } from "react";
import { Role } from "@prisma/client";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { db } from '@/lib/db';

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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userId: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { userId: credentials.userId },
        });

        if (!user) {
          return null;
        }

        const passwordValid = await compare(credentials.password, user.passwordHash);

        if (!passwordValid) {
          return null;
        }

        return {
          userId: user.userId,
          name: user.firstName + ' ' + user.lastName || '',
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.userId = token.userId as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.userId;
        token.role = user.role as Role;
      }
      return token;
    },
  },
};

declare module 'next-auth' {
  interface Session {
    user: {
      userId: string;
      name: string;
      role: string;
    };
  }
  
  interface User {
    userId: string;
    name: string;
    role: string;
  }
} 