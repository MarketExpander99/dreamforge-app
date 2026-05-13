import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Redirect www.skill-gain.com to skill-gain.com
  if (url.hostname === 'www.skill-gain.com') {
    url.hostname = 'skill-gain.com'
    return NextResponse.redirect(url, 301)
  }

  // Skip middleware if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'your_supabase_project_url' ||
      supabaseAnonKey === 'your_supabase_anon_key') {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check user role from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role
    const userEmail = user.email

    // Allow access if:
    // 1. User has 'content-creator' role, OR
    // 2. User has 'teacher' role, OR
    // 3. User's email is the special test email (for development)
    const hasAccess = userRole === 'content-creator' || userRole === 'teacher' || userEmail === 'eben.combrinck@proton.me'

    if (!hasAccess) {
      // Redirect to home page if not authorized
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect teacher routes
  if (request.nextUrl.pathname.startsWith('/teacher')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role
    const userEmail = user.email

    const hasTeacherAccess = userRole === 'teacher' || userRole === 'content-creator' || userEmail === 'eben.combrinck@proton.me'

    if (!hasTeacherAccess) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check onboarding for teachers
    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('teacher_onboarding_completed')
      .eq('id', user.id)
      .single()

    if (userRole === 'teacher' && !teacherProfile?.teacher_onboarding_completed) {
      return NextResponse.redirect(new URL('/teacher/onboarding', request.url))
    }
  }

  // Protect student routes
  if (request.nextUrl.pathname.startsWith('/student')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'student') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect family routes
  if (request.nextUrl.pathname.startsWith('/family')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'parent') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect learning routes (requires authentication)
  if (request.nextUrl.pathname.startsWith('/learning')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object
  //    before returning it.

  return supabaseResponse
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
