import { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { fmtDate, fmtTime, statusLabel, statusColor, statusIcon } from '../../utils'
import { Calendar, Search, X } from 'lucide-react'

const STAGES = [
  { key:'group',      label:'Group Stage',       icon:'🏏' },
  { key:'prequarter', label:'Pre-Quarter Finals', icon:'⚔️'  },
  { key:'quarter',    label:'Quarter Finals',     icon:'🥊' },
  { key:'semi',       label:'Semi Finals',        icon:'🔥' },
  { key:'final',      label:'Final',              icon:'🏆' },
]

export default function SchedulePage() {
  const { matches } = useStore()
  const [search, setSearch] = useState('')

  // Search results — filter by team name
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.trim().toLowerCase()
    return matches.filter(m =>
      m.team1?.name?.toLowerCase().includes(q) ||
      m.team2?.name?.toLowerCase().includes(q)
    ).sort((a, b) => {
      const dtA = a.date ? new Date(`${a.date}T${a.time||'00:00'}`).getTime() : 0
      const dtB = b.date ? new Date(`${b.date}T${b.time||'00:00'}`).getTime() : 0
      return dtA - dtB
    })
  }, [search, matches])

  // Build schedule sections — groups alphabetically sorted
  const sections = useMemo(() => {
    const result: { label:string; icon:string; items:any[] }[] = []
    const special = ['postponed','cancelled','delayed','rematch']

    STAGES.forEach(st => {
      const sm = matches.filter(m => m.stage===st.key && !special.includes(m.status))
      if (!sm.length) return
      if (st.key === 'group') {
        // Get unique group names, sort alphabetically
        const grpNames = [...new Set(sm.map(m => m.group?.name || 'Group Stage'))].sort()
        grpNames.forEach(gn => {
          const gm = sm.filter(m => (m.group?.name||'Group Stage') === gn)
            .sort((a,b) => {
              const dtA = a.date ? new Date(`${a.date}T${a.time||'00:00'}`).getTime() : 0
              const dtB = b.date ? new Date(`${b.date}T${b.time||'00:00'}`).getTime() : 0
              return dtA - dtB
            })
          if (gm.length) result.push({ label: gn, icon: '🏏', items: gm })
        })
      } else {
        const sorted = sm.sort((a,b) => {
          const dtA = a.date ? new Date(`${a.date}T${a.time||'00:00'}`).getTime() : 0
          const dtB = b.date ? new Date(`${b.date}T${b.time||'00:00'}`).getTime() : 0
          return dtA - dtB
        })
        result.push({ label: st.label, icon: st.icon, items: sorted })
      }
    })

    const sp = matches.filter(m => special.includes(m.status))
    if (sp.length) result.push({ label:'Postponed / Delayed / Cancelled', icon:'📅', items:sp })
    return result
  }, [matches])

  if (!matches.length) return (
    <div className="fade-up text-center py-20 text-[#4a5568]">
      <div className="text-4xl mb-3 opacity-30">📅</div><p className="text-sm">No matches scheduled yet</p>
    </div>
  )

  return (
    <div className="fade-up">
      <div className="px-4 py-3 flex items-center gap-2">
        <Calendar size={16} className="text-[#f0c040]" />
        <span className="font-display text-xl text-white tracking-wide">PPL 2026 Schedule</span>
      </div>

      {/* Search bar */}
      <div className="px-3 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#f0c040] focus:ring-2 focus:ring-[#f0c040]/20 transition-all shadow-sm"
            placeholder="Search team name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="px-3 mb-4">
          {searchResults.length === 0 ? (
            <div className="card py-6 text-center text-[#4a5568] text-sm">No matches found for "{search}"</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f0c040]/5 border-b border-[#f0c040]/10 flex items-center justify-between">
                <span className="font-display text-[#f0c040] tracking-wide">🔍 Results for "{search}"</span>
                <span className="text-[11px] text-[#4a5568]">{searchResults.length} match{searchResults.length!==1?'es':''}</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {searchResults.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full schedule (hidden when searching) */}
      {!search.trim() && (
        <div className="px-3 space-y-4 pb-6">
          {sections.map((sec, si) => (
            <div key={si} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f0c040]/5 border-b border-[#f0c040]/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{sec.icon}</span>
                  <span className="font-display text-[#f0c040] tracking-wide">{sec.label}</span>
                </div>
                <span className="text-[11px] text-[#4a5568] bg-white/[0.03] px-2 py-0.5 rounded-full">
                  {sec.items.length} match{sec.items.length!==1?'es':''}
                </span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {sec.items.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchRow({ match: m }: { match: any }) {
  const h   = m.highlights || {}
  const sc  = statusColor[m.status] || statusColor.upcoming
  const si  = statusIcon[m.status]  || '🕐'
  const sl  = statusLabel[m.status] || m.status
  const now = Date.now()
  const matchTime = m.date && m.time ? new Date(`${m.date}T${m.time}`).getTime() : 0
  const isReady   = m.status==='upcoming' && matchTime>0 && matchTime<=now+30*60*1000
  const isPast    = m.status==='upcoming' && matchTime>0 && matchTime<now

  return (
    <div className="px-4 py-3 flex gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5
        ${m.status==='live'?'bg-red-500/20 text-red-400 border border-red-500/30':isPast?'bg-amber-500/10 text-amber-400 border border-amber-500/20':'bg-white/[0.04] text-[#4a5568] border border-white/[0.06]'}`}>
        {m.matchNo||'—'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-white">{m.team1?.name}</div>
        <div className="text-[10px] text-[#4a5568] my-0.5">vs</div>
        <div className="font-semibold text-sm text-[#8892b0]">{m.team2?.name}</div>
        {(m.score1||m.score2) && <div className="text-[11px] font-mono text-[#f0c040] mt-1">{m.score1}{m.score2?` | ${m.score2}`:''}</div>}
        {m.result && m.status==='completed' && <div className="text-[11px] text-emerald-400 mt-0.5 font-semibold">✅ {m.result}</div>}
        {h.topBatter && <div className="text-[10px] text-[#f0c040] mt-0.5">🏏 {h.topBatter.name} {h.topBatter.runs}({h.topBatter.balls})</div>}
        {h.topBowler && <div className="text-[10px] text-red-400">🎯 {h.topBowler.name} {h.topBowler.wickets}/{h.topBowler.runs}</div>}
        {isReady && <span className="inline-block mt-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-semibold">⚡ Starting Soon</span>}
      </div>
      <div className="flex-shrink-0 text-right space-y-1 min-w-[72px]">
        {m.date && <div className="text-xs font-semibold text-white">{fmtDate(m.date)}</div>}
        {m.time && <div className="text-[11px] font-mono text-[#f0c040]">{fmtTime(m.time)}</div>}
        {m.year && <div className="text-[10px] text-[#4a5568]">{m.year}</div>}
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc}`}>
          {si} {sl}
        </span>
      </div>
    </div>
  )
}
