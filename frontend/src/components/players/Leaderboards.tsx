import { useStore } from '../../store'
import { Trophy, Target } from 'lucide-react'

export default function Leaderboards() {
  const { players } = useStore()

  // Top 10 batters by highest runs
  const topBat = [...players]
    .filter(p => p.runs > 0)
    .sort((a, b) => (b.runs || 0) - (a.runs || 0))
    .slice(0, 10)

  // Top 10 bowlers by most wickets (Run-out wickets NOT counted for bowler — handled at data entry)
  const topBowl = [...players]
    .filter(p => (p.wickets || 0) > 0)
    .sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
    .slice(0, 10)

  if (!topBat.length && !topBowl.length) return null

  return (
    <div className="space-y-4 pb-4 mt-2">
      <div className="px-4 pt-2">
        <span className="font-display text-xl text-white tracking-wide">📊 Leaderboards</span>
      </div>

      {/* Top Batters */}
      {topBat.length > 0 && (
        <div className="mx-3 card overflow-hidden">
          <div className="px-4 py-3 bg-[#f0c040]/8 border-b border-[#f0c040]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#f0c040]" />
              <span className="text-sm text-[#f0c040] tracking-widest uppercase font-semibold font-display">Top Run Scorers</span>
            </div>
            <span className="text-[10px] text-[#4a5568]">Top {topBat.length}</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {topBat.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
                  ${i === 0 ? 'bg-[#f0c040]/20 text-[#f0c040]' : i === 1 ? 'bg-white/10 text-white' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-white/[0.03] text-[#4a5568]'}`}>
                  {i + 1}
                </span>
                <span className="text-xl leading-none flex-shrink-0">{p.emoji || '🏏'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white flex items-center gap-1 truncate">
                    {p.name}{i === 0 && <span>🔥</span>}
                  </div>
                  <div className="text-[11px] text-[#4a5568] truncate">{p.team?.name || '—'}</div>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <div className="font-mono font-black text-[#f0c040] text-lg leading-none">{p.runs}</div>
                  <div className="text-[10px] text-[#4a5568]">
                    {p.strikeRate ? `SR: ${Number(p.strikeRate).toFixed(1)}` : ''}
                    {p.best ? ` · Best: ${p.best}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Bowlers */}
      {topBowl.length > 0 && (
        <div className="mx-3 card overflow-hidden">
          <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-red-400" />
              <span className="text-sm text-red-400 tracking-widest uppercase font-semibold font-display">Top Wicket Takers</span>
            </div>
            <span className="text-[10px] text-[#4a5568]">Top {topBowl.length}</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {topBowl.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
                  ${i === 0 ? 'bg-red-500/20 text-red-400' : i === 1 ? 'bg-white/10 text-white' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-white/[0.03] text-[#4a5568]'}`}>
                  {i + 1}
                </span>
                <span className="text-xl leading-none flex-shrink-0">{p.emoji || '🏏'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white flex items-center gap-1 truncate">
                    {p.name}{i === 0 && <span>🎯</span>}
                  </div>
                  <div className="text-[11px] text-[#4a5568] truncate">{p.team?.name || '—'}</div>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <div className="font-mono font-black text-red-400 text-lg leading-none">{p.wickets}W</div>
                  <div className="text-[10px] text-[#4a5568]">
                    {p.economy ? `Eco: ${Number(p.economy).toFixed(2)}` : ''}
                    {p.best ? ` · ${p.best}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
