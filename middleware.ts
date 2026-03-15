import { NextResponse, type NextRequest } from 'next/server';

/**
 * Lightweight middleware that checks for Supabase auth cookies.
 * Does NOT import @supabase/ssr to avoid Edge Runtime compatibility issues.
 * Actual session validation happens in server components / API routes.
 */

const publicPaths = ['/login', '/signup'];
const publicPrefixes = ['/sign/', '/verify/', '/api/otp/', '/api/verify/', '/api/sign', '/api/email-test/debug', '/api/billing/webhook', '/api/cron/'];

function isPublicPath(pathname: string): boolean {
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return true;
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie presence (lightweight check)
  // Cookie names follow pattern: sb-<project-ref>-auth-token
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  );

  // Root path: always allow
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Protected paths: redirect to login if no auth cookie
  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
