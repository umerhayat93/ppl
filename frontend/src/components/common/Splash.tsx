import { useEffect, useState } from 'react'

export default function Splash({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setOut(true)
      setTimeout(onDone, 600)
    }, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#040810] flex flex-col items-center justify-center transition-opacity duration-500 ${out ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#f0c040]/8 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cyan-400/5 blur-3xl" />
        {/* Flame bg */}
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

      {/* Logo circle */}
      <div className="relative mb-6 splash-in" style={{ animationDelay: '0.1s' }}>
        <div className="absolute inset-0 rounded-full border-2 border-[#f0c040]/30 splash-ring" />
        <div className="absolute inset-0 rounded-full border border-[#f0c040]/15 splash-ring" style={{ animationDelay: '0.5s' }} />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#ffd966] via-[#f0c040] to-[#c8960a] flex items-center justify-center shadow-2xl shadow-[#f0c040]/30">
          <span className="font-display text-[#040810] text-5xl tracking-tight leading-none">PPL</span>
          <span className="absolute -bottom-1 -right-1 text-3xl">🏏</span>
        </div>
      </div>

      {/* PPL 2026 title */}
      <div className="splash-text text-center mb-2" style={{ animationDelay: '0.4s' }}>
        <div className="font-display text-[#f0c040] text-5xl tracking-[0.15em]">PPL 2026</div>
      </div>

      {/* English subtitle */}
      <div className="splash-in text-center mb-2" style={{ animationDelay: '0.7s' }}>
        <p className="text-white text-base tracking-[0.25em] uppercase font-semibold">
          Pattan Premier League
        </p>
      </div>

      {/* Urdu slogan — white, large */}
      <div className="splash-in text-center px-6" style={{ animationDelay: '0.9s' }}>
        <p className="text-white text-xl font-semibold leading-relaxed" dir="rtl" style={{ fontFamily: 'serif' }}>
          پٹن پریمیئر لیگ ۲۰۲۶
        </p>
        <p className="text-white/70 text-base mt-1" dir="rtl" style={{ fontFamily: 'serif' }}>
          کرکٹ کا جشن
        </p>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-16 flex gap-2 splash-in" style={{ animationDelay: '1.2s' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#f0c040]/60 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
