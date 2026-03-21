// PPL 2026 — Custom Service Worker v6
const CACHE_VER    = 'ppl2026-v6'
const STATIC_CACHE = `${CACHE_VER}-static`
const IMAGE_CACHE  = `${CACHE_VER}-images`
const API_URL      = 'https://ppl2026-backend.onrender.com'
const FRONTEND_URL = 'https://ppl2026-frontend.onrender.com'

const PRECACHE = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/badge-72.png']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== IMAGE_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => ping())
  )
})

const ping = () => fetch(`${API_URL}/api/bootstrap`, { cache: 'no-store' }).catch(() => {})
setInterval(ping, 10 * 60 * 1000)

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/')) { e.respondWith(fetch(e.request)); return }
  if (url.hostname !== self.location.hostname) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return }
  if (e.request.destination === 'image') {
    e.respondWith(caches.open(IMAGE_CACHE).then(cache => cache.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res })
    }))); return
  }
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(() => caches.match('/index.html').then(r => r || fetch('/')))); return }
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(STATIC_CACHE).then(cc => cc.put(e.request, c)) } return res }).catch(() => caches.match(e.request))); return
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})

// ── PUSH ─────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let d = {
    title: 'PPL 2026',
    body:  'New update from Pattan Premier League!',
    icon:  `${FRONTEND_URL}/icons/icon-192.png`,
    badge: `${FRONTEND_URL}/icons/badge-72.png`,
    url:   '/',
  }
  try { if (e.data) d = { ...d, ...e.data.json() } } catch {}

  // Ensure icon is always absolute URL — Android requires this
  // to show the PPL logo instead of the blank square or P circle
  if (d.icon && !d.icon.startsWith('http')) {
    d.icon = `${FRONTEND_URL}${d.icon}`
  }
  if (d.badge && !d.badge.startsWith('http')) {
    d.badge = `${FRONTEND_URL}${d.badge}`
  }

  e.waitUntil(
    self.registration.showNotification(d.title, {
      body:               d.body,
      icon:               d.icon,   // PPL logo — shown as large icon replacing the purple square
      badge:              d.badge,  // monochrome badge in status bar
      tag:                'ppl2026',
      renotify:           true,
      silent:             false,
      vibrate:            [200, 100, 200],
      requireInteraction: false,
      data:               { url: d.url || '/' },
    })
  )
})

// ── CLICK ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) { c.focus(); c.navigate(url); return }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
