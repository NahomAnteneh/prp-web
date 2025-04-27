import NextAuth, { type AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Input validation
        if (!credentials?.identifier?.trim() || !credentials?.password?.trim()) {
          return null;
        }

        // Find user by username OR email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.identifier.trim() },
              { email: credentials.identifier.trim() },
            ],
          },
        });

        // User not found
        if (!user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('User not found for identifier:', credentials.identifier);
          }
          return null;
        }

        // Check password match
        const passwordMatch = await bcrypt.compare(
          credentials.password.trim(),
          user.passwordHash
        );

        if (!passwordMatch) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Password does not match for user:', user.username);
          }
          return null;
        }

        // Return user object with full name constructed from firstName and lastName
        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          username: user.username,
          role: user.role,
          email: user.email,
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
        token.role = user.role as Role;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.username = token.username as string;
        session.user.role = token.role as Role;
        session.user.email = token.email as string;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };