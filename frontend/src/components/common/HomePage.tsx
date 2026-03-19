import { useStore } from '../../store'
import LiveCard from '../live/LiveCard'
import AdsSlider from './AdsSlider'
import NotifBanner from './NotifBanner'

function QuickCard({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="active:scale-95 transition-all text-left p-4 rounded-2xl"
      style={{ background: '#160a2e', border: '1px solid rgba(147,51,234,0.12)' }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-sm" style={{ color: '#f0e6ff' }}>{label}</div>
      <div className="text-[11px] mt-0.5" style={{ color: '#7c5fa0' }}>{sub}</div>
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
          <div className="font-display text-base tracking-wide px-1 mb-2" style={{ color: '#f0e6ff' }}>🔥 Hot Player</div>
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1060 100%)',
            border: '1px solid rgba(249,115,22,0.3)',
            boxShadow: '0 0 20px rgba(249,115,22,0.08)',
          }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
              style={{ background: showBatter ? 'linear-gradient(135deg, #d4a017, #f97316)' : 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
              {showBatter ? '🏏' : '🎳'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: '#f97316' }}>
                {showBatter ? '⚡ Live — On Fire' : '🎯 Live — Bowling Well'}
              </div>
              <div className="font-display text-lg tracking-wide leading-tight" style={{ color: '#f0e6ff' }}>
                {showBatter ? hotBatter.name : hotBowler.name}
              </div>
              <div className="text-xs" style={{ color: '#7c5fa0' }}>{liveMatch.team1?.name} vs {liveMatch.team2?.name}</div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {showBatter ? (
                <>
                  <div className="text-center"><div className="font-mono font-black text-xl" style={{ color: '#d4a017' }}>{hotBatter.runs}</div><div className="text-[9px] uppercase" style={{ color: '#7c5fa0' }}>Runs</div></div>
                  <div className="text-center"><div className="font-mono font-bold text-sm" style={{ color: '#a78bcf' }}>({hotBatter.balls})</div><div className="text-[9px] uppercase" style={{ color: '#7c5fa0' }}>Balls</div></div>
                </>
              ) : (
                <>
                  <div className="text-center"><div className="font-mono font-black text-xl" style={{ color: '#f97316' }}>{hotBowler.wickets}W</div><div className="text-[9px] uppercase" style={{ color: '#7c5fa0' }}>Wkts</div></div>
                  <div className="text-center"><div className="font-mono font-bold text-sm" style={{ color: '#a78bcf' }}>{Number(hotBowler.economy || 0).toFixed(1)}</div><div className="text-[9px] uppercase" style={{ color: '#7c5fa0' }}>Eco</div></div>
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
      <div className="font-display text-base tracking-wide px-1 mb-2" style={{ color: '#f0e6ff' }}>🏆 Top Scorer</div>
      <div className="flex items-center gap-4 p-4 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #160a2e, #1e0f3d)',
        border: '1px solid rgba(212,160,23,0.25)',
      }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #9333ea, #6b21a8)' }}>
          {top.emoji || '🏏'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: '#d4a017' }}>🏏 Tournament Top Bat</div>
          <div className="font-display text-lg tracking-wide leading-tight" style={{ color: '#f0e6ff' }}>{top.name}</div>
          <div className="text-xs" style={{ color: '#7c5fa0' }}>{top.team?.name || '—'}</div>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="font-mono font-black text-xl" style={{ color: '#d4a017' }}>{top.runs || 0}</div>
          <div className="text-[9px] uppercase" style={{ color: '#7c5fa0' }}>Runs</div>
          {top.best && <div className="font-mono text-xs mt-0.5" style={{ color: '#a78bcf' }}>Best: {top.best}</div>}
        </div>
      </div>
    </div>
  )
}

