import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const publicPaths = ['/login', '/signup'];
const publicPrefixes = ['/sign/', '/verify/', '/api/otp/', '/api/verify/', '/api/sign'];

function isPublicPath(pathname: string): boolean {
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return true;
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await updateSession(request);

  if (isPublicPath(pathname)) return response;

  const supabase = await import('@supabase/ssr').then((m) =>
    m.createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return Response.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
