import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/services',
  '/dashboard/workers',
  '/dashboard/clients',
  '/dashboard/finance',
  '/dashboard/payroll',
  '/dashboard/purchasing',
  '/dashboard/attendance',
  '/dashboard/reports',
  '/dashboard/settings',
  '/dashboard/approvals',
  '/dashboard/accounting',
  '/dashboard/cash-flow',
  '/dashboard/financial-statements',
  '/dashboard/kpi-analysis',
  '/dashboard/accidents',
  '/dashboard/supervision',
  '/dashboard/epi'
];

// Define public routes that should not be protected
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  );
  
  // Get the authentication token and issued-at from cookies (Supabase-based session)
  const authToken = request.cookies.get('sb-auth-token')?.value;
  const authIatStr = request.cookies.get('sb-auth-iat')?.value;
  const authIat = authIatStr ? Number(authIatStr) : 0;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = !authIat || (now - authIat > 3600);
  
  // If trying to access a protected route without authentication
  if (isProtectedRoute && (!authToken || isExpired)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    const res = NextResponse.redirect(loginUrl);
    // Clear expired cookies
    res.cookies.set('sb-auth-token', '', { path: '/', maxAge: 0 });
    res.cookies.set('sb-auth-iat', '', { path: '/', maxAge: 0 });
    return res;
  }
  
  // If trying to access login page while already authenticated
  if (isPublicRoute && authToken && !isExpired && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
