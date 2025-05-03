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
        identifier: { label: 'ID or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // Find user by id
        const user = await prisma.user.findUnique({
          where: { userId: credentials.identifier }
        });

        if (!user) {
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
          userId: user.userId,
          name: `${user.firstName} ${user.lastName}`,
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
        token.userId = user.userId;
        token.name = user.name;
        token.role = user.role as Role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.userId = token.userId as string;
        session.user.name = token.name as string;
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