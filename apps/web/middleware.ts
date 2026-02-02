import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'experimental-edge'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') || 
                          (request.nextUrl.pathname.startsWith('/portal') && request.nextUrl.pathname !== '/portal/inventory');

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute) {
        // If it's a protected route and config is missing, we must block it.
        // Returning a 500 or redirecting to an error page is safer than NextResponse.next()
        return new NextResponse('Internal Server Error: Missing Configuration', { status: 500 });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  const { data: { user } } = await supabase.auth.getUser()

  // Helper to get role from profile or metadata
  const getUserRole = async (userId: string, metadata: Record<string, unknown> | null) => {
    // 1. Try metadata first (fastest, reflects recent changes if metadata update was used)
    if (metadata?.role) return metadata.role;

    // 2. Fallback to profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    return profile?.role;
  }

  // 1. Protect Admin Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const role = await getUserRole(user.id, user.user_metadata);

    if (role !== 'admin') {
      // Redirect unauthorized users to portal or home
      return NextResponse.redirect(new URL('/portal/inventory', request.url))
    }
  }

  // 2. Protect Portal Routes (Except Inventory)
  if (request.nextUrl.pathname.startsWith('/portal')) {
    // Allow access to inventory without login
    if (request.nextUrl.pathname === '/portal/inventory') {
        return response
    }

    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 3. Prevent logged-in users from accessing login/signup
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
      if (user) {
           // Redirect to appropriate dashboard based on role
           const role = await getUserRole(user.id, user.user_metadata);

           if (role === 'admin') {
               return NextResponse.redirect(new URL('/admin/overview', request.url))
           } else {
               return NextResponse.redirect(new URL('/portal/inventory', request.url))
           }
      }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
    '/login',
    '/signup'
  ],
}