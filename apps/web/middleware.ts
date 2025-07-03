import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Minimal middleware for now - we'll enhance this later with proper admin access
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If user is not signed in and the current path is protected, redirect to /login
  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and tries to access auth pages, redirect to /protected
  if (user && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/protected', request.url))
  }

  return response
}

// Protected routes that require authentication
function isProtectedRoute(pathname: string) {
  return [
    '/protected',
    '/bookmarks',
    '/settings',
  ].includes(pathname)
}

// Auth routes that should not be accessible when signed in
function isAuthRoute(pathname: string) {
  return [
    '/login',
    '/signup',
  ].includes(pathname)
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    '/protected',
    '/bookmarks',
    '/settings',
    '/login',
    '/signup',
  ],
} 