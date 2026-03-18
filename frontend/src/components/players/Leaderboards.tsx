import { useStore } from '../../store'
import { Trophy, Target } from 'lucide-react'

export default function Leaderboards() {
  const { players } = useStore()
  const topBat  = [...players].sort((a,b)=>(b.runs||0)-(a.runs||0)).slice(0,5)
  const topBowl = [...players].filter(p=>p.wickets>0||p.role==='bowling'||p.role==='allround').sort((a,b)=>(b.wickets||0)-(a.wickets||0)).slice(0,5)

  return (
    <div className="space-y-3 pb-4">
      <div className="px-4 pt-2">
        <span className="font-display text-xl text-white tracking-wide">📊 Leaderboards</span>
      </div>
      <LeaderTable icon={<Trophy size={13} className="text-[#f0c040]" />} title="Top Batters" rows={topBat} type="bat" />
      <LeaderTable icon={<Target size={13} className="text-red-400" />}   title="Top Bowlers" rows={topBowl} type="bowl" />
    </div>
  )
}

function LeaderTable({ icon, title, rows, type }: { icon:any; title:string; rows:any[]; type:'bat'|'bowl' }) {
  if (!rows.length) return null
  return (
    <div className="mx-3 card overflow-hidden">
      <div className={`px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2 ${type==='bat'?'bg-[#f0c040]/5':'bg-red-500/5'}`}>
        {icon}
        <span className={`text-[11px] tracking-widest uppercase font-semibold ${type==='bat'?'text-[#f0c040]':'text-red-400'}`}>{title}</span>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {rows.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${i===0?'bg-[#f0c040]/20 text-[#f0c040]':i===1?'bg-white/10 text-white':'bg-white/5 text-[#4a5568]'}`}>{i+1}</span>
            <span className="text-xl leading-none flex-shrink-0">{p.emoji||'🏏'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white truncate">{p.name}{i===0?' 🔥':''}</div>
              <div className="text-[11px] text-[#4a5568] truncate">{p.team?.name||'—'}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-mono font-bold text-base ${type==='bat'?'text-[#f0c040]':'text-red-400'}`}>
                {type==='bat' ? p.runs : `${p.wickets}W`}
              </div>
              <div className="text-[10px] text-[#4a5568]">{type==='bat'?`SR:${p.strikeRate||0}`:`Eco:${p.economy?.toFixed(1)||'—'}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
