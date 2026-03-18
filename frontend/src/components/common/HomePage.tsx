import { useStore } from '../../store'
import LiveCard from '../live/LiveCard'
import AdsSlider from './AdsSlider'
import NotifBanner from './NotifBanner'

function QuickCard({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:border-[#f0c040]/15 active:scale-95 transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-sm text-white">{label}</div>
      <div className="text-[11px] text-[#4a5568] mt-0.5">{sub}</div>
    </button>
  )
}

function HotPlayer() {
  const { live, matches, players } = useStore()
  const liveMatch = matches.find(m => m.status === 'live')

  if (liveMatch && live && live.matchId === liveMatch.id) {
    const batters = Object.values(live.batters || {}) as any[]
    if (live.striker?.name)    batters.push({ ...live.striker })
    if (live.nonstriker?.name) batters.push({ ...live.nonstriker })
    const uniqBat = batters.filter(b => b.name).reduce((acc: any, b: any) => {
      if (!acc[b.name] || (b.runs || 0) > (acc[b.name].runs || 0)) acc[b.name] = b
      return acc
    }, {})
    const hotBatter = Object.values(uniqBat).sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))[0] as any

    const bowlers = Object.values(live.bowlers || {}) as any[]
    if (live.currentBowler?.name) bowlers.push({ ...live.currentBowler })
    const uniqBowl = bowlers.filter(b => b.name && (b.ballsBowled || 0) > 0).reduce((acc: any, b: any) => {
      if (!acc[b.name] || (b.ballsBowled || 0) > (acc[b.name].ballsBowled || 0)) acc[b.name] = b
      return acc
    }, {})
    const hotBowler = Object.values(uniqBowl).sort((a: any, b: any) =>
      (b as any).wickets !== (a as any).wickets ? (b as any).wickets - (a as any).wickets : (a as any).economy - (b as any).economy
    )[0] as any

    const batterHot = hotBatter && ((hotBatter.runs || 0) >= 10 || (hotBatter.fours || 0) + (hotBatter.sixes || 0) >= 2)
    const bowlerHot = hotBowler && ((hotBowler.wickets || 0) >= 1 || (hotBowler.economy || 99) < 6)

    if (batterHot || bowlerHot) {
      const showBatter = !bowlerHot || (batterHot && (hotBatter.runs || 0) > (hotBowler.wickets || 0) * 15)
      return (
        <div className="mx-3 mb-3">
          <div className="font-display text-base text-white tracking-wide px-1 mb-2">🔥 Hot Player</div>
          <div className="card-gold flex items-center gap-4 p-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 ${showBatter ? "bg-gradient-to-br from-[#f0c040] to-[#c8960a]" : "bg-gradient-to-br from-red-600 to-red-900"}`}>
              {showBatter ? "🏏" : "🎳"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-amber-400 tracking-widest uppercase font-semibold">{showBatter ? "⚡ Live — On Fire" : "🎯 Live — Bowling Well"}</div>
              <div className="font-display text-lg text-white tracking-wide leading-tight">{showBatter ? hotBatter.name : hotBowler.name}</div>
              <div className="text-xs text-[#8892b0]">{liveMatch.team1?.name} vs {liveMatch.team2?.name}</div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {showBatter ? (
                <>
                  <div className="text-center"><div className="font-mono text-[#f0c040] font-black text-xl">{hotBatter.runs}</div><div className="text-[9px] text-[#4a5568] uppercase">Runs</div></div>
                  <div className="text-center"><div className="font-mono text-[#8892b0] font-bold text-sm">({hotBatter.balls})</div><div className="text-[9px] text-[#4a5568] uppercase">Balls</div></div>
                </>
              ) : (
                <>
                  <div className="text-center"><div className="font-mono text-red-400 font-black text-xl">{hotBowler.wickets}W</div><div className="text-[9px] text-[#4a5568] uppercase">Wkts</div></div>
                  <div className="text-center"><div className="font-mono text-[#8892b0] font-bold text-sm">{Number(hotBowler.economy || 0).toFixed(1)}</div><div className="text-[9px] text-[#4a5568] uppercase">Eco</div></div>
                </>
              )}
            </div>
          </div>
        </div>
      )
    }
  }

  const top = [...players].filter(p => p.runs > 0).sort((a, b) => (b.runs || 0) - (a.runs || 0))[0]
  if (!top) return null
  return (
    <div className="mx-3 mb-3">
      <div className="font-display text-base text-white tracking-wide px-1 mb-2">🏆 Top Scorer</div>
      <div className="card-gold flex items-center gap-4 p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6432] to-[#c83200] flex items-center justify-center text-3xl shadow-lg flex-shrink-0">{top.emoji || "🏏"}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-amber-400 tracking-widest uppercase font-semibold">🏏 Tournament Top Bat</div>
          <div className="font-display text-lg text-white tracking-wide leading-tight">{top.name}</div>
          <div className="text-xs text-[#8892b0]">{top.team?.name || "—"}</div>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="font-mono text-[#f0c040] font-black text-xl">{top.runs || 0}</div>
          <div className="text-[9px] text-[#4a5568] uppercase">Runs</div>
          {top.best && <div className="font-mono text-[#8892b0] text-xs mt-0.5">Best: {top.best}</div>}
        </div>
      </div>
    </div>
  )
}

function UpcomingMatchPoster() {
  const { matches } = useStore()
  const upcoming = matches
    .filter(m => m.status === "upcoming" && m.date)
    .sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime())[0]
  if (!upcoming) return null
  const matchTime = new Date(`${upcoming.date}T${upcoming.time || "00:00"}`).getTime()
  const isReady = matchTime <= Date.now() + 30 * 60 * 1000

  return (
    <div className="mx-3 mb-3">
      <div className="rounded-2xl overflow-hidden relative border border-emerald-500/20" style={{
        background: "linear-gradient(135deg, #0d1f0d 0%, #182b18 60%, #0d1f0d 100%)",
      }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -bottom-6 left-1/3 w-40 h-40 bg-orange-500/[0.08] rounded-full blur-2xl" />
          <div className="absolute -bottom-6 right-1/3 w-40 h-40 bg-red-500/[0.06] rounded-full blur-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        </div>
        {isReady
          ? <div className="absolute top-3 -left-5 bg-red-500 text-white font-display text-[9px] tracking-widest px-10 py-1 rotate-[-45deg] shadow-lg z-10">READY</div>
          : <div className="absolute top-3 -left-5 bg-emerald-400 text-[#040810] font-display text-[9px] tracking-widest px-10 py-1 rotate-[-45deg] z-10">NEXT</div>
        }
        <div className="px-4 py-3 relative">
          <div className="text-[11px] text-emerald-400 tracking-widest uppercase font-semibold mb-2 pl-4">
            {isReady ? "⚡ Starting Soon" : "Up Next"} · M{upcoming.matchNo} · {upcoming.stage?.toUpperCase()}
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl mb-1">{upcoming.team1?.emoji || "🏏"}</div>
              <div className="font-display text-sm text-white">{upcoming.team1?.name}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-[#4a5568]">VS</div>
              <div className="text-[10px] text-[#4a5568] mt-1">T{upcoming.overs || 10}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">{upcoming.team2?.emoji || "🏏"}</div>
              <div className="font-display text-sm text-white">{upcoming.team2?.name}</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs text-[#4a5568]">
            <span>📅 {upcoming.date || "TBD"}</span>
            <span>\u23F0 {upcoming.time || "TBD"}</span>
          </div>
          <div className="text-center mt-1 text-[11px] text-[#4a5568]">📍 Dildar Ahmed Cricket Ground</div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { teams, matches, players, live, setActiveTab } = useStore()
  const liveMatch = matches.find(m => m.status === "live")
  const completed = matches.filter(m => m.status === "completed").length

  return (
    <div className="fade-up pb-6">
      {/* Hero with flame glows */}
      <div className="relative overflow-hidden px-4 py-6" style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0f1628 60%, #161f38 100%)",
      }}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#f0c040]/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-500/[0.09] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-red-500/[0.07] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-1/2 right-0 w-24 h-24 bg-orange-400/[0.05] rounded-full blur-xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0c040]" />
            <span className="text-[10px] text-[#f0c040] font-semibold tracking-widest uppercase">Official App · PPL 2026</span>
          </div>
          <h1 className="font-display text-4xl text-white leading-[0.9] tracking-wide">
            Pattan<br /><span className="text-[#f0c040]">Premier</span><br />League
          </h1>
          <p className="text-[#8892b0] text-sm mt-2">📍 Dildar Ahmed Cricket Ground  ·  <span className="text-[#ffd966]">2026</span></p>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {([["Teams", teams.length], ["Matches", matches.length], ["Players", players.length], ["Done", completed]] as [string, number][]).map(([l, v]) => (
              <div key={l} className="bg-white/[0.04] border border-[#f0c040]/10 rounded-xl p-2 text-center">
                <div className="font-mono text-[#f0c040] font-bold text-lg leading-none">{v}</div>
                <div className="text-[9px] text-[#4a5568] uppercase tracking-widest mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {liveMatch && live && <div className="mt-3"><LiveCard /></div>}
      <div className="mt-3"><HotPlayer /></div>
      <UpcomingMatchPoster />
      <AdsSlider />
      <NotifBanner />

      <div className="px-3 mt-2">
        <div className="font-display text-base text-white tracking-wide px-1 mb-2">Quick Access</div>
        <div className="grid grid-cols-2 gap-2">
          <QuickCard icon="📅" label="Schedule"  sub="All fixtures"     onClick={() => setActiveTab("schedule")} />
          <QuickCard icon="🏆" label="Standings" sub="Points table"     onClick={() => setActiveTab("points")} />
          <QuickCard icon="🔢" label="Groups"    sub="Group tables"     onClick={() => setActiveTab("groups")} />
          <QuickCard icon="🛡" label="Teams"     sub="Squads & more"    onClick={() => setActiveTab("teams")} />
          <QuickCard icon="👤" label="Players"   sub="Stats leaders"    onClick={() => setActiveTab("players")} />
          <QuickCard icon="📊" label="Polls"     sub="Vote now!"        onClick={() => setActiveTab("polls")} />
          <QuickCard icon="📸" label="Gallery"   sub="Match photos"     onClick={() => setActiveTab("gallery")} />
          <QuickCard icon="📋" label="Rules"     sub="Tournament rules" onClick={() => setActiveTab("rules")} />
        </div>
      </div>

      <div className="mt-6 px-4 flex items-center justify-between text-[10px] text-[#4a5568]">
        <span className="font-display text-[#c8960a] tracking-widest">PPL 2026</span>
        <span>Pattan Premier League · Since 2010</span>
      </div>
    </div>
  )
}
