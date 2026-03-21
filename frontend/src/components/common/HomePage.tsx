import React from 'react'
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

function fmtDateFull(d: string) {
  if (!d) return '—'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
  } catch { return d }
}
function fmtTimeFull(t: string) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  return `${+h % 12 || 12}:${m} ${+h >= 12 ? 'PM' : 'AM'}`
}

function MatchPosterModal({ match: m, onClose }: { match: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>

      {/* Poster — square-ish for Facebook sharing */}
      <div className="w-full max-w-sm relative" onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm flex items-center gap-1">
          ✕ Close
        </button>

        {/* Share hint */}
        <p className="text-center text-[11px] mb-2 tracking-widest uppercase" style={{ color: '#7c5fa0' }}>
          📤 Screenshot &amp; share on Facebook
        </p>

        {/* THE POSTER */}
        <div className="rounded-3xl overflow-hidden relative" style={{
          background: 'linear-gradient(160deg, #0d0520 0%, #1a0540 40%, #0d0520 100%)',
          border: '2px solid rgba(212,160,23,0.4)',
          boxShadow: '0 0 60px rgba(147,51,234,0.4), 0 0 120px rgba(249,115,22,0.15)',
        }}>

          {/* Background fire glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.1) 0%, transparent 70%)' }} />
            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #d4a017, #f97316, #d4a017, transparent)' }} />
            {/* Gold bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #d4a017, #f97316, #d4a017, transparent)' }} />
          </div>

          <div className="relative px-6 py-7">
            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-6">
              <img src="/icons/icon-192.png" alt="PPL" className="w-16 h-16 rounded-2xl mb-3 splash-flame"
                style={{ boxShadow: '0 0 20px rgba(147,51,234,0.5)' }} />
              <div className="font-display tracking-[0.2em] text-center" style={{
                fontSize: '1.4rem',
                background: 'linear-gradient(135deg, #d4a017, #f0c040, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                PATTAN PREMIER LEAGUE
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase mt-0.5" style={{ color: '#7c5fa0' }}>
                Official Match
              </div>
            </div>

            {/* Match number badge */}
            <div className="flex justify-center mb-5">
              <div className="px-5 py-1.5 rounded-full font-display tracking-widest text-xs" style={{
                background: 'linear-gradient(135deg, #6b21a8, #9333ea)',
                color: '#f0e6ff',
                border: '1px solid rgba(147,51,234,0.4)',
                boxShadow: '0 0 16px rgba(147,51,234,0.3)',
              }}>
                MATCH {m.matchNo || '—'} · {(m.stage || 'GROUP').toUpperCase()} STAGE
              </div>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between mb-6 px-2">
              {/* Team 1 */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ background: 'rgba(147,51,234,0.15)', border: '2px solid rgba(147,51,234,0.3)' }}>
                  {m.team1?.emoji || '🏏'}
                </div>
                <div className="font-display text-center leading-tight" style={{ color: '#f0e6ff', fontSize: '0.95rem', maxWidth: '90px' }}>
                  {m.team1?.name || '—'}
                </div>
              </div>

              {/* VS center */}
              <div className="flex flex-col items-center px-2">
                <div className="font-display text-3xl font-black" style={{
                  background: 'linear-gradient(135deg, #d4a017, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>VS</div>
                <div className="text-[10px] tracking-widest mt-1" style={{ color: '#4a3060' }}>
                  T{m.overs || 10}
                </div>
              </div>

              {/* Team 2 */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ background: 'rgba(212,160,23,0.12)', border: '2px solid rgba(212,160,23,0.3)' }}>
                  {m.team2?.emoji || '🏏'}
                </div>
                <div className="font-display text-center leading-tight" style={{ color: '#f0e6ff', fontSize: '0.95rem', maxWidth: '90px' }}>
                  {m.team2?.name || '—'}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-4 mb-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />

            {/* Date Time Venue */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(147,51,234,0.07)', border: '1px solid rgba(147,51,234,0.12)' }}>
                <span className="text-lg">📅</span>
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: '#7c5fa0' }}>Date</div>
                  <div className="font-semibold text-sm" style={{ color: '#f0e6ff' }}>{fmtDateFull(m.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                <span className="text-lg">⏰</span>
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: '#7c5fa0' }}>Time</div>
                  <div className="font-semibold text-sm" style={{ color: '#f97316' }}>{fmtTimeFull(m.time)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.12)' }}>
                <span className="text-lg">📍</span>
                <div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: '#7c5fa0' }}>Venue</div>
                  <div className="font-semibold text-sm" style={{ color: '#d4a017' }}>{m.venue || 'Dildar Ahmed Cricket Ground'}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="h-px flex-1" style={{ background: 'rgba(147,51,234,0.2)' }} />
              <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: '#7c5fa0' }}>
                ppl2026.onrender.com
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(147,51,234,0.2)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingMatchPoster() {
  const { matches } = useStore()
  const [showPoster, setShowPoster] = React.useState(false)
  const upcoming = matches
    .filter(m => m.status === 'upcoming' && m.date)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime())[0]
  if (!upcoming) return null
  const matchTime = new Date(`${upcoming.date}T${upcoming.time || '00:00'}`).getTime()
  const isReady = matchTime <= Date.now() + 30 * 60 * 1000

  return (
    <>
      {showPoster && <MatchPosterModal match={upcoming} onClose={() => setShowPoster(false)} />}

      <div className="mx-3 mb-3">
        <div className="rounded-2xl overflow-hidden relative cursor-pointer active:scale-[0.99] transition-all"
          onClick={() => setShowPoster(true)}
          style={{
            background: 'linear-gradient(135deg, #0d0520 0%, #1a0a2e 60%, #0d0520 100%)',
            border: '1px solid rgba(147,51,234,0.25)',
            boxShadow: '0 0 30px rgba(147,51,234,0.08)',
          }}>
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
            <div className="flex items-center justify-between mb-2 pl-4">
              <div className="text-[11px] tracking-widest uppercase font-semibold" style={{ color: '#9333ea' }}>
                {isReady ? '⚡ Starting Soon' : 'Up Next'} · M{upcoming.matchNo}
              </div>
              <div className="text-[10px] flex items-center gap-1" style={{ color: '#7c5fa0' }}>
                <span>📤</span><span>Tap to share poster</span>
              </div>
            </div>
            <div className="flex items-center justify-around">
              <div className="text-center"><div className="text-3xl mb-1">{upcoming.team1?.emoji || '🏏'}</div><div className="font-display text-sm" style={{ color: '#f0e6ff' }}>{upcoming.team1?.name}</div></div>
              <div className="text-center"><div className="font-display text-2xl" style={{ color: '#4a3060' }}>VS</div><div className="text-[10px] mt-1" style={{ color: '#4a3060' }}>T{upcoming.overs || 10}</div></div>
              <div className="text-center"><div className="text-3xl mb-1">{upcoming.team2?.emoji || '🏏'}</div><div className="font-display text-sm" style={{ color: '#f0e6ff' }}>{upcoming.team2?.name}</div></div>
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs" style={{ color: '#7c5fa0' }}>
              <span>📅 {upcoming.date || 'TBD'}</span>
              <span>⏰ {fmtTimeFull(upcoming.time)}</span>
            </div>
            <div className="text-center mt-1 text-[11px]" style={{ color: '#7c5fa0' }}>📍 {upcoming.venue || 'Dildar Ahmed Cricket Ground'}</div>
          </div>
        </div>
      </div>
    </>
  )
}


