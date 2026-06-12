import { createClient } from '@/utils/supabase/server'
import { Receiver } from '@upstash/qstash'
import webpush from 'web-push'
import type { NextRequest } from 'next/server'

// VAPID 설정
webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST /api/push/fire — QStash 콜백: 실제 푸시 알림 발송
// QStash가 지정된 시간 이후 이 엔드포인트를 호출
export async function POST(request: NextRequest) {
  // ① QStash 서명 검증 (외부 악의적 호출 차단)
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const rawBody = await request.text()
  const signature = request.headers.get('Upstash-Signature') ?? ''

  // 로컬 개발 환경에서는 서명 검증 스킵 (VERCEL_URL이 없으면 로컬)
  const isLocal = !process.env.VERCEL_URL
  if (!isLocal) {
    try {
      const isValid = await receiver.verify({
        signature,
        body: rawBody,
        clockTolerance: 10,
      })
      if (!isValid) {
        console.warn('[Push Fire] 유효하지 않은 QStash 서명')
        return Response.json({ error: '유효하지 않은 요청' }, { status: 401 })
      }
    } catch (err) {
      console.warn('[Push Fire] 서명 검증 실패:', err)
      return Response.json({ error: '서명 검증 실패' }, { status: 401 })
    }
  }

  try {
    const {
      timerId,
      subscription,
    }: {
      timerId: string
      subscription: webpush.PushSubscription
    } = JSON.parse(rawBody)

    if (!timerId || !subscription) {
      return Response.json(
        { error: 'timerId와 subscription이 필요합니다' },
        { status: 400 }
      )
    }

    // service role key가 없으면 anon key로 폴백 (RLS 없이 조회 필요)
    // fire 엔드포인트는 인증 없이 QStash가 직접 호출하므로 서비스 클라이언트 사용
    const supabase = await createClient()

    // ② DB에서 타이머 상태 확인
    const { data: timer, error: fetchError } = await supabase
      .from('rest_timers')
      .select('id, status, user_id')
      .eq('id', timerId)
      .maybeSingle()

    if (fetchError || !timer) {
      console.warn(`[Push Fire] 타이머를 찾을 수 없음: ${timerId}`)
      return Response.json({ sent: false, reason: '타이머 없음' })
    }

    // ③ 멱등성 보장: status가 'active'인 경우에만 발송
    if (timer.status !== 'active') {
      console.log(
        `[Push Fire] 스킵 — id: ${timerId}, status: ${timer.status}`
      )
      return Response.json({ sent: false, reason: `status: ${timer.status}` })
    }

    // ④ 푸시 알림 발송
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: '🏋️ 휴식 완료!',
        body: '다음 세트를 시작할 시간입니다.',
        url: '/',
        tag: 'rest-timer',
      })
    )

    // ⑤ DB 상태 업데이트
    await supabase
      .from('rest_timers')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', timerId)

    console.log(`[Push Fire] 알림 발송 완료 — id: ${timerId}`)
    return Response.json({ sent: true })
  } catch (error) {
    console.error('[Push Fire] 발송 실패:', error)
    return Response.json({ error: '알림 발송 실패' }, { status: 500 })
  }
}
