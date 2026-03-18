import { useStore } from '../../store'
export default function AboutPage() {
  const { teams, matches } = useStore()
  return (
    <div className="fade-up px-3 pb-6">
      <div className="mt-3 card-gold overflow-hidden">
        <div className="bg-gradient-to-br from-[#f0c040]/10 to-transparent p-6 text-center border-b border-[#f0c040]/10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ffd966] to-[#c8960a] flex items-center justify-center mx-auto mb-3 shadow-xl shadow-[#f0c040]/20">
            <span className="font-display text-[#040810] text-3xl">PPL</span>
          </div>
          <div className="font-display text-2xl text-[#f0c040] tracking-wide">Pattan Premier League</div>
          <p className="text-[#8892b0] text-sm mt-1">Since 2010 · 16th Edition · Kohistan, KPK</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-[#8892b0] leading-relaxed mb-4">The Pattan Premier League is the most prestigious cricket tournament in the Pattan region, uniting the community through the spirit of cricket since 2010.</p>
          <div className="grid grid-cols-2 gap-2">
            {[['Founded','2010'],['Edition','16th (2026)'],['Format','T10 Cricket'],['Location','Pattan, KPK'],['Teams',teams.length.toString()],['Matches',matches.length.toString()]].map(([l,v])=>(
              <div key={l} className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                <div className="text-[10px] text-[#4a5568] uppercase tracking-widest">{l}</div>
                <div className="font-semibold text-white text-sm mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
