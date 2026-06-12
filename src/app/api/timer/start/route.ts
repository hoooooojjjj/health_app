import { createClient } from '@/utils/supabase/server'
import { Client } from '@upstash/qstash'
import webpush from 'web-push'
import type { NextRequest } from 'next/server'

// VAPID 설정
webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST /api/timer/start — 휴식 타이머 시작 및 QStash 예약
export async function POST(request: NextRequest) {
  try {
    const { durationSec }: { durationSec: number } = await request.json()

    // 유효성 검사 (1초 ~ 300초)
    if (!durationSec || durationSec < 1 || durationSec > 300) {
      return Response.json(
        { error: 'durationSec은 1~300 사이 정수여야 합니다' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 인증 유저 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // push_subscriptions 에서 구독 정보 조회
    const { data: subRow, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys_p256dh, keys_auth')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError || !subRow) {
      return Response.json(
        { error: '푸시 구독 정보가 없습니다. 먼저 알림을 구독해주세요.' },
        { status: 400 }
      )
    }

    const subscription: webpush.PushSubscription = {
      endpoint: subRow.endpoint,
      keys: {
        p256dh: subRow.keys_p256dh,
        auth: subRow.keys_auth,
      },
    }

    // 기존 active 타이머 취소 (중복 방지)
    await supabase
      .from('rest_timers')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active')

    // rest_timers 테이블에 새 레코드 생성
    const fireAt = new Date(Date.now() + durationSec * 1000).toISOString()
    const { data: timer, error: insertError } = await supabase
      .from('rest_timers')
      .insert({
        user_id: user.id,
        duration_sec: durationSec,
        status: 'active',
        fire_at: fireAt,
      })
      .select('id')
      .single()

    if (insertError || !timer) {
      console.error('[Timer] DB insert 실패:', insertError)
      return Response.json({ error: '타이머 생성 실패' }, { status: 500 })
    }

    // 배포 URL 결정 (Vercel 환경 또는 로컬)
    const appUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // QStash에 지연 메시지 예약
    const qstash = new Client({ token: process.env.QSTASH_TOKEN! })
    const qstashRes = await qstash.publishJSON({
      url: `${appUrl}/api/push/fire`,
      delay: durationSec,
      body: {
        timerId: timer.id,
        subscription,
      },
    })

    // QStash 메시지 ID를 DB에 저장 (디버깅용)
    await supabase
      .from('rest_timers')
      .update({ qstash_msg_id: qstashRes.messageId })
      .eq('id', timer.id)

    console.log(
      `[Timer] 시작됨 — id: ${timer.id}, duration: ${durationSec}초, msgId: ${qstashRes.messageId}`
    )

    return Response.json({
      timerId: timer.id,
      fireAt,
      durationSec,
    })
  } catch (error) {
    console.error('[Timer] 시작 실패:', error)
    return Response.json({ error: '타이머 시작 실패' }, { status: 500 })
  }
}
