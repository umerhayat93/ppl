import { useEffect, useState } from 'react'

export default function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  // phase 0 = logo animating in
  // phase 1 = text appearing
  // phase 2 = fading out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 3200)
    const t3 = setTimeout(() => onDone(), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-600 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(160deg, #0d0520 0%, #1a0540 50%, #0d0520 100%)' }}>

      {/* ── Background fire glows ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large purple glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl fire-glow"
          style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)' }} />
        {/* Fire orange glow top-right */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl fire-glow"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', animationDelay: '0.3s' }} />
        {/* Gold accent bottom */}
        <div className="absolute bottom-1/3 left-1/3 w-40 h-40 rounded-full blur-3xl fire-glow"
          style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)', animationDelay: '0.7s' }} />
        {/* Subtle top grain */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
      </div>

      {/* ── Animated ring behind logo ── */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-8 rounded-full border-2 border-purple-500/20 splash-ring" />
        <div className="absolute inset-0 -m-4 rounded-full border border-amber-400/15 splash-ring" style={{ animationDelay: '0.8s' }} />

        {/* ── PSL LOGO — animated in ── */}
        <div className="splash-logo relative" style={{ animationDelay: '0.05s' }}>
          {/* Flame pulse glow behind logo */}
          <div className="absolute inset-0 rounded-full blur-2xl purple-glow"
            style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(249,115,22,0.2) 60%, transparent 100%)' }} />

          <img
            src="/icons/icon-512.png"
            alt="PSL"
            className="relative w-44 h-44 object-contain drop-shadow-2xl splash-flame"
            style={{ filter: 'drop-shadow(0 0 24px rgba(147,51,234,0.6)) drop-shadow(0 0 48px rgba(249,115,22,0.3))' }}
          />
        </div>
      </div>

      {/* ── Text section ── */}
      <div className={`text-center transition-all duration-500 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* PPL 2026 in gold */}
        <div className="splash-text font-display tracking-[0.2em] mb-1" style={{
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #d4a017 0%, #f0c040 40%, #f97316 80%, #d4a017 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animationDelay: '0.6s',
        }}>
          PPL 2026
        </div>

        {/* Pattan Premier League */}
        <div className="splash-in text-[#d4a017] text-sm font-semibold tracking-[0.35em] uppercase mb-2" style={{ animationDelay: '0.9s' }}>
          Pattan Premier League
        </div>

        {/* Urdu — white, prominent */}
        <div className="splash-in" style={{ animationDelay: '1.1s' }}>
          <p className="text-white text-xl font-bold leading-relaxed" dir="rtl" style={{ fontFamily: 'serif', textShadow: '0 0 20px rgba(147,51,234,0.5)' }}>
            پٹن پریمیئر لیگ ۲۰۲۶
          </p>
          <p className="text-purple-300/80 text-sm mt-0.5" dir="rtl" style={{ fontFamily: 'serif' }}>
            کرکٹ کا جشن
          </p>
        </div>
      </div>

      {/* ── Loading bar ── */}
      <div className="absolute bottom-12 left-8 right-8">
        <div className="h-px w-full rounded-full overflow-hidden" style={{ background: 'rgba(147,51,234,0.15)' }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: phase >= 1 ? '100%' : '30%',
              transitionDuration: phase >= 1 ? '2.5s' : '0.4s',
              background: 'linear-gradient(90deg, #9333ea, #d4a017, #f97316)',
            }} />
        </div>
      </div>
    </div>
  )
}
