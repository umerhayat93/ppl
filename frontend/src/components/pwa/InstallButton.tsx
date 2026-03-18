import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

let deferredPrompt: any = null

export default function InstallButton() {
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setInstalled(true); return }

    const handler = (e: any) => { e.preventDefault(); deferredPrompt = e; setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setShow(false); setInstalled(true) })

    // Show on iOS after delay
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS && !window.navigator.standalone) { setTimeout(() => setShow(true), 4000) }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShow(false)
      deferredPrompt = null
    } else if (isIOS) {
      alert('To install PPL 2026:\n\n1. Tap the Share button (□↑) at the bottom\n2. Scroll down → "Add to Home Screen"\n3. Tap "Add"')
    }
  }

  if (!show || installed) return null

  return (
    <div
      className="fixed bottom-5 left-1/2 z-50 w-[88%] max-w-sm"
      style={{ transform:'translateX(-50%)', animation:'installPulse 2.5s ease-in-out infinite' }}
    >
      <button
        onClick={install}
        className="w-full bg-gradient-to-r from-[#c8960a] to-[#f0c040] text-[#040810] rounded-2xl px-5 py-4 flex items-center justify-center gap-3 shadow-2xl shadow-[#f0c040]/30 active:scale-95 transition-transform"
      >
        <Download size={18} strokeWidth={2.5} />
        <span className="font-display text-base tracking-[0.15em]">INSTALL PPL 2026 APP</span>
      </button>
      <button
        onClick={() => setShow(false)}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0f1628] border border-white/10 text-[#4a5568] text-xs flex items-center justify-center"
      >✕</button>
    </div>
  )
}