// ── Sponsor Page Modal ────────────────────────────────────────────
function SponsorPage({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0d0520 0%, #1a0540 50%, #0d0520 100%)' }}>

      {/* Header — fixed at top */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(13,5,32,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(147,51,234,0.15)' }}>
        <button onClick={onClose} className="flex items-center gap-2 text-sm" style={{ color: '#7c5fa0' }}>
          ← Back
        </button>
        <span className="font-display text-sm tracking-wider" style={{ color: '#d4a017' }}>Official Sponsor</span>
        <div className="w-12" />
      </div>

      {/* Scrollable content — full remaining height */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="px-4 pb-16">

        {/* Hero banner */}
        <div className="relative rounded-3xl overflow-hidden mt-4 mb-5" style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #0a1628 100%)',
          border: '2px solid rgba(212,160,23,0.3)',
          boxShadow: '0 0 60px rgba(212,160,23,0.1)',
        }}>
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />
          </div>
          <div className="relative px-6 py-8 text-center">
            {/* Hospital icon */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', border: '2px solid rgba(37,99,235,0.4)', boxShadow: '0 0 24px rgba(37,99,235,0.3)' }}>
              🏥
            </div>
            <div className="font-display text-xl tracking-wide mb-1" style={{
              background: 'linear-gradient(135deg, #d4a017, #f0c040)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Kohistan Medical &
            </div>
            <div className="font-display text-xl tracking-wide mb-2" style={{
              background: 'linear-gradient(135deg, #d4a017, #f0c040)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Surgical Complex
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3" style={{
              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              border: '1px solid rgba(37,99,235,0.4)',
            }}>
              <span className="text-sm">💳</span>
              <span className="text-sm font-semibold tracking-wide" style={{ color: '#93c5fd' }}>Sehat Card Plus</span>
            </div>
            <p className="text-sm" style={{ color: '#7c5fa0' }}>Pattan, Kohistan Lower, KPK</p>
          </div>
        </div>

        {/* Official Sponsor badge */}
        <div className="flex justify-center mb-5">
          <div className="flex items-center gap-2 px-5 py-2 rounded-full" style={{
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.25)',
          }}>
            <span>🏆</span>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#d4a017' }}>
              Official App Developer · PPL 2026
            </span>
          </div>
        </div>

        {/* About section */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#160a2e', border: '1px solid rgba(147,51,234,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🌟</span>
            <span className="font-display text-base tracking-wide" style={{ color: '#f0e6ff' }}>About the Hospital</span>
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#a78bcf' }}>
            Kohistan Medical &amp; Surgical Complex is one of the leading healthcare facilities in Lower Kohistan, proudly serving the communities of Pattan and surrounding areas in Khyber Pakhtunkhwa.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#a78bcf' }}>
            With a strong commitment to accessible healthcare, the complex offers a comprehensive range of medical and surgical services — from general consultations to specialized treatments — ensuring quality care is available to all residents of the region.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#a78bcf' }}>
            As an authorized <span style={{ color: '#93c5fd', fontWeight: 600 }}>Sehat Card Plus</span> facility, patients can access government-backed health insurance coverage, making essential treatments free or subsidized for eligible families across Kohistan.
          </p>
        </div>

        {/* Services */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#160a2e', border: '1px solid rgba(147,51,234,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚕️</span>
            <span className="font-display text-base tracking-wide" style={{ color: '#f0e6ff' }}>Services</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['🏥','General Medicine'],
              ['🔪','Surgical Care'],
              ['💊','Pharmacy'],
              ['💳','Sehat Card Plus'],
              ['🤱','Maternity Care'],
              ['🚑','Emergency Services'],
              ['🩺','Specialist Clinics'],
              ['🧪','Diagnostics & Lab'],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(147,51,234,0.06)', border: '1px solid rgba(147,51,234,0.1)' }}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="text-xs font-semibold" style={{ color: '#c4a8e8' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PPL Team */}
        <div className="rounded-2xl p-5 mb-4" style={{
          background: 'linear-gradient(135deg, #1a0a2e, #2d1060)',
          border: '1px solid rgba(147,51,234,0.3)',
          boxShadow: '0 0 20px rgba(147,51,234,0.08)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏏</span>
            <span className="font-display text-base tracking-wide" style={{ color: '#f0e6ff' }}>PPL Team</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6b21a8, #9333ea)', border: '2px solid rgba(147,51,234,0.4)', boxShadow: '0 0 16px rgba(147,51,234,0.3)' }}>
              👑
            </div>
            <div>
              <div className="font-display text-lg tracking-wide" style={{ color: '#d4a017' }}>Kohistan Kay Sultans</div>
              <div className="text-xs mt-1" style={{ color: '#7c5fa0' }}>Competing in Pattan Premier League 2026</div>
              <div className="text-xs mt-1" style={{ color: '#9333ea' }}>Under the banner of Kohistan Medical & Surgical Complex</div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#160a2e', border: '1px solid rgba(147,51,234,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)' }}>
              <span className="text-lg">📍</span>
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#f0e6ff' }}>Location</div>
              <div className="text-xs mt-0.5" style={{ color: '#7c5fa0' }}>Pattan, Kohistan Lower, Khyber Pakhtunkhwa, Pakistan</div>
            </div>
          </div>
        </div>

        {/* App developed by */}
        <div className="rounded-2xl p-4 text-center" style={{
          background: 'rgba(212,160,23,0.05)',
          border: '1px solid rgba(212,160,23,0.15)',
        }}>
          <p className="text-[11px] tracking-widest uppercase font-semibold mb-1" style={{ color: '#7c5fa0' }}>PPL 2026 Official App</p>
          <p className="text-xs" style={{ color: '#d4a017' }}>
            Developed &amp; sponsored by the owner of
          </p>
          <p className="text-sm font-bold mt-0.5" style={{ color: '#f0e6ff' }}>
            Kohistan Medical &amp; Surgical Complex
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#a78bcf' }}>(Sehat Card Plus) · Pattan Kohistan Lower</p>
        </div>

      </div>
      </div>
    </div>
  )
}

// ── TV-style floating sponsor badge ──────────────────────────────
function SponsorBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl active:scale-95 transition-all float-live"
      style={{
        background: 'rgba(13,5,32,0.82)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,160,23,0.4)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(212,160,23,0.15)',
      }}>
      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', border: '1px solid rgba(37,99,235,0.5)' }}>
        <span className="text-[11px] leading-none">🏥</span>
      </div>
      <div className="text-left">
        <div className="font-semibold leading-none" style={{ fontSize: '10px', color: '#ffffff' }}>Developed by</div>
        <div className="font-bold leading-none mt-0.5" style={{ fontSize: '10px', color: '#d4a017' }}>KM&amp;S Complex</div>
      </div>
    </button>
  )
}

export default function HomePage() {
  const { teams, matches, players, live, setActiveTab } = useStore()
  const [showSponsor, setShowSponsor] = React.useState(false)

  // Expose sponsor toggle globally so LiveCard badge can trigger it
  React.useEffect(() => {
    (window as any).__showSponsor = () => setShowSponsor(true)
    return () => { delete (window as any).__showSponsor }
  }, [])
  const liveMatch = matches.find(m => m.status === 'live')
  const completed = matches.filter(m => m.status === 'completed').length

  return (
    <div className="fade-up pb-6">
      {showSponsor && <SponsorPage onClose={() => setShowSponsor(false)} />}

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

        {/* TV-style floating sponsor badge — bottom right of hero */}
        <div className="absolute bottom-3 right-3">
          <SponsorBadge onClick={() => setShowSponsor(true)} />
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
