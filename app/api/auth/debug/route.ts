import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verify, JwtPayload } from 'jsonwebtoken';

// Define our custom JWT payload interface
interface CustomJwtPayload extends JwtPayload {
  id?: string;
  username?: string;
  role?: string;
}

export async function GET(req: NextRequest) {
  try {
    // First try to get token from NextAuth
    const token = await getToken({ req });
    
    // If no NextAuth token, check for JWT in Authorization header
    let jwtPayload: CustomJwtPayload | null = null;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = authHeader.substring(7); // Remove 'Bearer ' prefix
        try {
          jwtPayload = verify(jwt, process.env.NEXTAUTH_SECRET || 'fallback-secret') as CustomJwtPayload;
        } catch (error) {
          console.error('JWT verification error:', error);
        }
      }
    }

    // Determine authentication status from either source
    const authenticated = !!token || !!jwtPayload;
    const userData = token ? {
      id: token.id,
      username: token.username,
      role: token.role,
    } : jwtPayload && jwtPayload.id ? {
      id: jwtPayload.id,
      username: jwtPayload.username,
      role: jwtPayload.role,
    } : null;

    // Return the token data (carefully excluding sensitive info)
    return NextResponse.json({
      status: 'success',
      authenticated,
      user: userData,
      jwt: {
        exp: token?.exp || (jwtPayload?.exp) || null,
        iat: token?.iat || (jwtPayload?.iat) || null,
      },
      source: token ? 'nextauth' : jwtPayload ? 'jwt' : 'none'
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }, 
      { status: 500 }
    );
  }
} 