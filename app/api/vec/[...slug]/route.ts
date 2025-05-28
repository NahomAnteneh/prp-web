// client/app/api/vec/[...slug]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXTERNAL_SERVER_URL = process.env.EXTERNAL_VEC_SERVER_URL;

async function handler(request: NextRequest, { params }: { params: { slug: string[] } }) {
  if (!EXTERNAL_SERVER_URL) {
    console.error("EXTERNAL_VEC_SERVER_URL is not defined");
    return NextResponse.json({ message: 'Internal Server Error: Vec server URL not configured' }, { status: 500 });
  }

  const { slug } = params;
  const path = slug.join('/');
  const searchParams = request.nextUrl.search; // Gets the full query string like "?service=git-upload-pack"

  const targetUrl = `${EXTERNAL_SERVER_URL}/${path}${searchParams}`;

  try {
    const headersToForward = new Headers();
    // Forward essential headers from the incoming request
    const incomingAuthorization = request.headers.get('Authorization');
    if (incomingAuthorization) {
      headersToForward.set('Authorization', incomingAuthorization);
    }
    const incomingContentType = request.headers.get('Content-Type');
    if (incomingContentType) {
      headersToForward.set('Content-Type', incomingContentType);
    }
    // Add any other headers your vec-server might expect, or that are good practice to forward
    headersToForward.set('Accept', request.headers.get('Accept') || '*/*');


    let body: BodyInit | null = null;
    // For methods that can have a body, stream it if possible
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = request.body; // request.body is a ReadableStream
    }

    const externalResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headersToForward,
      body: body,
      // For streaming request bodies in Node.js fetch, duplex might be needed
      // However, Next.js Edge Runtime (where API routes often run) handles this differently.
      // Test carefully. If using Node.js runtime explicitly, you might need:
      // ...(body && { duplex: 'half' } as any), // 'as any' to bypass type issues if 'duplex' isn't standard
    });

    // Create new Headers object for the response, copying from externalResponse
    const responseHeaders = new Headers();
    externalResponse.headers.forEach((value, key) => {
      // Avoid forwarding hop-by-hop headers or problematic ones like 'transfer-encoding'
      // Also handle 'vary' header properly if you have complex caching/CORS.
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
         responseHeaders.set(key, value);
      }
    });
    

    // Stream the response body from the external server
    return new NextResponse(externalResponse.body, {
      status: externalResponse.status,
      statusText: externalResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`Error proxying request to vec-server at ${targetUrl}:`, error);
    // More specific error logging could be useful here
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        return NextResponse.json({ message: 'Failed to connect to the vec server. Is it running?' }, { status: 502 }); // Bad Gateway
    }
    return NextResponse.json({ message: 'Internal Server Error while proxying to vec server' }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler; 
export const HEAD = handler;
export const OPTIONS = handler;
