import { Shield, Wifi, WifiOff } from 'lucide-react'
import { useStore } from '../../store'
import { useState, useEffect } from 'react'

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { live, matches } = useStore()
  const isLive = matches.some(m => m.status === 'live')
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online',on); window.removeEventListener('offline',off) }
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-[#040810]/95 backdrop-blur-xl border-b border-[#f0c040]/10 h-14 flex items-center justify-between px-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffd966] to-[#c8960a] flex items-center justify-center shadow-lg shadow-[#f0c040]/20 flex-shrink-0">
          <span className="font-display text-[#040810] text-base leading-none">PPL</span>
        </div>
        <div>
          <div className="font-display text-[#f0c040] text-lg tracking-wider leading-none">PPL 2026</div>
          <div className="text-[9px] text-[#4a5568] tracking-[0.3em] uppercase leading-none mt-0.5">Pattan Premier League</div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Connectivity dot */}
        <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-red-400'}`} title={online ? 'Online' : 'Offline'} />

        {/* Live badge */}
        {isLive && (
          <span className="badge-live text-[10px] live-blip">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            LIVE
          </span>
        )}

        {/* Admin button */}
        <button
          onClick={onAdminClick}
          className="w-9 h-9 rounded-xl bg-[#0f1628] border border-white/[0.06] flex items-center justify-center text-[#8892b0] hover:border-[#f0c040]/30 hover:text-[#f0c040] transition-all"
        >
          <Shield size={16} />
        </button>
      </div>
    </header>
  )
}
