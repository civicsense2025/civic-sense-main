import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // If no user or auth error, redirect to sign in
    if (authError || !user) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has admin privileges
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error checking admin status in middleware:', error)
        // On error, redirect to dashboard with error message
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('error', 'admin_check_failed')
        return NextResponse.redirect(redirectUrl)
      }

      // If user is not admin, redirect to dashboard
      if (!profile?.is_admin) {
        console.log(`🚫 Non-admin user ${user.email} attempted to access ${request.nextUrl.pathname}`)
        const redirectUrl = new URL('/dashboard', request.url)
        redirectUrl.searchParams.set('error', 'admin_access_denied')
        return NextResponse.redirect(redirectUrl)
      }

      // User is admin, allow access
      console.log(`✅ Admin user ${user.email} accessing ${request.nextUrl.pathname}`)
    } catch (err) {
      console.error('Error in admin middleware check:', err)
      const redirectUrl = new URL('/dashboard', request.url)
      redirectUrl.searchParams.set('error', 'admin_check_error')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 