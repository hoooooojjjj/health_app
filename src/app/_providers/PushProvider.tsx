'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

// 푸시 알림 상태 타입
export type PushStatus =
  | 'idle'         // 초기 상태
  | 'requesting'   // 권한 요청 중
  | 'subscribed'   // 구독 완료
  | 'denied'       // 권한 거부
  | 'unsupported'  // 브라우저 미지원

interface PushContextValue {
  pushStatus: PushStatus
  subscription: PushSubscription | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

// ---- Context ----
const PushContext = createContext<PushContextValue | null>(null)

// VAPID 공개키 → Uint8Array 변환
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer
}

// ---- Provider ----
export function PushProvider({ children }: { children: React.ReactNode }) {
  const [pushStatus, setPushStatus] = useState<PushStatus>('idle')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  // 마운트 시: 이미 서비스 워커 구독이 존재하는지 확인
  useEffect(() => {
    const checkExisting = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushStatus('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setPushStatus('denied')
        return
      }
      try {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          setSubscription(existing)
          setPushStatus('subscribed')
        }
      } catch {
        // 서비스 워커 미준비 상태 → idle 유지
      }
    }
    checkExisting()
  }, [])

  // 알림 권한 요청 + 서비스 워커 구독 + DB 저장
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      return
    }

    setPushStatus('requesting')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      // DB에 구독 정보 저장
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) throw new Error('서버 구독 저장 실패')

      setSubscription(sub)
      setPushStatus('subscribed')
    } catch (err) {
      console.error('[Push] 구독 실패:', err)
      setPushStatus('idle')
    }
  }, [])

  // 구독 취소
  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    try {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
      setSubscription(null)
      setPushStatus('idle')
    } catch (err) {
      console.error('[Push] 구독 취소 실패:', err)
    }
  }, [subscription])

  return (
    <PushContext.Provider value={{ pushStatus, subscription, subscribe, unsubscribe }}>
      {children}
    </PushContext.Provider>
  )
}

// ---- 커스텀 훅 ----
export function usePush(): PushContextValue {
  const ctx = useContext(PushContext)
  if (!ctx) throw new Error('usePush는 PushProvider 내부에서 사용해야 합니다')
  return ctx
}
