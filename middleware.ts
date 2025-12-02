import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login', 
  '/register',
  '/auth',
  '/api/auth',
  '/courses',
  '/api/courses',
  '/jobs',
  '/api/jobs'
];

// Protected paths that require authentication
const protectedPaths = [
  '/profile',
  '/dashboard'
];

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'edge',
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths, API routes, and static files
  if (
    publicPaths.some(path => path === pathname || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) ||
    pathname.startsWith('/jobs')
  ) {
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (isProtectedPath) {
    try {
      // Get the session token from cookies
      const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                         request.cookies.get('__Secure-authjs.session-token')?.value;
      
      // If no session token, redirect to login
      if (!sessionToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Verify session by making a request to your auth API
      const response = await fetch(new URL('/api/auth/session', request.url).toString(), {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
      
      const session = await response.json();
      
      // If no valid session, redirect to login
      if (!session?.user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // If session is valid, continue to the requested page
      return NextResponse.next();
    } catch (error) {
      console.error('Error in middleware:', error);
      // In case of error, redirect to login to be safe
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'SessionError');
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
};