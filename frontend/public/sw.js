const CACHE = 'ppl2026-v1'
const STATIC = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))
})
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
    return
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    if (res.status === 200) { const c = res.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)) }
    return res
  })).catch(() => caches.match('/')))
})
self.addEventListener('push', e => {
  let data = { title:'PPL 2026', body:'New update!', icon:'/icons/icon-192.png', badge:'/icons/badge-72.png' }
  try { data = { ...data, ...e.data.json() } } catch {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: data.icon, badge: data.badge,
    tag: 'ppl-live', renotify: true,
    data: { url: data.url || '/' }
  }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    const w = list.find(c => c.url.includes(self.location.origin))
    if (w) { w.focus(); w.navigate(url) } else clients.openWindow(url)
  }))
})
