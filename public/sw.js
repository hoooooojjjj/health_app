// Service Worker — Health App
// 역할: 푸시 알림 수신 및 표시

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// 📨 푸시 이벤트: 서버에서 알림이 도착했을 때 실행
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data;
  try {
    data = event.data.json()
  } catch (err) {
    data = { body: event.data.text() }
  }

  const title = data.title || '🏋️ 휴식 완료!'
  
  // iOS 및 모바일 브라우저 호환성을 고려한 안전한 기본 옵션 구성
  const options = {
    body: data.body || '휴식 시간이 종료되었습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'rest-timer',
    data: {
      url: data.url || '/',
    },
  }

  // iOS Safari 등 일부 환경에서 vibrate 및 renotify 설정 시 알림이 묵살되거나 오류가 발생하는 현상 방지
  // (renotify는 iOS Safari에서 미지원하며, vibrate 역시 브라우저 제한이 있을 수 있음)
  try {
    // 안드로이드/데스크톱 크롬 호환용 옵션 추가
    if ('vibrate' in Notification.prototype) {
      options.vibrate = [200, 100, 200, 100, 200]
    }
  } catch (e) {
    // 예외 발생 시 무시
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch((err) => {
        console.error('[SW] showNotification 실패, 기본 옵션으로 재시도:', err)
        // 실패 시 가장 기본적인 형태(title, body)로만 재시도하여 알림 유실 방지
        return self.registration.showNotification(title, {
          body: options.body,
          data: options.data,
        })
      })
  )
})

// 🖱️ 알림 클릭: 앱을 포커스하거나 새 탭으로 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열려 있는 탭이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        // 없으면 새 탭 열기
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})
