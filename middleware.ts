import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory cache for auth checks (resets on server restart)
const authCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip auth check for static assets and API routes
  if (request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.includes('.')) {
    return response
  }

  // Handle OAuth callback code on homepage - redirect to auth/callback
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/') {
    const redirectUrl = new URL('/auth/callback', request.url)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Check cache first
  const sessionToken = request.cookies.get('sb-access-token')?.value
  let user = null
  
  if (sessionToken) {
    const cached = authCache.get(sessionToken)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      user = cached.user
    } else {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 2000)
        )
        const authPromise = supabase.auth.getUser()
        
        const { data } = await Promise.race([authPromise, timeoutPromise]) as any
        user = data?.user || null
        
        // Cache the result
        if (sessionToken) {
          authCache.set(sessionToken, { user, timestamp: Date.now() })
        }
      } catch (error) {
        console.log('Auth check failed or timed out, allowing request')
        user = null
      }
    }
  }

  const pathname = request.nextUrl.pathname

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/students',
    '/applications', 
    '/documents',
    '/earnings',
    '/profile',
    '/notifications',
    '/support'
  ]
  
  // Admin-only routes
  const adminRoutes = [
    '/admin'
  ]
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Protect dashboard routes - but don't block if auth fails (graceful degradation)
  if (isProtectedRoute && !user) {
    // For API routes, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect admin routes - check role from user metadata or make a lightweight check
  if (isAdminRoute && user) {
    // Check if user has admin role in metadata (set during auth)
    const userRole = user.user_metadata?.role || user.app_metadata?.role
    
    if (userRole !== 'admin') {
      // Redirect non-admin users to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect logged in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect logged in users from Landing Page to Dashboard
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
