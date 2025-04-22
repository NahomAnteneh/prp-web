import { PrismaClient } from "@prisma/client";
import { compare } from "bcrypt";
import { NextRequest, NextResponse } from 'next/server';
import { sign } from "jsonwebtoken";

const prisma = new PrismaClient();

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

// Login handler - For handling direct login requests
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Get username from either username or identifier field (for compatibility)
    const username = body.username || body.identifier;
    const password = body.password;

    // Basic validation
    if (!username || !password) {
      const response = NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    // Check if user exists
    if (!user) {
      const response = NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }

    // Check password
    const passwordValid = await compare(password, user.passwordHash);
    if (!passwordValid) {
      const response = NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }

    // Generate JWT token
    const token = sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Create successful response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400` // 24 hours
        }  
      }
    );
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Login error:', error);
    const response = NextResponse.json(
      { error: 'Something went wrong during login' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
} 