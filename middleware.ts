import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login', 
  '/register',
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/api/trpc',
  '/_trpc',
  '/__nextjs_original-stack-frame',
  '/__nextjs_router-state',
  '/_vercel',
  '/vercel.svg',
  '/vercel.svg/'
];

// Protected paths that require authentication
const protectedPaths = [
  '/profile',
  '/dashboard',
  '/api/protected',
  '/api/trpc',
  '/_trpc'
];

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (isProtectedPath) {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      
      // If there's no token, redirect to login
      if (!token) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(url);
    }
  }
  
  // If user is logged in and tries to access login/register, redirect to dashboard
  if (pathname === '/login' || pathname === '/register') {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
    }
  }
  
  return NextResponse.next();
}