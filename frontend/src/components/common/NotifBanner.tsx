import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

export default function NotifBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem('ppl_notif_asked')) return
    const t = setTimeout(() => setShow(true), 5000)
    return () => clearTimeout(t)
  }, [])

  const enable = async () => {
    localStorage.setItem('ppl_notif_asked', '1')
    const p = await Notification.requestPermission()
    if (p === 'granted') {
      setShow(false)
    } else {
      setShow(false)
    }
  }

  if (!show) return null
  return (
    <div className="mx-3 mb-3 rounded-2xl bg-[#0f1628] border border-[#f0c040]/20 p-4 flex items-center gap-3 fade-up">
      <div className="w-10 h-10 rounded-xl bg-[#f0c040]/10 flex items-center justify-center flex-shrink-0">
        <Bell size={18} className="text-[#f0c040]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">Get Live Alerts</p>
        <p className="text-xs text-[#8892b0] mt-0.5">Wickets, boundaries & scores instantly</p>
      </div>
      <button onClick={enable} className="flex-shrink-0 bg-[#f0c040] text-[#040810] font-display text-xs tracking-widest px-3 py-1.5 rounded-lg">ENABLE</button>
      <button onClick={() => { setShow(false); localStorage.setItem('ppl_notif_asked','1') }} className="flex-shrink-0 text-[#4a5568]"><X size={16} /></button>
    </div>
  )
}
