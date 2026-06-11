import webpush from 'web-push'
import type { NextRequest } from 'next/server'

// VAPID 설정
webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// 서버 메모리에 구독 저장 (1인용 앱이므로 단순화)
// 실제 운영 시에는 Supabase DB로 교체 가능
let savedSubscription: webpush.PushSubscription | null = null

// POST /api/push/subscribe — 구독 정보 저장
export async function POST(request: NextRequest) {
  try {
    const subscription: webpush.PushSubscription = await request.json()
    savedSubscription = subscription
    console.log('[Push] 구독 저장됨:', subscription.endpoint.slice(-20))
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: '구독 저장 실패' }, { status: 500 })
  }
}

// GET /api/push/subscribe — 현재 구독 상태 확인
export async function GET() {
  return Response.json({ subscribed: savedSubscription !== null })
}

// DELETE /api/push/subscribe — 구독 취소
export async function DELETE() {
  savedSubscription = null
  return Response.json({ success: true })
}

// 외부에서 savedSubscription과 webpush 인스턴스를 공유하기 위해 export
export { savedSubscription, webpush }
