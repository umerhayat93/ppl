import { useStore } from '../../store'
import { getTeamStats, groupColor } from '../../utils'

export default function GroupsPage() {
  const { groups, teams, matches } = useStore()
  return (
    <div className="fade-up">
      <div className="px-4 py-3"><span className="font-display text-xl text-white tracking-wide">🔢 Group Stage</span></div>
      <div className="px-3 space-y-4 pb-6">
        {!groups.length && <div className="text-center py-16 text-[#4a5568]"><div className="text-4xl mb-3 opacity-30">🔢</div><p className="text-sm">No groups yet</p></div>}
        {groups.map(g => {
          const gc = groupColor[g.color||'gold']
          const gt = teams.filter(t=>t.groupId===g.id)
          const rows = gt.map(t=>({...t,...getTeamStats(t.name,matches)})).sort((a,b)=>b.pts-a.pts||b.nrrNum-a.nrrNum)
          return (
            <div key={g.id} className={`card overflow-hidden border ${gc.ring}`}>
              <div className={`px-4 py-2.5 border-b ${gc.bg} ${gc.ring} flex justify-between`}>
                <span className={`font-display tracking-wide ${gc.text}`}>{g.name}</span>
                <span className="text-[11px] text-[#4a5568]">{gt.length} Teams</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/[0.04]">
                    {['#','Team','P','W','L','NRR','Pts'].map((h,i)=>(
                      <th key={h} className={`py-2 px-2 text-[10px] text-[#4a5568] uppercase tracking-widest font-semibold ${i===1?'text-left':'text-center'}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rows.length ? rows.map((r,i)=>(
                      <tr key={r.id} className="border-b border-white/[0.02] last:border-0">
                        <td className="py-2.5 px-2 text-center"><span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${i<2?gc.text+' '+gc.bg:'text-[#4a5568]'}`}>{i+1}</span></td>
                        <td className="py-2.5 px-2 font-semibold text-white">{r.emoji} {r.name}{i<2&&<span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}</td>
                        <td className="py-2.5 px-2 text-center text-[#8892b0]">{r.played}</td>
                        <td className="py-2.5 px-2 text-center text-emerald-400 font-semibold">{r.won}</td>
                        <td className="py-2.5 px-2 text-center text-red-400">{r.lost}</td>
                        <td className={`py-2.5 px-2 text-center font-mono text-[11px] ${r.nrrNum>0?'text-emerald-400':r.nrrNum<0?'text-red-400':'text-[#4a5568]'}`}>{r.nrr}</td>
                        <td className="py-2.5 px-2 text-center"><span className={`font-mono font-black text-sm ${gc.text}`}>{r.pts}</span></td>
                      </tr>
                    )) : <tr><td colSpan={7} className="py-4 text-center text-[#4a5568] text-xs">No teams</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        <p className="text-[11px] text-[#4a5568] px-1">🟢 Top 2 per group qualify · NRR per ICC formula</p>
      </div>
    </div>
  )
}
