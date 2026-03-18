const CACHE = 'ppl2026-v2'
const STATIC = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
    return
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
    }).catch(() => caches.match('/'))
  )
})

// ─── Push Notification Handler ──────────────────────────────────────────────
// This fires when a push is received from the backend (web-push)
// It shows in device notification bar even when app is closed/background
self.addEventListener('push', e => {
  let data = {
    title: 'PPL 2026',
    body: 'New update!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url: '/',
  }

  try {
    if (e.data) {
      const parsed = e.data.json()
      data = { ...data, ...parsed }
    }
  } catch {}

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: 'ppl-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open',    title: '📲 Open App' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  }

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ─── Notification Click Handler ──────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()

  if (e.action === 'dismiss') return

  const url = e.notification.data?.url || '/'

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // If app already open, focus it and navigate
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// ─── Push subscription change ────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', e => {
  // Re-subscribe if subscription expires
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: e.oldSubscription?.options?.applicationServerKey,
    }).catch(() => {})
  )
})
