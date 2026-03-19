import { Shield } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-4"
      style={{
        background: 'rgba(13,5,32,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(147,51,234,0.15)',
        boxShadow: '0 1px 20px rgba(147,51,234,0.1)',
      }}>

      {/* Brand — PSL logo + text */}
      <div className="flex items-center gap-3">
        <img
          src="/icons/icon-192.png"
          alt="PSL"
          className="w-9 h-9 rounded-xl object-cover"
          style={{ boxShadow: '0 0 12px rgba(147,51,234,0.4)' }}
        />
        <div>
          <div className="font-display leading-none tracking-wider" style={{
            fontSize: '1.15rem',
            background: 'linear-gradient(135deg, #d4a017, #f0c040)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            PPL 2026
          </div>
          <div className="text-[9px] tracking-[0.25em] uppercase leading-none mt-0.5" style={{ color: '#7c5fa0' }}>
            Pattan Premier League
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full transition-colors ${online ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={online ? { boxShadow: '0 0 6px rgba(52,211,153,0.6)' } : {}}
          title={online ? 'Online' : 'Offline'} />
        <button onClick={onAdminClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'rgba(147,51,234,0.1)',
            border: '1px solid rgba(147,51,234,0.2)',
            color: '#9333ea',
          }}>
          <Shield size={16} />
        </button>
      </div>
    </header>
  )
}
