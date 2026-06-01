import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // 1. ALWAYS ALLOW STATIC ASSETS, COMPILER CHUNKS, & API PATHS
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. 🔐 ROBUST SUPABASE AUTH TOKEN CHECKER
  // Checks our custom cookie, native supabase chunks, or system session keys
  const allCookies = request.cookies.getAll();
  const hasActiveSession = allCookies.some(cookie => 
    cookie.name === 'sb-access-token' || 
    cookie.name.startsWith('sb-') || 
    cookie.name.includes('-auth-token')
  );

  // 3. HOME ROUTE LOCKDOWN
  if (pathname === '/') {
    if (!hasActiveSession) {
      // No token found? Safely divert them to the login screen
      return NextResponse.redirect(new URL('/vault-login', request.url));
    }
    // Token exists! Let them directly onto the dashboard
    return NextResponse.next();
  }

  // 4. LOGIN PORTAL SAFETY GATEWAY
  if (pathname === '/vault-login') {
    if (hasActiveSession) {
      // Already logged in? Take them straight home, do not let them log in again
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/vault-login'],
};