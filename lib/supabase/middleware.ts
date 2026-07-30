import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // ── Developer bypass mode ────────────────────────────────────────────────
  // When NEXT_PUBLIC_BYPASS_AUTH=true (set in .env.local for local dev),
  // skip all auth checks so the dashboard opens directly without login.
  // NEVER set this to true in production.
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.next({ request })
  }

  // ── Skip auth for Twilio/public API routes ───────────────────────────────
  // These routes use their own authentication (Twilio signatures / API keys)
  const publicPrefixes = ['/api/twilio', '/api/v1', '/api/health', '/auth']
  if (publicPrefixes.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next({ request })
  }

  // ── Session refresh ──────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Protect dashboard and protected routes
    const protectedPaths = ['/dashboard', '/protected']
    const isProtectedPath = protectedPaths.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    )

    if (isProtectedPath) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/auth/login'
        return NextResponse.redirect(loginUrl)
      }
    }
  } catch (error) {
    // If Supabase is misconfigured, fail open in dev, fail closed in production
    console.error('[middleware] Auth check failed:', error)
    if (process.env.NODE_ENV === 'production') {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}
