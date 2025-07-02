import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware for now - we'll enhance this later with proper admin access
export async function middleware(request: NextRequest) {
  // For now, just allow all requests
  return NextResponse.next()
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 