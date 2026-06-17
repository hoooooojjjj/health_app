'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { usePush } from '@/providers/PushProvider'
import { useRestTimer } from '@/hooks/useRestTimer'
import styles from './page.module.css'

// 휴식 시간 프리셋 (초)
const PRESETS = [
  { label: '30초', value: 30 },
  { label: '1분', value: 60 },
  { label: '2분', value: 120 },
  { label: '3분', value: 180 },
  { label: '5분', value: 300 },
]

// MM:SS 포맷
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  const { pushStatus, subscribe, unsubscribe } = usePush()
  const { status: timerStatus, remainingSeconds, durationSec, start, cancel, reset } = useRestTimer()

  const [log, setLog] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<number>(60)

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`, ...prev.slice(0, 9)])
  }, [])

  // ── 로그아웃 ──
  const handleLogout = useCallback(async () => {
    addLog('🚪 로그아웃 중...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      addLog(`❌ 로그아웃 실패: ${error.message}`)
    } else {
      router.push('/login')
      router.refresh()
    }
  }, [supabase, router, addLog])

  // ── 구독 ──
  const handleSubscribe = useCallback(async () => {
    addLog('🔔 알림 권한 요청 중...')
    await subscribe()
    addLog(
      pushStatus === 'denied'
        ? '❌ 알림 권한이 거부되었습니다'
        : '✅ 알림 구독 완료!'
    )
  }, [subscribe, pushStatus, addLog])

  const handleUnsubscribe = useCallback(async () => {
    await unsubscribe()
    addLog('🔕 알림 구독 취소됨')
  }, [unsubscribe, addLog])

  // ── 타이머 시작 ──
  const handleStart = useCallback(async () => {
    if (pushStatus !== 'subscribed') {
      addLog('⚠️ 먼저 알림을 구독해주세요')
      return
    }
    addLog(`⏱️ ${selectedPreset}초 타이머 시작! (앱 닫아도 됩니다)`)
    const { error } = await start(selectedPreset)
    if (error) {
      addLog(`❌ ${error}`)
    } else {
      addLog('✅ 서버에 타이머 예약 완료 (QStash)')
    }
  }, [pushStatus, selectedPreset, start, addLog])

  // ── 타이머 취소 ──
  const handleCancel = useCallback(async () => {
    await cancel()
    addLog('↩️ 타이머 취소됨')
  }, [cancel, addLog])

  // ── 타이머 리셋 ──
  const handleReset = useCallback(() => {
    reset()
    addLog('↩️ 타이머 리셋')
  }, [reset, addLog])

  // 카운트다운 표시값
  const displayTime =
    timerStatus === 'done'
      ? '✓'
      : timerStatus === 'idle'
      ? formatTime(selectedPreset)
      : formatTime(remainingSeconds)

  return (
    <div className={styles.wrapper}>
      <div className={styles.appContainer}>
        <div className={styles.bgGrid} />
        <div className={styles.bgScanlines} />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.labelSystem}>{'// health_app / rest_timer_test'}</span>
            <button className={styles.btnLogout} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
          <h1 className={styles.pageTitle}>휴식 타이머</h1>
        </header>

        <main className={styles.main}>

          {/* STEP 1: 구독 */}
          <section className={styles.section}>
            <span className={styles.label}>STEP 1 — 알림 구독</span>
            <div className={styles.card}>
              <p className={styles.cardDesc}>
                {pushStatus === 'subscribed'
                  ? '✅ 알림 구독 중입니다. 앱을 닫아도 서버에서 알림을 보내줍니다.'
                  : pushStatus === 'denied'
                  ? '❌ 알림 권한이 거부되었습니다. 설정에서 허용해주세요.'
                  : pushStatus === 'unsupported'
                  ? '❌ 이 브라우저는 PWA 푸시를 지원하지 않습니다. Safari(iOS 16.4+) + 홈 화면 추가 후 사용해주세요.'
                  : 'PWA 백그라운드 푸시 알림을 활성화합니다.'}
              </p>
              <div className={styles.buttonRow}>
                {pushStatus === 'subscribed' ? (
                  <button className={styles.btnDanger} onClick={handleUnsubscribe}>
                    구독 취소
                  </button>
                ) : (
                  <button
                    className={styles.btnPrimary}
                    onClick={handleSubscribe}
                    disabled={
                      pushStatus === 'requesting' ||
                      pushStatus === 'denied' ||
                      pushStatus === 'unsupported'
                    }
                  >
                    {pushStatus === 'requesting' ? '요청 중...' : '🔔 알림 구독하기'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* STEP 2: 프리셋 선택 */}
          <section className={styles.section}>
            <span className={styles.label}>STEP 2 — 휴식 시간 선택</span>
            <div className={styles.card}>
              <div className={styles.buttonRow}>
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    className={
                      selectedPreset === p.value && timerStatus === 'idle'
                        ? styles.btnPrimary
                        : styles.btnGhost
                    }
                    onClick={() => {
                      if (timerStatus === 'idle') setSelectedPreset(p.value)
                    }}
                    disabled={timerStatus !== 'idle'}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* STEP 3: 타이머 */}
          <section className={styles.section}>
            <span className={styles.label}>STEP 3 — 백그라운드 타이머</span>
            <div className={styles.card}>
              {/* 카운트다운 디스플레이 */}
              <div className={styles.timerDisplay}>
                <div
                  className={`${styles.timerNum} ${
                    timerStatus === 'done'
                      ? styles.timerDone
                      : timerStatus === 'running'
                      ? styles.timerRunning
                      : ''
                  }`}
                >
                  {displayTime}
                </div>
                <div className={styles.timerLabel}>
                  {timerStatus === 'idle' && '대기 중'}
                  {timerStatus === 'running' && `타이머 실행 중... (총 ${durationSec}초)`}
                  {timerStatus === 'done' && '완료! 알림이 발송되었습니다 🎉'}
                </div>
              </div>

              <p className={styles.cardDesc}>
                {timerStatus === 'idle'
                  ? '시작 후 앱을 닫거나 화면을 꺼도 서버(QStash)가 지정 시간에 알림을 보냅니다.'
                  : timerStatus === 'running'
                  ? '지금 앱을 닫아도 알림이 옵니다! 서버가 카운트 중입니다.'
                  : '알림이 발송되었습니다! 화면 밖에서도 알림이 왔나요? 🎉'}
              </p>

              <div className={styles.buttonRow}>
                {timerStatus === 'idle' ? (
                  <button
                    className={`${styles.btnPrimary} ${
                      pushStatus !== 'subscribed' ? styles.btnDisabled : ''
                    }`}
                    onClick={handleStart}
                    disabled={pushStatus !== 'subscribed'}
                  >
                    ⏱️ 타이머 시작
                  </button>
                ) : timerStatus === 'running' ? (
                  <button className={styles.btnDanger} onClick={handleCancel}>
                    ✕ 취소 (건너뛰기)
                  </button>
                ) : (
                  <button className={styles.btnGhost} onClick={handleReset}>
                    ↩️ 리셋
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 로그 */}
          <section className={styles.section}>
            <span className={styles.label}>LOG</span>
            <div className={`${styles.card} ${styles.logCard}`}>
              {log.length === 0 ? (
                <p className={styles.logEmpty}>{'// 로그 없음'}</p>
              ) : (
                log.map((entry, i) => (
                  <p key={i} className={styles.logEntry}>{entry}</p>
                ))
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
