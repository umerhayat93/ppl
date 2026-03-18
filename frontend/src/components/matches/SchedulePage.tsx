import { useStore } from '../../store'
import { fmtDate, fmtTime, statusLabel, statusColor } from '../../utils'
import { Calendar } from 'lucide-react'

const STAGES = [
  { key:'group',      label:'Group Stage',       icon:'🏏' },
  { key:'prequarter', label:'Pre-Quarter Finals', icon:'⚔️'  },
  { key:'quarter',    label:'Quarter Finals',     icon:'🥊' },
  { key:'semi',       label:'Semi Finals',        icon:'🔥' },
  { key:'final',      label:'Final',              icon:'🏆' },
]

export default function SchedulePage() {
  const { matches, groups } = useStore()
  if (!matches.length) return (
    <div className="fade-up text-center py-20 text-[#4a5568]">
      <div className="text-4xl mb-3 opacity-30">📅</div><p className="text-sm">No matches scheduled yet</p>
    </div>
  )

  const sections: { label:string; icon:string; items:any[] }[] = []
  STAGES.forEach(st => {
    const sm = matches.filter(m => m.stage===st.key && !['postponed','cancelled'].includes(m.status))
    if (!sm.length) return
    if (st.key === 'group') {
      const grpNames = [...new Set(sm.map(m => m.group?.name || m.groupId || 'Other'))]
      grpNames.forEach(gn => {
        const gm = sm.filter(m => (m.group?.name||m.groupId||'Other')===gn)
        if (gm.length) sections.push({ label: gn, icon:'🏏', items: gm })
      })
    } else {
      sections.push({ label:st.label, icon:st.icon, items:sm })
    }
  })
  const special = matches.filter(m => ['postponed','cancelled'].includes(m.status))
  if (special.length) sections.push({ label:'Postponed / Cancelled', icon:'📅', items:special })

  return (
    <div className="fade-up">
      <div className="px-4 py-3 flex items-center gap-2">
        <Calendar size={16} className="text-[#f0c040]" />
        <span className="font-display text-xl text-white tracking-wide">PPL 2026 Schedule</span>
      </div>
      <div className="px-3 space-y-4 pb-6">
        {sections.map((sec, si) => (
          <div key={si} className="card overflow-hidden">
            {/* Section header */}
            <div className="px-4 py-2.5 bg-[#f0c040]/5 border-b border-[#f0c040]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{sec.icon}</span>
                <span className="font-display text-[#f0c040] tracking-wide">{sec.label}</span>
              </div>
              <span className="text-[11px] text-[#4a5568] bg-white/[0.04] px-2 py-0.5 rounded-full">{sec.items.length} match{sec.items.length!==1?'es':''}</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {sec.items.map(m => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchRow({ match: m }: { match:any }) {
  const h = m.highlights || {}
  const sc = statusColor[m.status] || statusColor.upcoming
  return (
    <div className="px-4 py-3 flex gap-3">
      {/* Match no */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.status==='live'?'bg-red-500/20 text-red-400 border border-red-500/30':'bg-white/[0.04] text-[#4a5568] border border-white/[0.06]'}`}>
        {m.matchNo||'—'}
      </div>
      {/* Teams + result */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-white">{m.team1?.name}</div>
        <div className="text-[11px] text-[#4a5568]">vs</div>
        <div className="font-semibold text-sm text-[#8892b0]">{m.team2?.name}</div>
        {(m.score1||m.score2) && <div className="text-[11px] font-mono text-[#f0c040] mt-1">{m.score1}{m.score2?` | ${m.score2}`:''}</div>}
        {m.result && m.status==='completed' && <div className="text-[11px] text-emerald-400 mt-0.5">✅ {m.result}</div>}
        {h.topBatter && <div className="text-[10px] text-[#f0c040] mt-0.5">🏏 {h.topBatter.name} {h.topBatter.runs}({h.topBatter.balls})</div>}
        {h.topBowler && <div className="text-[10px] text-red-400">🎯 {h.topBowler.name} {h.topBowler.wickets}/{h.topBowler.runs}</div>}
      </div>
      {/* Date/time + status */}
      <div className="flex-shrink-0 text-right space-y-1">
        <div className="text-xs font-semibold text-white">{fmtDate(m.date)}</div>
        <div className="text-[11px] font-mono text-[#f0c040]">{fmtTime(m.time)}</div>
        <div className="text-[10px] text-[#4a5568]">{m.year}</div>
        <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc}`}>
          {m.status==='live'?'🔴 ':''}
          {statusLabel[m.status]||m.status}
        </span>
      </div>
    </div>
  )
}
