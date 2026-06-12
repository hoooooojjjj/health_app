'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ---- 타입 ----
export type TimerStatus = 'idle' | 'running' | 'done'

export interface UseRestTimerReturn {
  // 상태
  status: TimerStatus
  remainingSeconds: number  // 화면 표시용 카운트다운
  durationSec: number       // 설정된 총 휴식 시간

  // 액션
  start: (durationSec: number) => Promise<{ error?: string }>
  cancel: () => Promise<void>
  reset: () => void
}

// ---- 훅 ----
export function useRestTimer(): UseRestTimerReturn {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [durationSec, setDurationSec] = useState(0)

  // 내부 참조 (리렌더 없이 접근)
  const timerIdRef = useRef<string | null>(null)      // Supabase rest_timers.id
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 카운트다운 인터벌 정리 유틸
  const clearCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // ── 타이머 시작 ──────────────────────────────────────────────
  const start = useCallback(
    async (seconds: number): Promise<{ error?: string }> => {
      if (status === 'running') {
        // 이미 실행 중이면 기존 취소 후 재시작
        clearCountdown()
      }

      try {
        const res = await fetch('/api/timer/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSec: seconds }),
        })

        const json = await res.json()

        if (!res.ok) {
          return { error: json.error ?? '타이머 시작 실패' }
        }

        timerIdRef.current = json.timerId

        // 클라이언트 카운트다운 시작 (화면 표시 전용)
        setDurationSec(seconds)
        setRemainingSeconds(seconds)
        setStatus('running')

        const endTime = Date.now() + seconds * 1000

        intervalRef.current = setInterval(() => {
          const remain = Math.ceil((endTime - Date.now()) / 1000)
          
          if (remain <= 0) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setStatus('done')
            setRemainingSeconds(0)
          } else {
            setRemainingSeconds(remain)
          }
        }, 500)

        return {}
      } catch (err) {
        console.error('[useRestTimer] start 오류:', err)
        return { error: '타이머 시작 중 오류 발생' }
      }
    },
    [status, clearCountdown]
  )

  // ── 타이머 취소 ──────────────────────────────────────────────
  const cancel = useCallback(async () => {
    clearCountdown()

    if (timerIdRef.current) {
      try {
        await fetch('/api/timer/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timerId: timerIdRef.current }),
        })
      } catch (err) {
        console.error('[useRestTimer] cancel 오류:', err)
      }
      timerIdRef.current = null
    }

    setStatus('idle')
    setRemainingSeconds(0)
  }, [clearCountdown])

  // ── 상태 초기화 (UI 리셋) ────────────────────────────────────
  const reset = useCallback(() => {
    clearCountdown()
    timerIdRef.current = null
    setStatus('idle')
    setRemainingSeconds(0)
    setDurationSec(0)
  }, [clearCountdown])

  // 언마운트 시 정리
  useEffect(() => {
    return () => clearCountdown()
  }, [clearCountdown])

  return {
    status,
    remainingSeconds,
    durationSec,
    start,
    cancel,
    reset,
  }
}
