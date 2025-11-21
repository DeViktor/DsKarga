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
  
  // Get the authentication token from cookies
  const authToken = request.cookies.get('firebase-auth-token')?.value;
  
  // If trying to access a protected route without authentication
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If trying to access login page while already authenticated
  if (isPublicRoute && authToken && pathname === '/login') {
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