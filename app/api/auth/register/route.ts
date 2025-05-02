import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";
import { NextRequest, NextResponse } from 'next/server';

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

// Registration handler - For handling /api/auth/register requests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, id, email, password, department, batchYear } = body;

    // Basic validation
    if (!firstName || !lastName || !id || !email || !password || !department || !batchYear) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (existingUser) {
      const response = NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
      return addCorsHeaders(response);
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({
      where: {
        profileInfo: {
          path: ['email'],
          equals: email
        }
      }
    });

    if (existingEmail) {
      const response = NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
      return addCorsHeaders(response);
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        id,
        email,
        passwordHash,
        role: Role.STUDENT,
        profileInfo: {
          department,
          batchYear,
        },
      },
    });

    // Return success without password
    const response = NextResponse.json(
      { 
        message: 'User registered successfully', 
        user: {
          id: user.id,
          role: user.role,
        }
      },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Registration error:', error);
    const response = NextResponse.json(
      { error: 'Something went wrong during registration' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}