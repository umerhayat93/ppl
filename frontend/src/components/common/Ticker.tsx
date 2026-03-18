import { useStore } from '../../store'

export default function Ticker() {
  const { ann, ads, matches } = useStore()
  const items = [
    ...ann.slice(0,5).map(a => a.content),
    ...matches.filter(m=>m.status==='live').map(m=>`🔴 LIVE: ${m.team1?.name} vs ${m.team2?.name}`),
    ...ads.slice(0,3).map(a => a.content),
    '🏏 PPL 2026 — Pattan Premier League Official App',
  ].filter(Boolean)

  if (!items.length) return null
  const doubled = [...items, ...items]

  return (
    <div className="bg-[#f0c040]/5 border-b border-[#f0c040]/10 h-8 flex items-center overflow-hidden">
      <div className="bg-[#f0c040] text-[#040810] font-display text-[10px] tracking-widest px-3 h-full flex items-center flex-shrink-0">LIVE</div>
      <div className="overflow-hidden flex-1 h-full relative">
        <div className="ticker-track flex items-center h-full whitespace-nowrap absolute">
          {doubled.map((item, i) => (
            <span key={i} className="text-[11px] text-[#ffd966] px-6 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#c8960a] inline-block flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
