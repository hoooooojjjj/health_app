'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './page.module.css'

type PushStatus = 'idle' | 'requesting' | 'subscribed' | 'denied' | 'unsupported'
type TimerStatus = 'idle' | 'running' | 'done'

// VAPID 공개키를 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

export default function Home() {
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')
  const [countdown, setCountdown] = useState(10)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [log, setLog] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`, ...prev.slice(0, 9)])
  }, [])

  // 알림 권한 요청 + 서비스 워커 구독
  const subscribePush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      addLog('❌ 이 브라우저는 푸시 알림을 지원하지 않습니다')
      return
    }

    setPushStatus('requesting')
    addLog('🔔 알림 권한 요청 중...')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('denied')
        addLog('❌ 알림 권한이 거부되었습니다')
        return
      }

      const reg = await navigator.serviceWorker.ready
      addLog('✅ 서비스 워커 준비됨')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      // 서버에 구독 정보 저장
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) throw new Error('서버 구독 저장 실패')

      setSubscription(sub)
      setPushStatus('subscribed')
      addLog('✅ 푸시 알림 구독 완료!')
    } catch (err) {
      setPushStatus('idle')
      addLog(`❌ 구독 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }, [addLog])

  // 구독 취소
  const unsubscribe = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setSubscription(null)
      setPushStatus('idle')
      addLog('🔕 알림 구독 취소됨')
    }
  }, [subscription, addLog])

  // 10초 타이머 시작
  const startTimer = useCallback(async () => {
    if (!subscription) {
      addLog('⚠️ 먼저 알림을 구독해주세요')
      return
    }

    setTimerStatus('running')
    setCountdown(10)
    addLog('⏱️ 10초 타이머 시작! (앱 닫아도 됩니다)')

    // ① 서버로 "10초 뒤에 알림 보내줘" 요청 (서버가 카운트)
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        delaySeconds: 10,
        title: '🏋️ Health App',
        body: '10초 타이머가 완료되었습니다!',
        url: '/',
      }),
    }).then(async (res) => {
      if (res.ok) addLog('🔔 서버에서 알림 발송 완료!')
      else addLog('❌ 서버 알림 발송 실패')
    }).catch(() => addLog('❌ 서버 연결 오류'))

    // ② 클라이언트 카운트다운 (화면 표시용)
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setTimerStatus('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [subscription, addLog])

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerStatus('idle')
    setCountdown(10)
    addLog('↩️ 타이머 리셋')
  }, [addLog])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.appContainer}>
        <div className={styles.bgGrid} />
        <div className={styles.bgScanlines} />

        {/* Header */}
        <header className={styles.header}>
          <span className={styles.labelSystem}>// health_app / pwa_test</span>
          <h1 className={styles.pageTitle}>알림 테스트</h1>
        </header>

        <main className={styles.main}>

          {/* Step 1: 구독 */}
          <section className={styles.section}>
            <span className={styles.label}>STEP 1 — 알림 구독</span>
            <div className={styles.card}>
              <p className={styles.cardDesc}>
                {pushStatus === 'subscribed'
                  ? '✅ 알림 구독 중입니다. 앱을 닫아도 서버에서 알림을 보내줍니다.'
                  : pushStatus === 'denied'
                  ? '❌ 알림 권한이 거부되었습니다. 설정에서 허용해주세요.'
                  : pushStatus === 'unsupported'
                  ? '❌ 이 브라우저는 PWA 푸시를 지원하지 않습니다. Safari(iOS 16.4+)를 사용해주세요.'
                  : 'PWA 백그라운드 푸시 알림을 활성화합니다.'}
              </p>
              <div className={styles.buttonRow}>
                {pushStatus === 'subscribed' ? (
                  <button className={styles.btnDanger} onClick={unsubscribe}>
                    구독 취소
                  </button>
                ) : (
                  <button
                    className={styles.btnPrimary}
                    onClick={subscribePush}
                    disabled={pushStatus === 'requesting' || pushStatus === 'denied' || pushStatus === 'unsupported'}
                  >
                    {pushStatus === 'requesting' ? '요청 중...' : '🔔 알림 구독하기'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Step 2: 타이머 */}
          <section className={styles.section}>
            <span className={styles.label}>STEP 2 — 10초 백그라운드 타이머</span>
            <div className={styles.card}>
              {/* 카운트다운 디스플레이 */}
              <div className={styles.timerDisplay}>
                <div className={`${styles.timerNum} ${timerStatus === 'done' ? styles.timerDone : timerStatus === 'running' ? styles.timerRunning : ''}`}>
                  {timerStatus === 'done' ? '✓' : String(countdown).padStart(2, '0')}
                </div>
                <div className={styles.timerLabel}>
                  {timerStatus === 'idle' && '대기 중'}
                  {timerStatus === 'running' && '타이머 실행 중...'}
                  {timerStatus === 'done' && '완료!'}
                </div>
              </div>

              <p className={styles.cardDesc}>
                {timerStatus === 'idle'
                  ? '시작 후 앱을 백그라운드로 내리거나 화면을 꺼도 서버에서 10초 뒤 알림을 보냅니다.'
                  : timerStatus === 'running'
                  ? '지금 앱을 닫거나 화면을 꺼도 알림이 옵니다! 서버가 카운트 중입니다.'
                  : '알림이 발송되었습니다! 화면 밖에서도 알림이 왔나요? 🎉'}
              </p>

              <div className={styles.buttonRow}>
                {timerStatus === 'idle' ? (
                  <button
                    className={`${styles.btnPrimary} ${!subscription ? styles.btnDisabled : ''}`}
                    onClick={startTimer}
                    disabled={!subscription}
                  >
                    ⏱️ 10초 타이머 시작
                  </button>
                ) : (
                  <button className={styles.btnGhost} onClick={resetTimer}>
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
                <p className={styles.logEmpty}>// 로그 없음</p>
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
