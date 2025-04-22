import { NextResponse } from 'next/server';
import { authOptions } from '../[...nextauth]/route';
import { getServerSession } from 'next-auth/next';

// Add CORS headers to response
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return newResponse;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

// Get current session/user using getServerSession approach
export async function GET() {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);
    
    if (!session) {
      const response = NextResponse.json(null, { status: 200 });
      return addCorsHeaders(response);
    }
    
    // Return the session in NextAuth expected format
    const response = NextResponse.json(session, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Session fetch error:', error);
    const response = NextResponse.json(null, { status: 200 });
    return addCorsHeaders(response);
  }
}

export async function POST() {
  return GET();
} 