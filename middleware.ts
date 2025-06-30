import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/admin-access'

// Cache admin route patterns for performance
const ADMIN_ROUTE_CACHE = new Set([
  '/admin',
  '/admin/question-topics',
  '/admin/glossary',
  '/admin/ai-content',
  '/admin/events',
  '/admin/surveys',
  '/admin/analytics',
  '/admin/users',
  '/admin/feedback',
  '/admin/accessibility',
  '/admin/media',
  '/admin/ai-tools',
  '/admin/content-relationships',
  '/admin/news-agent',
  '/admin/translations',
  '/admin/collections',
  '/admin/scheduled-content',
  '/admin/weekly-recap',
  '/admin/debug-data'
])

const SUPER_ADMIN_ROUTE_CACHE = new Set([
  '/admin/settings',
  '/admin/users/roles',
  '/admin/system',
  '/admin/test'
])

// Fast route checking using cached Sets for better performance

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and non-admin routes (Performance optimization)
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    // Add performance headers for static assets
    const response = NextResponse.next()
    if (pathname.startsWith('/_next/') || pathname.startsWith('/icons/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    }
    return response
  }

  // Fast admin route checking using cached Sets for better performance
  const isAdminRoute = ADMIN_ROUTE_CACHE.has(pathname) || 
    Array.from(ADMIN_ROUTE_CACHE).some(route => pathname.startsWith(route + '/'))
  
  const isSuperAdminRoute = SUPER_ADMIN_ROUTE_CACHE.has(pathname) || 
    Array.from(SUPER_ADMIN_ROUTE_CACHE).some(route => pathname.startsWith(route + '/'))

  if (isAdminRoute || isSuperAdminRoute) {
    try {
      // For super admin routes, require super admin access
      if (isSuperAdminRoute) {
        const result = await requireSuperAdmin(request)
        if (!result.success) {
          console.log(`❌ Super admin access denied for ${pathname}`)
          
          // If it's an API route, return JSON error
          if (pathname.startsWith('/api/')) {
            return result.response!
          }
          
          // For page routes, redirect to signin
          const signInUrl = new URL('/auth/signin', request.url)
          signInUrl.searchParams.set('redirectTo', pathname)
          return NextResponse.redirect(signInUrl)
        }
        
        console.log(`✅ Super admin user ${result.user?.email} accessing ${pathname}`)
      } else {
        // For regular admin routes, require admin access
        const result = await requireAdmin(request)
        if (!result.success) {
          console.log(`❌ Admin access denied for ${pathname}`)
          
          // If it's an API route, return JSON error
          if (pathname.startsWith('/api/')) {
            return result.response!
          }
          
          // For page routes, redirect to signin
          const signInUrl = new URL('/auth/signin', request.url)
          signInUrl.searchParams.set('redirectTo', pathname)
          return NextResponse.redirect(signInUrl)
        }
        
        console.log(`✅ Admin user ${result.user?.email} accessing ${pathname}`)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      
      // On error, redirect to signin for safety
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 