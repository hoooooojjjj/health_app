import { createClient } from '@/utils/supabase/server'
import type { NextRequest } from 'next/server'

// POST /api/timer/cancel — 휴식 타이머 취소 (건너뛰기)
// DB 상태를 'cancelled'로만 변경 → QStash 콜백 시 자동 스킵
export async function POST(request: NextRequest) {
  try {
    const { timerId }: { timerId: string } = await request.json()

    if (!timerId) {
      return Response.json({ error: 'timerId가 필요합니다' }, { status: 400 })
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

    // status → 'cancelled', completed_at 기록
    const { error: updateError } = await supabase
      .from('rest_timers')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', timerId)
      .eq('user_id', user.id) // RLS 보조 검증

    if (updateError) {
      console.error('[Timer] 취소 실패:', updateError)
      return Response.json({ error: '타이머 취소 실패' }, { status: 500 })
    }

    console.log(`[Timer] 취소됨 — id: ${timerId}`)
    return Response.json({ success: true })
  } catch (error) {
    console.error('[Timer] 취소 오류:', error)
    return Response.json({ error: '타이머 취소 실패' }, { status: 500 })
  }
}
