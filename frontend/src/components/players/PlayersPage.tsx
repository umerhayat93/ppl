import { useState } from 'react'
import { useStore } from '../../store'

const TABS = [
  { id:'batting', label:'Batting' },
  { id:'bowling', label:'Bowling' },
  { id:'allround', label:'All-Round' },
]

export default function PlayersPage() {
  const { players } = useStore()
  const [tab, setTab] = useState('batting')

  const list = [...players].filter(p => {
    if (tab==='batting')  return p.role==='batting'||p.role==='wk'||p.role==='allround'
    if (tab==='bowling')  return p.role==='bowling'||p.role==='allround'
    return p.role==='allround'
  }).sort((a,b) => tab==='bowling' ? (b.wickets||0)-(a.wickets||0) : (b.runs||0)-(a.runs||0))

  return (
    <div className="fade-up">
      <div className="px-4 py-3">
        <span className="font-display text-xl text-white tracking-wide">Player Stats</span>
      </div>
      {/* Filter tabs */}
      <div className="px-3 flex gap-2 mb-3">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${tab===t.id?'bg-[#f0c040]/15 text-[#f0c040] border border-[#f0c040]/25':'bg-white/[0.03] text-[#8892b0] border border-white/[0.06] hover:border-white/10'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="text-center py-16 text-[#4a5568]">
          <div className="text-4xl mb-3 opacity-30">👤</div><p className="text-sm">No players yet</p>
        </div>
      )}

      <div className="px-3 space-y-2 pb-6">
        {list.map((p, i) => (
          <div key={p.id} className="card flex items-center gap-3 px-4 py-3">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i===0?'bg-[#f0c040]/20 text-[#f0c040]':i===1?'bg-white/10 text-white':i===2?'bg-amber-700/20 text-amber-600':'bg-white/[0.03] text-[#4a5568]'}`}>{i+1}</span>
            <span className="text-2xl flex-shrink-0">{p.emoji||'🏏'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white flex items-center gap-1">
                {p.name}{i===0&&<span>🔥</span>}
              </div>
              <div className="text-[11px] text-[#4a5568]">{p.team?.name||'—'} · {p.role==='batting'?'Bat':p.role==='bowling'?'Bowl':p.role==='wk'?'WK-Bat':'AR'}</div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {tab!=='bowling' && <div className="text-right"><div className="font-mono font-bold text-[#f0c040] text-sm">{p.runs||0}</div><div className="text-[9px] text-[#4a5568] uppercase">Runs</div></div>}
              {tab!=='batting' && <div className="text-right"><div className="font-mono font-bold text-red-400 text-sm">{p.wickets||0}W</div><div className="text-[9px] text-[#4a5568] uppercase">Wkts</div></div>}
              {p.best && <div className="text-right"><div className="font-mono font-bold text-[#8892b0] text-xs">{p.best}</div><div className="text-[9px] text-[#4a5568] uppercase">Best</div></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
