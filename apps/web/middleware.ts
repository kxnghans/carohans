import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'experimental-edge'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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

  // 1. Protect Admin Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      // Redirect unauthorized users to portal or home
      return NextResponse.redirect(new URL('/portal/orders', request.url)) 
    }
  }

  // 2. Protect Portal Routes (Except Inventory)
  if (request.nextUrl.pathname.startsWith('/portal')) {
    // Allow access to inventory without login
    if (request.nextUrl.pathname === '/portal/inventory') {
        return response
    }

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 3. Prevent logged-in users from accessing login/signup
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
      if (user) {
           // Redirect to appropriate dashboard based on role
           const { data: profile } = await supabase
             .from('profiles')
             .select('role')
             .eq('id', user.id)
             .single()
             
           if (profile?.role === 'admin') {
               return NextResponse.redirect(new URL('/admin/overview', request.url))
           } else {
               return NextResponse.redirect(new URL('/portal/orders', request.url))
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
