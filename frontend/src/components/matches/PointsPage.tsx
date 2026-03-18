import { useStore } from '../../store'
import { getTeamStats, groupColor } from '../../utils'
import { Trophy } from 'lucide-react'

export default function PointsPage() {
  const { groups, teams, matches } = useStore()

  // Teams with groups
  const teamsWithGroup = teams.filter(t => t.groupId)
  // Teams without any group
  const teamsNoGroup = teams.filter(t => !t.groupId)

  if (!teams.length) return (
    <div className="fade-up text-center py-20 text-[#4a5568]">
      <div className="text-4xl mb-3 opacity-30">🏆</div>
      <p className="text-sm">No teams yet</p>
    </div>
  )

  return (
    <div className="fade-up">
      <div className="px-4 py-3 flex items-center gap-2">
        <Trophy size={16} className="text-[#f0c040]" />
        <span className="font-display text-xl text-white tracking-wide">Points Table</span>
      </div>

      <div className="px-3 space-y-4 pb-6">

        {/* Per-group tables */}
        {groups.map(g => {
          const gc = groupColor[g.color || 'gold']
          const gt = teams.filter(t => t.groupId === g.id)
          if (!gt.length) return null
          const rows = gt
            .map(t => ({ ...t, ...getTeamStats(t.name, matches) }))
            .sort((a, b) => b.pts - a.pts || b.nrrNum - a.nrrNum)

          return (
            <div key={g.id} className={`card overflow-hidden border ${gc.ring}`}>
              {/* Group header */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${gc.bg} ${gc.ring}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-display text-base tracking-wide ${gc.text}`}>{g.name}</span>
                </div>
                <span className="text-[11px] text-[#4a5568] bg-black/20 px-2 py-0.5 rounded-full">{gt.length} teams</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {['#','Team','P','W','L','NR','NRR','Pts'].map((h, i) => (
                        <th key={h} className={`py-2 px-2 text-[10px] text-[#4a5568] uppercase tracking-widest font-semibold ${i === 1 ? 'text-left' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} className={`border-b border-white/[0.02] last:border-0 ${i < 2 ? 'bg-white/[0.015]' : ''}`}>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold
                            ${i === 0 ? gc.text + ' ' + gc.bg : i < 2 ? 'bg-white/10 text-white' : 'text-[#4a5568] bg-white/[0.03]'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{r.emoji} {r.name}</span>
                            {i < 2 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Qualifies" />}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8892b0]">{r.played}</td>
                        <td className="py-2.5 px-2 text-center text-emerald-400 font-semibold">{r.won}</td>
                        <td className="py-2.5 px-2 text-center text-red-400">{r.lost}</td>
                        <td className="py-2.5 px-2 text-center text-[#4a5568]">{r.nr}</td>
                        <td className={`py-2.5 px-2 text-center font-mono text-[11px]
                          ${r.nrrNum > 0 ? 'text-emerald-400' : r.nrrNum < 0 ? 'text-red-400' : 'text-[#4a5568]'}`}>
                          {r.nrr}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`font-mono font-black text-sm ${gc.text}`}>{r.pts}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {/* Teams without groups */}
        {teamsNoGroup.length > 0 && (
          <div className="card overflow-hidden border border-white/[0.06]">
            <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
              <span className="font-display text-base tracking-wide text-[#8892b0]">Other Teams</span>
              <span className="text-[11px] text-[#4a5568]">{teamsNoGroup.length} teams</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['#','Team','P','W','L','NR','NRR','Pts'].map((h, i) => (
                      <th key={h} className={`py-2 px-2 text-[10px] text-[#4a5568] uppercase tracking-widest font-semibold ${i === 1 ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamsNoGroup
                    .map(t => ({ ...t, ...getTeamStats(t.name, matches) }))
                    .sort((a, b) => b.pts - a.pts || b.nrrNum - a.nrrNum)
                    .map((r, i) => (
                      <tr key={r.id} className="border-b border-white/[0.02] last:border-0">
                        <td className="py-2.5 px-2 text-center">
                          <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-[#4a5568] bg-white/[0.03]">{i + 1}</span>
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-white">{r.emoji} {r.name}</td>
                        <td className="py-2.5 px-2 text-center text-[#8892b0]">{r.played}</td>
                        <td className="py-2.5 px-2 text-center text-emerald-400 font-semibold">{r.won}</td>
                        <td className="py-2.5 px-2 text-center text-red-400">{r.lost}</td>
                        <td className="py-2.5 px-2 text-center text-[#4a5568]">{r.nr}</td>
                        <td className={`py-2.5 px-2 text-center font-mono text-[11px] ${r.nrrNum > 0 ? 'text-emerald-400' : r.nrrNum < 0 ? 'text-red-400' : 'text-[#4a5568]'}`}>{r.nrr}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-black text-sm text-[#f0c040]">{r.pts}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#4a5568] px-1">
          🟢 Top 2 per group qualify · Win = 2pts · No Result = 1pt · NRR per ICC formula
        </p>
      </div>
    </div>
  )
}
