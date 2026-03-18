import { useStore } from '../../store'
export default function OrgsPage() {
  const { orgs } = useStore()
  return (
    <div className="fade-up">
      <div className="px-4 py-3"><span className="font-display text-xl text-white tracking-wide">🎖 Officials</span></div>
      {!orgs.length && <div className="text-center py-16 text-[#4a5568]"><div className="text-4xl mb-3 opacity-30">🎖</div><p className="text-sm">No officials listed</p></div>}
      <div className="px-3 space-y-2 pb-6">
        {orgs.map(o=><div key={o.id} className="card flex items-center gap-4 px-4 py-3">
          <div className="w-12 h-12 rounded-xl bg-[#f0c040]/10 border border-[#f0c040]/20 flex items-center justify-center text-2xl flex-shrink-0">{o.emoji}</div>
          <div className="flex-1 min-w-0"><div className="font-semibold text-white text-sm">{o.name}</div><div className="text-xs text-[#8892b0]">{o.role}</div>{o.since&&<div className="text-[11px] text-[#4a5568]">Since {o.since}</div>}</div>
        </div>)}
      </div>
    </div>
  )
}
