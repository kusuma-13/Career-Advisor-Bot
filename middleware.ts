import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from "@/lib/auth";

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login', 
  '/register', 
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths, API routes, and static files
  if (
    publicPaths.some(path => path === pathname || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') ||
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
      // Get the session
      const session = await auth.api.getSession({ 
        headers: Object.fromEntries(request.headers.entries()) 
      });
      
      // If no session, redirect to login with the current path as callback
      if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // If session exists, continue to the requested page
      return NextResponse.next();
    } catch (error) {
      console.error('Error in middleware:', error);
      // In case of error, allow access but log the error
      return NextResponse.next();
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};