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
  adjustTime: (seconds: number) => void
  skip: () => void
}

// ---- 훅 ----
export function useRestTimer(): UseRestTimerReturn {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [durationSec, setDurationSec] = useState(0)

  // 내부 참조 (리렌더 없이 접근)
  const timerIdRef = useRef<string | null>(null)      // Supabase rest_timers.id
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number | null>(null)      // 타이머 종료 예정 시간 (절대 시간)

  // 카운트다운 인터벌 정리 유틸
  const clearCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    endTimeRef.current = null
  }, [])

  // 앱이 백그라운드에서 포그라운드로 복귀할 때 즉시 시간 동기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && intervalRef.current && endTimeRef.current) {
        const remain = Math.ceil((endTimeRef.current - Date.now()) / 1000)
        if (remain <= 0) {
          clearCountdown()
          setStatus('done')
          setRemainingSeconds(0)
        } else {
          setRemainingSeconds(remain)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [clearCountdown])

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

        endTimeRef.current = Date.now() + seconds * 1000

        // 매우 촘촘한 100ms 주기로 타이머의 정밀도를 극대화
        intervalRef.current = setInterval(() => {
          if (!endTimeRef.current) return
          const remain = Math.ceil((endTimeRef.current - Date.now()) / 1000)
          
          if (remain <= 0) {
            clearCountdown()
            setStatus('done')
            setRemainingSeconds(0)
          } else {
            setRemainingSeconds(remain)
          }
        }, 100)

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

  // ── 시간 조절 (+30초, -10초) ─────────────────────────────────
  const adjustTime = useCallback((seconds: number) => {
    if (status !== 'running' || !endTimeRef.current) return
    
    endTimeRef.current += seconds * 1000
    
    const remain = Math.ceil((endTimeRef.current - Date.now()) / 1000)
    if (remain <= 0) {
      clearCountdown()
      setStatus('done')
      setRemainingSeconds(0)
    } else {
      setRemainingSeconds(remain)
    }
  }, [status, clearCountdown])

  // ── 즉시 스킵 ────────────────────────────────────────────────
  const skip = useCallback(() => {
    if (status !== 'running') return
    clearCountdown()
    setStatus('done')
    setRemainingSeconds(0)
  }, [status, clearCountdown])

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
    adjustTime,
    skip
  }
}
