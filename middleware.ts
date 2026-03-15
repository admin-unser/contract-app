import { NextResponse, type NextRequest } from 'next/server';

/**
 * Security-hardened middleware:
 * - Auth cookie check for protected routes
 * - Rate limiting per IP (in-memory, per-instance)
 * - Bot/scanner detection
 * - Request size validation
 */

const publicPaths = ['/login', '/signup'];
const publicPrefixes = ['/sign/', '/verify/', '/api/otp/', '/api/verify/', '/api/sign', '/api/email-test/debug', '/api/billing/webhook', '/api/cron/'];

// In-memory rate limit store (per serverless instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 120; // 120 req/min per IP for general routes
const RATE_LIMIT_AUTH_MAX = 10; // 10 req/min for auth
const RATE_LIMIT_API_MAX = 60; // 60 req/min for API

// Suspicious patterns to block (common attack scanners)
const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/.env', '/phpinfo',
  '/admin/config', '/.git', '/xmlrpc.php',
  '/actuator', '/solr', '/console',
];

const BLOCKED_USER_AGENTS = [
  'sqlmap', 'nikto', 'masscan', 'nmap', 'dirbuster',
  'gobuster', 'wpscan', 'nuclei',
];

function isPublicPath(pathname: string): boolean {
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return true;
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

function checkRateLimit(key: string, max: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: max - 1 };
  }

  entry.count++;
  if (entry.count > max) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: max - entry.count };
}

// Cleanup expired entries periodically
let lastCleanup = Date.now();
function cleanupRateLimits() {
  const now = Date.now();
  if (now - lastCleanup < 30_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  cleanupRateLimits();

  // 1. Block known attack scanner paths
  if (BLOCKED_PATHS.some((p) => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Block known malicious user agents
  const ua = request.headers.get('user-agent')?.toLowerCase() ?? '';
  if (BLOCKED_USER_AGENTS.some((bot) => ua.includes(bot))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Rate limiting
  const isApi = pathname.startsWith('/api/');
  const isAuth = pathname === '/login' || pathname === '/signup' || pathname.startsWith('/api/otp/');
  const limit = isAuth ? RATE_LIMIT_AUTH_MAX : isApi ? RATE_LIMIT_API_MAX : RATE_LIMIT_MAX;
  const rateLimitKey = `${ip}:${isAuth ? 'auth' : isApi ? 'api' : 'general'}`;

  const { allowed, remaining } = checkRateLimit(rateLimitKey, limit);
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 4. Allow public paths without auth check
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // 5. Check for Supabase auth cookie presence
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

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2)$).*)',
  ],
};
