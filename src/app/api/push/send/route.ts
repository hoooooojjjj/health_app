import webpush from 'web-push'
import type { NextRequest } from 'next/server'

// VAPID 설정
webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST /api/push/send — 지연 후 푸시 알림 전송
// body: { subscription, delaySeconds, title, body }
export async function POST(request: NextRequest) {
  try {
    const {
      subscription,
      delaySeconds = 0,
      title = 'Health App',
      body = '알림이 도착했습니다!',
      url = '/',
    }: {
      subscription: webpush.PushSubscription
      delaySeconds?: number
      title?: string
      body?: string
      url?: string
    } = await request.json()

    if (!subscription) {
      return Response.json({ error: '구독 정보가 없습니다' }, { status: 400 })
    }

    // ⏱️ 서버에서 지연 (Vercel 함수가 살아있는 동안 대기)
    if (delaySeconds > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, delaySeconds * 1000)
      )
    }

    // 📨 푸시 발송
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url })
    )

    return Response.json({ success: true, sentAt: new Date().toISOString() })
  } catch (error) {
    console.error('[Push] 발송 실패:', error)
    return Response.json({ error: '알림 발송 실패' }, { status: 500 })
  }
}

// Vercel 함수 실행 최대 시간 설정 (초) — Hobby: 최대 60초
export const maxDuration = 60