function UpcomingMatchPoster() {
  const { matches } = useStore()
  const upcoming = matches
    .filter(m => m.status === 'upcoming' && m.date)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime())[0]
  if (!upcoming) return null
  const matchTime = new Date(`${upcoming.date}T${upcoming.time || '00:00'}`).getTime()
  const isReady = matchTime <= Date.now() + 30 * 60 * 1000

  return (
    <div className="mx-3 mb-3">
      <div className="rounded-2xl overflow-hidden relative" style={{
        background: 'linear-gradient(135deg, #0d0520 0%, #1a0a2e 60%, #0d0520 100%)',
        border: '1px solid rgba(147,51,234,0.25)',
        boxShadow: '0 0 30px rgba(147,51,234,0.08)',
      }}>
        {/* Fire glows inside poster */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -bottom-8 left-1/3 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 right-1/3 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.5), transparent)' }} />
        </div>
        {isReady
          ? <div className="absolute top-3 -left-5 font-display text-[9px] tracking-widest px-10 py-1 rotate-[-45deg] shadow-lg z-10 text-white" style={{ background: '#dc2626' }}>READY</div>
          : <div className="absolute top-3 -left-5 font-display text-[9px] tracking-widest px-10 py-1 rotate-[-45deg] z-10" style={{ background: '#d4a017', color: '#0d0520' }}>NEXT</div>
        }
        <div className="px-4 py-3 relative">
          <div className="text-[11px] tracking-widest uppercase font-semibold mb-2 pl-4" style={{ color: '#9333ea' }}>
            {isReady ? '⚡ Starting Soon' : 'Up Next'} · M{upcoming.matchNo} · {upcoming.stage?.toUpperCase()}
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center"><div className="text-3xl mb-1">{upcoming.team1?.emoji || '🏏'}</div><div className="font-display text-sm" style={{ color: '#f0e6ff' }}>{upcoming.team1?.name}</div></div>
            <div className="text-center"><div className="font-display text-2xl" style={{ color: '#4a3060' }}>VS</div><div className="text-[10px] mt-1" style={{ color: '#4a3060' }}>T{upcoming.overs || 10}</div></div>
            <div className="text-center"><div className="text-3xl mb-1">{upcoming.team2?.emoji || '🏏'}</div><div className="font-display text-sm" style={{ color: '#f0e6ff' }}>{upcoming.team2?.name}</div></div>
          </div>
          <div className="flex justify-center gap-4 mt-3 text-xs" style={{ color: '#7c5fa0' }}>
            <span>📅 {upcoming.date || 'TBD'}</span>
            <span>⏰ {upcoming.time || 'TBD'}</span>
          </div>
          <div className="text-center mt-1 text-[11px]" style={{ color: '#7c5fa0' }}>📍 Dildar Ahmed Cricket Ground</div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { teams, matches, players, live, setActiveTab } = useStore()
  const liveMatch = matches.find(m => m.status === 'live')
  const completed = matches.filter(m => m.status === 'completed').length

  return (
    <div className="fade-up pb-6">
      {/* ── Hero with PSL logo + fire theme ── */}
      <div className="relative overflow-hidden px-4 py-6" style={{
        background: 'linear-gradient(160deg, #0d0520 0%, #1a0540 50%, #0d0520 100%)',
      }}>
        {/* Background glows */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3"
          style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl pointer-events-none fire-glow"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-2xl pointer-events-none fire-glow"
          style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.08) 0%, transparent 70%)', animationDelay: '1s' }} />

        <div className="relative flex items-start gap-4">
          {/* PSL Logo in hero */}
          <div className="flex-shrink-0">
            <img src="/icons/icon-192.png" alt="PSL" className="w-20 h-20 rounded-2xl object-cover splash-flame"
              style={{ boxShadow: '0 0 24px rgba(147,51,234,0.5), 0 0 48px rgba(249,115,22,0.2)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2"
              style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4a017' }} />
              <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#d4a017' }}>Official App · 2026</span>
            </div>
            <h1 className="font-display text-4xl leading-[0.9] tracking-wide" style={{ color: '#f0e6ff' }}>
              Pattan<br />
              <span style={{
                background: 'linear-gradient(135deg, #d4a017, #f0c040, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Premier</span><br />League
            </h1>
            <p className="text-sm mt-2" style={{ color: '#7c5fa0' }}>📍 Dildar Ahmed Cricket Ground · <span style={{ color: '#d4a017' }}>2026</span></p>
          </div>
        </div>

        {/* Stat cards with gold top border */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {([['Teams', teams.length], ['Matches', matches.length], ['Players', players.length], ['Done', completed]] as [string, number][]).map(([l, v]) => (
            <div key={l} className="rounded-xl p-2.5 text-center" style={{
              background: 'rgba(147,51,234,0.06)',
              borderTop: '2px solid rgba(212,160,23,0.4)',
              border: '1px solid rgba(147,51,234,0.15)',
              borderTopColor: 'rgba(212,160,23,0.4)',
            }}>
              <div className="font-mono font-bold text-lg leading-none" style={{ color: '#d4a017' }}>{v}</div>
              <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#7c5fa0' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layout: Live → Hot Player → Upcoming → Ads */}
      {liveMatch && live && <div className="mt-3"><LiveCard /></div>}
      <div className="mt-3"><HotPlayer /></div>
      <UpcomingMatchPoster />
      <AdsSlider />
      <NotifBanner />

      {/* Quick access */}
      <div className="px-3 mt-2">
        <div className="font-display text-base tracking-wide px-1 mb-2" style={{ color: '#f0e6ff' }}>Quick Access</div>
        <div className="grid grid-cols-2 gap-2">
          <QuickCard icon="📅" label="Schedule"  sub="All fixtures"     onClick={() => setActiveTab('schedule')} />
          <QuickCard icon="🏆" label="Standings" sub="Points table"     onClick={() => setActiveTab('points')} />
          <QuickCard icon="🔢" label="Groups"    sub="Group tables"     onClick={() => setActiveTab('groups')} />
          <QuickCard icon="🛡" label="Teams"     sub="Squads & more"    onClick={() => setActiveTab('teams')} />
          <QuickCard icon="👤" label="Players"   sub="Stats leaders"    onClick={() => setActiveTab('players')} />
          <QuickCard icon="📊" label="Polls"     sub="Vote now!"        onClick={() => setActiveTab('polls')} />
          <QuickCard icon="📸" label="Gallery"   sub="Match photos"     onClick={() => setActiveTab('gallery')} />
          <QuickCard icon="📋" label="Rules"     sub="Tournament rules" onClick={() => setActiveTab('rules')} />
        </div>
      </div>

      <div className="mt-6 px-4 flex items-center justify-between text-[10px]" style={{ color: '#4a3060' }}>
        <span className="font-display tracking-widest" style={{ color: '#d4a017' }}>PPL 2026</span>
        <span>Pattan Premier League · Since 2010</span>
      </div>
    </div>
  )
}
