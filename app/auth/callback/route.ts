import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') ?? '/'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/auth-error?message=${encodeURIComponent(errorDescription || error)}`
    )
  }

  // If we have a code, redirect to home and let the client-side handle the session
  if (code) {
    // Redirect to home with the code in the URL so the client-side Supabase can handle it
    const redirectUrl = new URL(requestUrl.origin + next)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl.toString())
  }

  // No code or error, just redirect to home
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
} 