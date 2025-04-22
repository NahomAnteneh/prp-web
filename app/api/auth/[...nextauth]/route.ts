import NextAuth, { type AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define options for NextAuth
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // Find user by username (identifier can be username)
        const user = await prisma.user.findUnique({
          where: { username: credentials.identifier }
        });

        if (!user) {
          // If user not found by username, could be using email in the profileInfo JSON
          // NOTE: This is just a fallback in case the user is using email instead of username
          // In a proper implementation, you might want to add an email field to the User model
          return null;
        }

        // Check if passwords match
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        // Return user object without password
        return {
          id: user.id,
          name: user.name || user.username,
          username: user.username,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.role = token.role as Role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
};

// Properly bind the NextAuth handler for App Router
const handler = NextAuth(authOptions);

// Export handler functions for App Router
// These functions receive the req object and route params
export { handler as GET, handler as POST }; 