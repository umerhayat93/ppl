// Handles push notification subscription and registration
const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function registerPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    const reg = await navigator.serviceWorker.ready

    // Get VAPID public key from backend
    const res = await fetch(`${API_URL}/api/notifications/vapid-public-key`)
    const { publicKey } = await res.json()
    if (!publicKey) return false

    // Check if already subscribed
    let sub = await reg.pushManager.getSubscription()
    if (sub) {
      // Re-send to backend in case it was lost
      await sendSubToBackend(sub)
      return true
    }

    // Subscribe
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    await sendSubToBackend(sub)
    return true
  } catch (e) {
    console.warn('[Push] Registration failed:', e)
    return false
  }
}

async function sendSubToBackend(sub: PushSubscription) {
  const json = sub.toJSON()
  await fetch(`${API_URL}/api/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh || '',
      auth: json.keys?.auth || '',
    }),
  })
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') {
    await registerPushSubscription()
    return true
  }
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  if (result === 'granted') {
    await registerPushSubscription()
    return true
  }
  return false
}
