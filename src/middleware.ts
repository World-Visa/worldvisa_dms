import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ZOHO_BASE_URL = process.env.NEXT_PUBLIC_ZOHO_BASE_URL || 'https://backend.worldvisa-api.cloud/api/zoho_dms';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  const publicRoutes = ['/portal', '/admin-login', '/client-login', '/api/auth', '/_next', '/favicon.ico'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = request.cookies.get('worldvisa_session');

  if (!sessionCookie) {
    // No session cookie - redirect to login
    const loginPath = pathname.startsWith('/admin') ? '/admin-login' : '/client-login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // Validate session with backend
  try {
    const validateResponse = await fetch(
      `${ZOHO_BASE_URL}/users/validate-session`,
      {
        headers: {
          Cookie: `worldvisa_session=${sessionCookie.value}`
        },
        cache: 'no-store',  // Don't cache session validation
      }
    );

    if (!validateResponse.ok) {
      // Session invalid or expired - redirect to login
      const loginPath = pathname.startsWith('/admin') ? '/admin-login' : '/client-login';
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    const { user } = await validateResponse.json();

    // Role-based access control
    const adminRoles = ['admin', 'master_admin', 'team_leader', 'supervisor'];

    if (pathname.startsWith('/admin') && !adminRoles.includes(user.role)) {
      // User is not an admin but trying to access admin routes
      return NextResponse.redirect(new URL('/client/applications', request.url));
    }

    if (pathname.startsWith('/client') && user.role !== 'client') {
      // User is admin but trying to access client routes
      return NextResponse.redirect(new URL('/admin/applications', request.url));
    }

    // Session valid and role matches - allow access
    return NextResponse.next();

  } catch (error) {
    // Error validating session - redirect to login
    console.error('Session validation error:', error);
    const loginPath = pathname.startsWith('/admin') ? '/admin-login' : '/client-login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
  ],
};
