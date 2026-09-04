import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Proxy에서 Supabase 인증 세션을 갱신하고 접근을 제어합니다.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const url = request.nextUrl.clone()
  const isLoginPage = url.pathname === '/login'
  const isApiPushFire = url.pathname === '/api/push/fire'
  const isStaticAsset = 
    url.pathname.startsWith('/_next') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/sw.js' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)

  // 1. 정적 파일 및 에셋은 리다이렉트 제외
  if (isStaticAsset) {
    return supabaseResponse
  }

  // 2. QStash 푸시 발송 API(서명 검증으로 자체 보안 처리됨)는 제외
  if (isApiPushFire) {
    return supabaseResponse
  }

  // 클라이언트 생성과 getUser 호출 사이에는 다른 로직을 실행하지 않습니다.
  // getUser는 Supabase에 요청하여 세션 토큰을 검증하고 갱신합니다.
  const { data: { user } } = await supabase.auth.getUser()

  // 3. API 경로 보호 (/api/push/subscribe, /api/timer/start 등)
  if (url.pathname.startsWith('/api/')) {
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return supabaseResponse
  }

  // 4. 일반 페이지 경로 보호
  if (!user && !isLoginPage) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    // 로그인된 경우 홈(/)으로 리다이렉트
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
