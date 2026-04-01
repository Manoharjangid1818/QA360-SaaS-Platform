// Middleware: protects dashboard routes and handles Supabase session refresh
// If Supabase is not configured, all routes are allowed (mock data mode)

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isConfigured = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;

export async function middleware(request: NextRequest) {
  // If Supabase is not set up, skip auth protection entirely (mock mode)
  if (!isConfigured) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (important to keep tokens fresh)
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users from protected routes to login
  const isProtected = path.startsWith('/dashboard') ||
    path.startsWith('/test-cases') ||
    path.startsWith('/bugs') ||
    path.startsWith('/ai-generator') ||
    path.startsWith('/playwright');

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  if ((path === '/login' || path === '/register') && user) {
    const dashUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
