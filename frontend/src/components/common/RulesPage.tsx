import { useStore } from '../../store'
export default function RulesPage() {
  const { rules } = useStore()
  return (
    <div className="fade-up">
      <div className="px-4 py-3"><span className="font-display text-xl text-white tracking-wide">📋 Rules</span></div>
      {!rules.length && <div className="text-center py-16 text-[#4a5568]"><div className="text-4xl mb-3 opacity-30">📋</div><p className="text-sm">No rules added</p></div>}
      <div className="px-3 space-y-2 pb-6">
        {rules.map((r,i)=><div key={r.id} className="card flex gap-3 px-4 py-3">
          <span className="w-6 h-6 rounded-full bg-[#f0c040]/10 border border-[#f0c040]/15 flex items-center justify-center text-[11px] font-bold text-[#f0c040] flex-shrink-0 mt-0.5">{i+1}</span>
          <p className="text-sm text-[#8892b0] leading-relaxed">{r.content}</p>
        </div>)}
      </div>
    </div>
  )
}
