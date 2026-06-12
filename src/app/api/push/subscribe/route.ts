import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'
import type { NextRequest } from 'next/server'

// VAPID 설정
webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST /api/push/subscribe — 구독 정보를 Supabase DB에 UPSERT
export async function POST(request: NextRequest) {
  try {
    const sub: webpush.PushSubscription = await request.json()

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return Response.json({ error: '유효하지 않은 구독 정보' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // UPSERT: 같은 endpoint가 있으면 업데이트, 없으면 삽입
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          keys_p256dh: sub.keys.p256dh,
          keys_auth: sub.keys.auth,
        },
        { onConflict: 'user_id, endpoint' }
      )

    if (upsertError) {
      console.error('[Push] 구독 저장 실패:', upsertError)
      return Response.json({ error: '구독 저장 실패' }, { status: 500 })
    }

    console.log('[Push] 구독 저장됨:', sub.endpoint.slice(-20))
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: '구독 저장 실패' }, { status: 500 })
  }
}

// GET /api/push/subscribe — 현재 유저의 구독 여부 확인
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ subscribed: false })
    }

    const { data } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    return Response.json({ subscribed: !!data })
  } catch {
    return Response.json({ subscribed: false })
  }
}

// DELETE /api/push/subscribe — 구독 취소 (DB에서 삭제)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 요청 body에 endpoint가 있으면 특정 구독만 삭제, 없으면 전체 삭제
    let endpoint: string | null = null
    try {
      const body = await request.json()
      endpoint = body?.endpoint ?? null
    } catch {
      // body 없음 → 전체 삭제
    }

    const query = supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (endpoint) {
      query.eq('endpoint', endpoint)
    }

    const { error: deleteError } = await query
    if (deleteError) {
      return Response.json({ error: '구독 취소 실패' }, { status: 500 })
    }

    console.log('[Push] 구독 취소됨:', user.id)
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: '구독 취소 실패' }, { status: 500 })
  }
}
