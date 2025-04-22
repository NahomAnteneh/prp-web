import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Create a middleware for handling CORS
function corsMiddleware(req: NextRequest) {
  // For preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Access-Control-Max-Age': '86400', // 24 hours
      }
    });
  }

  // For regular requests, add CORS headers to the response
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');

  return response;
}

// Export the middleware function
export default withAuth(
  function middleware(req) {
    // Apply CORS handling
    if (req.method === 'OPTIONS') {
      return corsMiddleware(req);
    }

    // Let NextAuth handle the auth checks
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
      error: '/error',
    },
  }
);

// Define which routes should be protected with authentication
export const config = {
  matcher: [
    '/api/auth/:path*',
    '/dashboard/:path*', 
    '/group/:path*', 
    '/tasks/:path*', 
    // '/:userId/:path*',
  ],
}; 