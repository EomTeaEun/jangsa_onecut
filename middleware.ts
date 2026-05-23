import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // API 라우트는 미들웨어 인증 체크 제외
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Public routes that don't need auth
  const publicRoutes = ['/', '/login', '/signup']
  const authRoutes = ['/login', '/signup']
  const appRoutes = pathname.startsWith('/(app)') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/create') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/reviews') ||
    pathname.startsWith('/settings')

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)
  const isOnboardingRoute = pathname === '/onboarding'

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (user && isAuthRoute) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is not logged in and tries to access protected routes
  if (!user && !isPublicRoute && !isAuthRoute) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in, check if onboarded for app routes
  if (user && !isAuthRoute && !isPublicRoute && !isOnboardingRoute) {
    const { data: store } = await supabase
      .from('stores')
      .select('is_onboarded')
      .eq('user_id', user.id)
      .single()

    if (!store || !store.is_onboarded) {
      const redirectUrl = new URL('/onboarding', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If user is logged in and onboarded, don't let them go back to onboarding
  if (user && isOnboardingRoute) {
    const { data: store } = await supabase
      .from('stores')
      .select('is_onboarded')
      .eq('user_id', user.id)
      .single()

    if (store && store.is_onboarded) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
