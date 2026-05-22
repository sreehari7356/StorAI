import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(req) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set({ name, value, ...options }))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set({ name, value, ...options }))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Guard rules: Block unauthenticated users from homepage
  if (!session && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/vault-login', req.url))
  }

  // Redirect logged-in users away from the login page back to home
  if (session && req.nextUrl.pathname === '/vault-login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/vault-login'],
}