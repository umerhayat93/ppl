import { useState } from 'react'
import { useStore } from '../../store'
import { ChevronDown, ChevronUp, Users, Star } from 'lucide-react'
import { groupColor } from '../../utils'

const roleLabel: Record<string, string> = { bat:'Batsman', bowl:'Bowler', ar:'All-Rounder', wk:'WK-Bat' }
const roleColor: Record<string, string> = { bat:'text-[#f0c040]', bowl:'text-red-400', ar:'text-emerald-400', wk:'text-cyan-400' }

export default function TeamsPage() {
  const { teams, groups } = useStore()
  const [expanded, setExpanded] = useState<string|null>(null)

  const toggle = (id: string) => setExpanded(prev => prev===id ? null : id)

  return (
    <div className="fade-up">
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-[#f0c040]">🛡</span>
        <span className="font-display text-xl text-white tracking-wide">All Teams</span>
        <span className="ml-auto text-xs text-[#4a5568]">{teams.length} teams</span>
      </div>

      <div className="px-3 space-y-3 pb-6">
        {teams.length === 0 && (
          <div className="text-center py-16 text-[#4a5568]">
            <div className="text-4xl mb-3 opacity-30">🛡</div>
            <p className="text-sm">No teams yet</p>
          </div>
        )}
        {teams.map(team => {
          const g = groups.find(x => x.id === team.groupId)
          const gc = groupColor[g?.color||'gold']
          const isExp = expanded === team.id
          const squad = team.squad || []

          return (
            <div key={team.id} className={`card overflow-hidden border transition-all ${isExp ? 'border-[#f0c040]/25' : 'border-white/[0.06]'}`}>
              {/* Team header — click to expand */}
              <button
                onClick={() => toggle(team.id)}
                className="w-full text-left"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Emoji */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#161f38] to-[#0f1628] border border-white/[0.06] flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
                    {team.emoji || '🏏'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg text-white tracking-wide leading-none">{team.name}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {team.captain && (
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-[#f0c040]" />
                          <span className="text-[11px] text-[#8892b0]">{team.captain}</span>
                        </div>
                      )}
                      {g && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide ${gc.text} ${gc.bg} ${gc.ring}`}>
                          {g.name}
                        </span>
                      )}
                      <span className="text-[11px] text-[#4a5568] flex items-center gap-1">
                        <Users size={10} /> {squad.length} players
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="flex-shrink-0 text-[#4a5568]">
                    {isExp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </button>

              {/* Squad accordion */}
              {isExp && (
                <div className="border-t border-white/[0.04] fade-up">
                  {squad.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[#4a5568] text-sm">No squad members added yet</div>
                  ) : (
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {squad.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2.5 hover:border-white/[0.08] transition-all">
                          {/* Number */}
                          <div className="w-6 h-6 rounded-lg bg-[#161f38] flex items-center justify-center text-[10px] font-bold text-[#4a5568] flex-shrink-0">
                            {idx+1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate leading-tight">{p.name}</div>
                            <div className={`text-[10px] mt-0.5 font-medium ${roleColor[p.role]||'text-[#4a5568]'}`}>
                              {roleLabel[p.role]||p.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
