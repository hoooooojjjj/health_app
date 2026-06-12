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

  const data = event.data.json()

  const options = {
    body: data.body || '휴식 시간이 종료되었습니다.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    // 같은 tag로 중복 알림 방지 (최신 알림이 기존 알림을 덮어씀)
    tag: data.tag || 'rest-timer',
    renotify: true,
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🏋️ 휴식 완료!', options)
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
