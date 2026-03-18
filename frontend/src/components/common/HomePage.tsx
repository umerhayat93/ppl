import { useStore } from '../../store'
import LiveCard from '../live/LiveCard'
import AdsSlider from './AdsSlider'
import NotifBanner from './NotifBanner'
import { getTeamStats } from '../../utils'

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

  // During live match — auto detect hot batter or bowler
  if (liveMatch && live && live.matchId === liveMatch.id) {
    // Hot batter: highest runs in current innings
    const batters = Object.values(live.batters || {}) as any[]
    if (live.striker?.name) batters.push({ ...live.striker })
    if (live.nonstriker?.name) batters.push({ ...live.nonstriker })

    // Filter unique by name, take highest runs
    const uniqueBatters = batters.filter((b: any) => b.name)
      .reduce((acc: any, b: any) => {
        if (!acc[b.name] || (b.runs || 0) > (acc[b.name].runs || 0)) acc[b.name] = b
        return acc
      }, {})

    const hotBatter = Object.values(uniqueBatters)
      .sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))[0] as any

    // Hot bowler: most wickets, or most dot balls (economy < 4 with balls bowled)
    const bowlers = Object.values(live.bowlers || {}) as any[]
    if (live.currentBowler?.name) bowlers.push({ ...live.currentBowler })

    const uniqueBowlers = bowlers.filter((b: any) => b.name && (b.ballsBowled || 0) > 0)
      .reduce((acc: any, b: any) => {
        if (!acc[b.name] || (b.ballsBowled || 0) > (acc[b.name].ballsBowled || 0)) acc[b.name] = b
        return acc
      }, {})

    const hotBowler = Object.values(uniqueBowlers)
      .sort((a: any, b: any) => {
        // Priority: wickets > economy (lower is better, min 3 balls)
        if ((b as any).wickets !== (a as any).wickets) return (b as any).wickets - (a as any).wickets
        return (a as any).economy - (b as any).economy
      })[0] as any

    // Decide who is hotter
    const batterHot = hotBatter && ((hotBatter.runs || 0) >= 15 || (hotBatter.fours || 0) + (hotBatter.sixes || 0) >= 2)
    const bowlerHot = hotBowler && ((hotBowler.wickets || 0) >= 1 || (hotBowler.economy || 99) < 6)

    if (batterHot || bowlerHot) {
      const showBatter = !bowlerHot || (batterHot && (hotBatter.runs || 0) > (hotBowler.wickets || 0) * 20)

      return (
        <div className="mx-3 mb-3">
          <div className="font-display text-base text-white tracking-wide px-1 mb-2">🔥 Hot Player</div>
          <div className="card-gold flex items-center gap-4 p-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 ${showBatter ? 'bg-gradient-to-br from-[#f0c040] to-[#c8960a]' : 'bg-gradient-to-br from-red-600 to-red-900'}`}>
              {showBatter ? '🏏' : '🎳'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-amber-400 tracking-widest uppercase font-semibold">
                {showBatter ? '⚡ Live — On Fire' : '🎯 Live — Bowling Well'}
              </div>
              <div className="font-display text-lg text-white tracking-wide leading-tight">
                {showBatter ? hotBatter.name : hotBowler.name}
              </div>
              <div className="text-xs text-[#8892b0]">{liveMatch.team1?.name} vs {liveMatch.team2?.name}</div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {showBatter ? (
                <>
                  <div className="text-center"><div className="font-mono text-[#f0c040] font-black text-xl">{hotBatter.runs}</div><div className="text-[9px] text-[#4a5568] uppercase">Runs</div></div>
                  <div className="text-center"><div className="font-mono text-[#8892b0] font-bold text-sm">({hotBatter.balls})</div><div className="text-[9px] text-[#4a5568] uppercase">Balls</div></div>
                  {(hotBatter.sixes || 0) > 0 && <div className="text-center"><div className="font-mono text-emerald-400 font-bold text-sm">{hotBatter.sixes}×6</div><div className="text-[9px] text-[#4a5568] uppercase">Sixes</div></div>}
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
    return null
  }

  // No live match — show top scorer from player stats
  const top = [...players].filter(p => p.runs > 0).sort((a, b) => (b.runs || 0) - (a.runs || 0))[0]
  if (!top) return null

  return (
    <div className="mx-3 mb-3">
      <div className="font-display text-base text-white tracking-wide px-1 mb-2">🏆 Top Scorer</div>
      <div className="card-gold flex items-center gap-4 p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6432] to-[#c83200] flex items-center justify-center text-3xl shadow-lg flex-shrink-0">{top.emoji || '🏏'}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-amber-400 tracking-widest uppercase font-semibold">🏏 Tournament Bat</div>
          <div className="font-display text-lg text-white tracking-wide leading-tight">{top.name}</div>
          <div className="text-xs text-[#8892b0]">{top.team?.name || '—'}</div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <div className="text-center"><div className="font-mono text-[#f0c040] font-black text-xl">{top.runs || 0}</div><div className="text-[9px] text-[#4a5568] uppercase">Runs</div></div>
          {top.best && <div className="text-center"><div className="font-mono text-[#8892b0] font-bold text-sm">{top.best}</div><div className="text-[9px] text-[#4a5568] uppercase">Best</div></div>}
        </div>
      </div>
    </div>
  )
}

function UpcomingMatchPoster() {
  const { matches } = useStore()
  const now = Date.now()

  // Get nearest upcoming match by date+time
  const upcoming = matches
    .filter(m => m.status === 'upcoming' && m.date)
    .sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time || '00:00'}`).getTime()
      const dtB = new Date(`${b.date}T${b.time || '00:00'}`).getTime()
      return dtA - dtB
    })[0]

  if (!upcoming) return null

  const matchTime = new Date(`${upcoming.date}T${upcoming.time || '00:00'}`).getTime()
  const isReady = matchTime <= now + 30 * 60 * 1000 // within 30 min

  return (
    <div className="mx-3 mb-3">
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1f0d] to-[#182b18] border border-emerald-500/20 overflow-hidden relative">
        {isReady
          ? <div className="absolute top-3 -left-5 bg-red-500 text-white font-display text-[9px] tracking-widest px-10 py-1 rotate-[-45deg] shadow-lg">READY</div>
          : <div className="absolute top-3 -left-5 bg-emerald-400 text-[#040810] font-display text-[9px] tracking-widest px-10 py-1 rotate-[-45deg]">NEXT</div>
        }
        <div className="px-4 py-3">
          <div className="text-[11px] text-emerald-400 tracking-widest uppercase font-semibold mb-2 pl-4">
            {isReady ? '⚡ Starting Soon' : 'Up Next'} · M{upcoming.matchNo} · {upcoming.stage?.toUpperCase()}
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl mb-1">{upcoming.team1?.emoji || '🏏'}</div>
              <div className="font-display text-sm text-white">{upcoming.team1?.name}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-[#4a5568]">VS</div>
              <div className="text-[10px] text-[#4a5568] mt-1">T{upcoming.overs || 10}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">{upcoming.team2?.emoji || '🏏'}</div>
              <div className="font-display text-sm text-white">{upcoming.team2?.name}</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs text-[#4a5568]">
            <span>📅 {upcoming.date || 'TBD'}</span>
            <span>⏰ {upcoming.time || 'TBD'}</span>
          </div>
          <div className="text-center mt-1 text-[11px] text-[#4a5568]">📍 {upcoming.venue || 'Pattan Cricket Ground'}</div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { teams, matches, players, live, setActiveTab } = useStore()
  const liveMatch  = matches.find(m => m.status === 'live')
  const completed  = matches.filter(m => m.status === 'completed').length

  return (
    <div className="fade-up pb-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#0f1628] to-[#161f38] px-4 py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0c040]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0c040]" />
            <span className="text-[10px] text-[#f0c040] font-semibold tracking-widest uppercase">Official App · PPL 2026</span>
          </div>
          <h1 className="font-display text-4xl text-white leading-[0.9] tracking-wide">
            Pattan<br /><span className="text-[#f0c040]">Premier</span><br />League
          </h1>
          <p className="text-[#8892b0] text-sm mt-2">📍 Pattan Cricket Ground &nbsp;·&nbsp; <span className="text-[#ffd966]">2026</span></p>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {([['Teams', teams.length], ['Matches', matches.length], ['Players', players.length], ['Done', completed]] as [string, number][]).map(([l, v]) => (
              <div key={l} className="bg-white/[0.04] border border-[#f0c040]/10 rounded-xl p-2 text-center">
                <div className="font-mono text-[#f0c040] font-bold text-lg leading-none">{v}</div>
                <div className="text-[9px] text-[#4a5568] uppercase tracking-widest mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live card */}
      {liveMatch && live && <div className="mt-3"><LiveCard /></div>}

      {/* Upcoming match poster — always show below live/hero */}
      <div className="mt-3"><UpcomingMatchPoster /></div>

      {/* Ads */}
      <div className="mt-0"><AdsSlider /></div>

      {/* Notification permission */}
      <NotifBanner />

      {/* Hot player - auto from live or top scorer */}
      <HotPlayer />

      {/* Quick access */}
      <div className="px-3">
        <div className="font-display text-base text-white tracking-wide px-1 mb-2">Quick Access</div>
        <div className="grid grid-cols-2 gap-2">
          <QuickCard icon="📅" label="Schedule"  sub="All fixtures"    onClick={() => setActiveTab('schedule')} />
          <QuickCard icon="🏆" label="Standings" sub="Points table"    onClick={() => setActiveTab('points')} />
          <QuickCard icon="🔢" label="Groups"    sub="Group tables"    onClick={() => setActiveTab('groups')} />
          <QuickCard icon="🛡" label="Teams"     sub="Squads & more"   onClick={() => setActiveTab('teams')} />
          <QuickCard icon="👤" label="Players"   sub="Stats leaders"   onClick={() => setActiveTab('players')} />
          <QuickCard icon="📊" label="Polls"     sub="Vote now!"       onClick={() => setActiveTab('polls')} />
          <QuickCard icon="📸" label="Gallery"   sub="Match photos"    onClick={() => setActiveTab('gallery')} />
          <QuickCard icon="📋" label="Rules"     sub="Tournament rules" onClick={() => setActiveTab('rules')} />
        </div>
      </div>

      <div className="mt-6 px-4 flex items-center justify-between text-[10px] text-[#4a5568]">
        <span className="font-display text-[#c8960a] tracking-widest">PPL 2026</span>
        <span>Pattan Premier League · Since 2010</span>
      </div>
    </div>
  )
}
