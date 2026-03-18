import { useState, useEffect } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'

export default function LiveSection() {
  const { matches, teams, live, setLive } = useStore()
  const [selMatch, setSelMatch] = useState(live?.matchId || '')
  const upcomingAndLive = matches.filter(m => ['upcoming', 'live'].includes(m.status))

  // ─── Start live match ───────────────────────────────────────────
  const startLive = async (mid: string) => {
    const m = matches.find(x => x.id === mid)
    if (!m) return
    if (live?.matchId === mid) {
      document.getElementById('liveControls')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!confirm(`Start live scoring for ${m.team1.name} vs ${m.team2.name}?`)) return
    const firstBat = prompt(`Who bats first?\n1. ${m.team1.name}\n2. ${m.team2.name}`, '1')
    if (!firstBat) return
    const isT1 = firstBat.trim() === '1' || firstBat.trim().toLowerCase() === m.team1.name.toLowerCase()
    const battingFirst = isT1 ? m.team1.name : m.team2.name
    const bowlingFirst = isT1 ? m.team2.name : m.team1.name
    try {
      // Clear any other live match
      for (const mx of matches.filter(x => x.status === 'live')) {
        await api(`/matches/${mx.id}/status`, 'POST', { status: 'upcoming' }).catch(() => {})
      }
      await api(`/matches/${mid}/status`, 'POST', { status: 'live' })
      const ls = {
        matchId: mid, innings: 1, runs: 0, wickets: 0, balls: 0, target: null,
        battingFirst, bowlingFirst,
        striker:      { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
        nonstriker:   { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
        currentBowler:{ name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 },
        batters: {}, bowlers: {}, extras: { wide: 0, noball: 0, bye: 0 }, lastBalls: [],
        dotBalls: 0,
      }
      await api('/live', 'PUT', ls)
      setLive(ls as any)
      toast.success(`🔴 ${m.team1.name} vs ${m.team2.name} — LIVE!`)
    } catch (e: any) { toast.error(e.message) }
  }

  // ─── Persist live state ─────────────────────────────────────────
  const saveLive = async (lv: any) => {
    flushCurrent(lv)
    try {
      await api('/live', 'PUT', lv)
      setLive({ ...lv })
    } catch (e: any) { toast.error('Save error: ' + e.message) }
  }

  // Flush current batters/bowler into the stored records
  const flushCurrent = (lv: any) => {
    lv.batters  = lv.batters  || {}
    lv.bowlers  = lv.bowlers  || {}
    const key = (n: string) => n.replace(/[.#$[\]/]/g, '_')
    if (lv.striker?.name)        lv.batters[key(lv.striker.name)]       = { ...lv.striker }
    if (lv.nonstriker?.name)     lv.batters[key(lv.nonstriker.name)]    = { ...lv.nonstriker }
    if (lv.currentBowler?.name)  lv.bowlers[key(lv.currentBowler.name)] = { ...lv.currentBowler }
  }

  const recalcEconomy = (b: any) => {
    const overs = b.ballsBowled / 6
    b.economy = overs > 0 ? b.runsConceded / overs : 0
  }

  const getMatchOvers = (lv: any) => {
    const m = matches.find(x => x.id === lv.matchId)
    return m?.overs || 10
  }

  // ─── Strike rotation (strict cricket rules) ─────────────────────
  // • Odd runs (1,3,5)  → batters swap ends MID-OVER
  // • Even runs (0,2,4) → no swap mid-over
  // • End of over       → ends swap (non-striker faces new over)
  //   EXCEPTION: if odd runs on LAST ball → the above swap already moved
  //   the correct batter to face — end-of-over swap cancels out (correct)
  const applyStrikeRotation = (lv: any, runsScored: number, isEndOfOver: boolean) => {
    // Step 1: odd runs → swap
    if (runsScored % 2 !== 0) {
      const tmp = lv.striker
      lv.striker = lv.nonstriker
      lv.nonstriker = tmp
    }
    // Step 2: end of over with EVEN runs → swap (non-striker faces new over)
    if (isEndOfOver && runsScored % 2 === 0) {
      const tmp = lv.striker
      lv.striker = lv.nonstriker
      lv.nonstriker = tmp
    }
  }

  // ─── ADD RUN (0,1,2,3,4,6) ─────────────────────────────────────
  const addRun = async (r: number) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const mo = getMatchOvers(lv)

    // Update totals — ball COUNTS in over
    lv.runs  += r
    lv.balls += 1

    // Update striker
    if (lv.striker?.name) {
      lv.striker.runs  += r
      lv.striker.balls += 1
      if (r === 4) lv.striker.fours++
      if (r === 6) lv.striker.sixes++
    }

    // Update bowler (runs + ball)
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled   += 1
      lv.currentBowler.runsConceded  += r
      recalcEconomy(lv.currentBowler)
    }

    // Track dot balls
    if (r === 0) lv.dotBalls = (lv.dotBalls || 0) + 1

    // Last balls display
    lv.lastBalls = [...(lv.lastBalls || []), r === 0 ? '•' : String(r)]

    const isEndOfOver = lv.balls % 6 === 0
    applyStrikeRotation(lv, r, isEndOfOver)

    // End of over → clear bowler for next over selection
    if (isEndOfOver) {
      flushCurrent(lv)
      lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    }

    // Check end of innings
    if (lv.balls >= mo * 6) { await endInnings(lv); return }
    await saveLive(lv)
  }

  // ─── WIDE ───────────────────────────────────────────────────────
  // +1 run to total, +1 to extras.wide, ball NOT counted in over
  // bowler concedes +1 run but ball NOT counted in bowler's balls
  const addWide = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1
    lv.extras = { ...lv.extras, wide: (lv.extras?.wide || 0) + 1 }
    if (lv.currentBowler?.name) {
      lv.currentBowler.runsConceded += 1
      recalcEconomy(lv.currentBowler)
    }
    lv.lastBalls = [...(lv.lastBalls || []), 'Wd']
    // NO ball count, NO strike rotation
    await saveLive(lv)
    toast('Wide — +1 run', { icon: '↔️' })
  }

  // ─── NO BALL ────────────────────────────────────────────────────
  // +1 run to total, +1 to extras.noball, ball NOT counted in over
  // bowler concedes +1 run but ball NOT counted in bowler's balls
  const addNoBall = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1
    lv.extras = { ...lv.extras, noball: (lv.extras?.noball || 0) + 1 }
    if (lv.currentBowler?.name) {
      lv.currentBowler.runsConceded += 1
      recalcEconomy(lv.currentBowler)
    }
    lv.lastBalls = [...(lv.lastBalls || []), 'NB']
    // NO ball count, NO strike rotation
    await saveLive(lv)
    toast('No Ball — +1 run', { icon: '🚫' })
  }

  // ─── WICKET (Bowled / Caught / LBW) ────────────────────────────
  // Ball counts, wicket counts for BOWLER, striker is out → change batter
  const addWicket = async (how: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const mo = getMatchOvers(lv)

    lv.wickets += 1
    lv.balls   += 1

    // Mark striker out
    if (lv.striker?.name) {
      lv.striker.out = true
      lv.striker.how = how
      flushCurrent(lv)
    }

    // Bowler gets the wicket
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled += 1
      lv.currentBowler.wickets     += 1
      recalcEconomy(lv.currentBowler)
    }

    lv.lastBalls = [...(lv.lastBalls || []), 'W']

    // Clear striker — admin must select new batter
    lv.striker = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 }

    const isEndOfOver = lv.balls % 6 === 0
    if (isEndOfOver) {
      flushCurrent(lv)
      lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    }

    if (lv.wickets >= 10 || lv.balls >= mo * 6) { await endInnings(lv); return }
    await saveLive(lv)
    toast.error(`🎯 WICKET! ${how} — Select new batter`)
  }

  // ─── RUN OUT ────────────────────────────────────────────────────
  // Ball counts, wicket does NOT count for bowler, striker is out → change
  // Runs scored before the run-out still count
  const addRunOut = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const mo = getMatchOvers(lv)

    const runsBeforeRO = parseInt(prompt('Runs scored before run-out (0 if direct):', '0') || '0') || 0

    lv.wickets += 1
    lv.balls   += 1
    lv.runs    += runsBeforeRO

    if (lv.striker?.name) {
      lv.striker.runs  += runsBeforeRO
      lv.striker.balls += 1
      lv.striker.out   = true
      lv.striker.how   = 'Run Out'
    }

    // Bowler: ball counts but wicket does NOT
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled  += 1
      lv.currentBowler.runsConceded += runsBeforeRO
      recalcEconomy(lv.currentBowler)
    }

    lv.lastBalls = [...(lv.lastBalls || []), 'W']
    flushCurrent(lv)
    lv.striker = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 }

    const isEndOfOver = lv.balls % 6 === 0
    if (isEndOfOver) {
      lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    }

    if (lv.wickets >= 10 || lv.balls >= mo * 6) { await endInnings(lv); return }
    await saveLive(lv)
    toast.error(`💨 RUN OUT! Select new batter`)
  }

  // ─── END INNINGS ───────────────────────────────────────────────
  const endInnings = async (lv?: any) => {
    const state = lv || (live ? JSON.parse(JSON.stringify(live)) : null)
    if (!state) return
    flushCurrent(state)
    const m = matches.find(x => x.id === state.matchId)
    const ov = Math.floor(state.balls / 6)
    const bl = state.balls % 6
    const ss = `${state.runs}/${state.wickets} (${ov}.${bl})`

    if (state.innings === 1 && m) {
      try {
        await api(`/matches/${m.id}/inn1`, 'POST', {
          inn1: { batters: state.batters || {}, bowlers: state.bowlers || {} },
          s1: ss,
        })
        const ns = {
          ...state,
          innings: 2, runs: 0, wickets: 0, balls: 0,
          target: state.runs + 1,
          striker:      { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
          nonstriker:   { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
          currentBowler:{ name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 },
          batters: {}, bowlers: {}, lastBalls: [], dotBalls: 0,
          // Swap batting/bowling teams for 2nd innings
          battingFirst:  state.battingFirst,
          bowlingFirst:  state.bowlingFirst,
        }
        await api('/live', 'PUT', ns)
        setLive(ns as any)
        toast.success(`✅ 1st Innings Done! Target: ${state.runs + 1}`)
      } catch (e: any) { toast.error(e.message) }
    } else if (m) {
      await finishMatch(state, ss)
    }
  }

  // ─── FINISH MATCH ──────────────────────────────────────────────
  const finishMatch = async (state: any, ss: string) => {
    const m = matches.find(x => x.id === state.matchId)
    if (!m) return
    flushCurrent(state)

    const inn1 = (m.innings1 as any) || {}
    const allBat  = [...Object.values(inn1.batters  || {}), ...Object.values(state.batters  || {})] as any[]
    const allBowl = [...Object.values(inn1.bowlers  || {}), ...Object.values(state.bowlers  || {})] as any[]

    // Result calculation
    const p2 = ss.match(/(\d+)\/(\d+)/)
    const r2 = p2 ? +p2[1] : 0
    const w2 = p2 ? +p2[2] : 0
    const p1 = (m.score1 || '').match(/(\d+)\/(\d+)/)
    const r1 = p1 ? +p1[1] : 0
    let result = ''
    if (p1 && p2) {
      if (r2 > r1)       result = `${m.innings === 2 ? state.bowlingFirst : state.battingFirst} won by ${10 - w2} wicket${10 - w2 !== 1 ? 's' : ''}`
      else if (r1 > r2)  result = `${state.battingFirst} won by ${r1 - r2} run${r1 - r2 !== 1 ? 's' : ''}`
      else               result = 'Match Tied'
    }

    // Top performers
    const tb  = allBat.filter((b: any) => b.name).sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))[0]
    const tbw = allBowl.filter((b: any) => b.name && (b.wickets || 0) > 0).sort((a: any, b: any) => (b.wickets || 0) - (a.wickets || 0))[0]
    const hl = {
      topBatter: tb  ? { name: tb.name,  runs: tb.runs || 0,       balls: tb.balls || 0, fours: tb.fours || 0, sixes: tb.sixes || 0, sr: tb.balls > 0 ? ((tb.runs / tb.balls) * 100).toFixed(1) : '—' } : null,
      topBowler: tbw ? { name: tbw.name, wickets: tbw.wickets || 0, runs: tbw.runsConceded || 0, eco: (tbw.economy || 0).toFixed(2) } : null,
    }

    try {
      await api(`/matches/${m.id}/finish`, 'POST', {
        result, s1: m.score1, s2: ss, highlights: hl, innings1: inn1,
      })
      await api('/live', 'DELETE')
      setLive(null)
      toast.success(`🏆 ${result || 'Match Ended'}`)
      try {
        await api('/notifications/send', 'POST', {
          title: '🏆 Match Result',
          body: `${m.team1?.name} vs ${m.team2?.name} — ${result}`,
          icon: '🏆',
          url: '/?tab=live',
        })
      } catch {}
    } catch (e: any) { toast.error(e.message) }
  }

  const endMatch = async () => {
    if (!live || !confirm('End this match? This cannot be undone.')) return
    const state = JSON.parse(JSON.stringify(live))
    flushCurrent(state)
    const ov = Math.floor(state.balls / 6)
    const bl = state.balls % 6
    const ss = `${state.runs}/${state.wickets} (${ov}.${bl})`
    if (state.innings === 2) {
      await finishMatch(state, ss)
    } else {
      try {
        const m = matches.find(x => x.id === state.matchId)
        if (m) await api(`/matches/${m.id}/status`, 'POST', { status: 'upcoming' })
        await api('/live', 'DELETE')
        setLive(null)
        toast('Match ended')
      } catch {}
    }
  }

  // ─── Player selectors ───────────────────────────────────────────
  const selectStriker = async (name: string) => {
    if (!live) return
    if (live.nonstriker?.name === name) { toast.error('Already non-striker'); return }
    const lv = JSON.parse(JSON.stringify(live))
    flushCurrent(lv)
    const ex = Object.values(lv.batters || {}).find((b: any) => b.name === name && !b.out) as any
    lv.striker = ex ? { ...ex } : { name, runs: 0, balls: 0, fours: 0, sixes: 0 }
    await saveLive(lv)
    toast.success(`⚡ ${name} on strike`)
  }

  const selectNonStriker = async (name: string) => {
    if (!live) return
    if (live.striker?.name === name) { toast.error('Already on strike'); return }
    const lv = JSON.parse(JSON.stringify(live))
    flushCurrent(lv)
    const ex = Object.values(lv.batters || {}).find((b: any) => b.name === name && !b.out) as any
    lv.nonstriker = ex ? { ...ex } : { name, runs: 0, balls: 0, fours: 0, sixes: 0 }
    await saveLive(lv)
    toast.success(`🏏 ${name} non-striker`)
  }

  const selectBowler = async (name: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    flushCurrent(lv)
    const ex = Object.values(lv.bowlers || {}).find((b: any) => b.name === name) as any
    lv.currentBowler = ex ? { ...ex } : { name, ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    await saveLive(lv)
    toast.success(`🎯 ${name} bowling`)
  }

  const swapStrike = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const tmp = lv.striker
    lv.striker = lv.nonstriker
    lv.nonstriker = tmp
    await saveLive(lv)
    toast(`🔄 Strike → ${lv.striker?.name || '?'}`)
  }

  // ─── Squad pickers ──────────────────────────────────────────────
  const [batSquad,  setBatSquad]  = useState<any[]>([])
  const [bowlSquad, setBowlSquad] = useState<any[]>([])

  useEffect(() => {
    if (!live?.matchId) return
    const m = matches.find(x => x.id === live.matchId)
    if (!m) return
    // 2nd innings: batting team swaps
    const battingNow = live.innings === 2 ? live.bowlingFirst : live.battingFirst
    const bowlingNow = live.innings === 2 ? live.battingFirst : live.bowlingFirst
    const batT  = teams.find(t => t.name === battingNow)
    const bowlT = teams.find(t => t.name === bowlingNow)
    if (batT)  api(`/squads/${batT.id}` ).then((r: any) => setBatSquad(r.data  || r)).catch(() => {})
    if (bowlT) api(`/squads/${bowlT.id}`).then((r: any) => setBowlSquad(r.data || r)).catch(() => {})
  }, [live?.matchId, live?.innings])

  const outNames = live ? Object.values(live.batters || {}).filter((b: any) => b.out).map((b: any) => b.name) : []
  const ov = live ? Math.floor(live.balls / 6) : 0
  const bl = live ? live.balls % 6 : 0
  const mo = live ? getMatchOvers(live) : 10
  const battingNow = live?.innings === 2 ? live?.bowlingFirst : live?.battingFirst

  return (
    <div className="space-y-4">
      {/* Match selector */}
      <div>
        <label className="text-xs text-[#8892b0] mb-1.5 block">Select Match to Go Live</label>
        <select className="select-field" value={selMatch}
          onChange={e => { setSelMatch(e.target.value); if (e.target.value) startLive(e.target.value) }}>
          <option value="">— Select match —</option>
          {upcomingAndLive.map(m => (
            <option key={m.id} value={m.id}>
              [{m.matchNo || '?'}] {m.team1.name} vs {m.team2.name} {m.status === 'live' ? '🔴' : ''}
            </option>
          ))}
        </select>
      </div>

      {live && (
        <div id="liveControls" className="space-y-4">
          {/* Score display */}
          <div className="card-gold p-4 text-center rounded-xl">
            <div className="text-[11px] text-[#8892b0] mb-1 tracking-widest uppercase">
              Inn {live.innings} · {battingNow} batting · {ov}.{bl}/{mo} ov
              {live.target ? ` · Target ${live.target}` : ''}
            </div>
            <div className="font-mono text-4xl text-[#f0c040] font-black">{live.runs}/{live.wickets}</div>
            <div className="mt-2 space-y-1">
              {live.striker?.name && (
                <div className="text-xs text-[#f0c040]">⚡ {live.striker.name}* — {live.striker.runs}({live.striker.balls}){live.striker.fours ? ` 4s:${live.striker.fours}` : ''}{live.striker.sixes ? ` 6s:${live.striker.sixes}` : ''}</div>
              )}
              {!live.striker?.name && <div className="text-xs text-amber-400 animate-pulse">⚡ SELECT STRIKER ↓</div>}
              {live.nonstriker?.name && (
                <div className="text-xs text-[#8892b0]">{live.nonstriker.name} — {live.nonstriker.runs}({live.nonstriker.balls})</div>
              )}
              {live.currentBowler?.name && (
                <div className="text-xs text-red-400">
                  🎯 {live.currentBowler.name} — {Math.floor((live.currentBowler.ballsBowled || 0) / 6)}.{(live.currentBowler.ballsBowled || 0) % 6} ov {live.currentBowler.wickets}w {live.currentBowler.runsConceded}r
                </div>
              )}
              {!live.currentBowler?.name && <div className="text-xs text-amber-400 animate-pulse">🎯 SELECT BOWLER ↓</div>}
            </div>
          </div>

          {/* Last balls */}
          {(live.lastBalls || []).length > 0 && (
            <div className="flex gap-1.5 flex-wrap justify-center">
              {(live.lastBalls || []).slice(-12).map((b: string, i: number) => {
                const cls = b === 'W' ? 'ball-W' : b === '6' ? 'ball-6' : b === '4' ? 'ball-4' : (b === 'Wd' || b === 'NB') ? 'ball-WD' : (b === '•' || b === '0') ? 'ball-0' : 'ball-n'
                return <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${cls}`}>{b === '•' ? '0' : b}</div>
              })}
            </div>
          )}

          {/* Scoring pad */}
          <div className="space-y-2">
            <div className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center">Runs</div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(r => (
                <button key={r} onClick={() => addRun(r)}
                  className="bg-[#1e2a4a] text-white rounded-xl py-3 font-display text-xl hover:bg-[#f0c040]/20 active:scale-95 transition-all border border-white/[0.04]">
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addRun(4)} className="bg-[#f0c040]/20 text-[#f0c040] rounded-xl py-3 font-display text-xl hover:bg-[#f0c040]/30 active:scale-95 transition-all border border-[#f0c040]/20">4</button>
              <button onClick={() => addRun(6)} className="bg-emerald-500/20 text-emerald-400 rounded-xl py-3 font-display text-xl hover:bg-emerald-500/30 active:scale-95 transition-all border border-emerald-500/20">6</button>
            </div>

            <div className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center mt-1">Extras (ball NOT counted)</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addWide}  className="bg-amber-500/15 text-amber-400 rounded-xl py-2.5 font-bold text-sm hover:bg-amber-500/25 active:scale-95 transition-all border border-amber-500/20">WD — Wide</button>
              <button onClick={addNoBall} className="bg-amber-500/15 text-amber-400 rounded-xl py-2.5 font-bold text-sm hover:bg-amber-500/25 active:scale-95 transition-all border border-amber-500/20">NB — No Ball</button>
            </div>

            <div className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center mt-1">Wickets (ball counted)</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addWicket('Bowled')} className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm hover:bg-red-500/25 active:scale-95 transition-all border border-red-500/20">BWD — Bowled</button>
              <button onClick={() => addWicket('Caught')} className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm hover:bg-red-500/25 active:scale-95 transition-all border border-red-500/20">CT — Caught</button>
              <button onClick={() => addWicket('LBW')}    className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm hover:bg-red-500/25 active:scale-95 transition-all border border-red-500/20">LBW</button>
              <button onClick={addRunOut}                  className="bg-orange-500/15 text-orange-400 rounded-xl py-2.5 font-bold text-sm hover:bg-orange-500/25 active:scale-95 transition-all border border-orange-500/20">RO — Run Out ⚡</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addWicket('Stumped')}  className="bg-red-500/15 text-red-400 rounded-xl py-2 font-bold text-xs hover:bg-red-500/25 active:scale-95 transition-all border border-red-500/20">STM — Stumped</button>
              <button onClick={() => addWicket('Hit Wicket')} className="bg-red-500/15 text-red-400 rounded-xl py-2 font-bold text-xs hover:bg-red-500/25 active:scale-95 transition-all border border-red-500/20">HW — Hit Wicket</button>
            </div>
          </div>

          {/* Player pickers */}
          <PlayerPicker label="⚡ STRIKER (batting)"     squad={batSquad}  selected={live.striker?.name}       disabled={[...outNames, live.nonstriker?.name || '']} onSelect={selectStriker} />
          <PlayerPicker label="🏏 NON-STRIKER"           squad={batSquad}  selected={live.nonstriker?.name}    disabled={[...outNames, live.striker?.name || '']}    onSelect={selectNonStriker} />
          <PlayerPicker label="🎯 BOWLER (current over)" squad={bowlSquad} selected={live.currentBowler?.name} disabled={[]}                                         onSelect={selectBowler} />

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={swapStrike} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all">🔄 Swap Strike</button>
            <button onClick={() => endInnings()} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all">🏁 End Innings</button>
          </div>
          <button onClick={endMatch} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all">❌ End Match</button>
        </div>
      )}
    </div>
  )
}

function PlayerPicker({ label, squad, selected, disabled, onSelect }: {
  label: string; squad: any[]; selected?: string; disabled: string[]; onSelect: (n: string) => void
}) {
  const [custom, setCustom] = useState('')
  return (
    <div>
      <div className="text-[10px] text-[#8892b0] tracking-widest uppercase mb-1.5 font-semibold">{label}</div>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white/[0.02] rounded-xl border border-white/[0.04]">
        {squad.map(p => {
          const isOut = disabled.includes(p.name)
          const isSel = selected === p.name
          return (
            <button key={p.id} disabled={isOut} onClick={() => onSelect(p.name)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${isSel ? 'bg-[#f0c040]/20 text-[#f0c040] border border-[#f0c040]/30' : isOut ? 'opacity-25 cursor-not-allowed text-[#4a5568] line-through' : 'bg-white/[0.04] text-[#8892b0] hover:text-white active:scale-95'}`}>
              {p.name}
              {isSel && <span className="ml-1 text-[8px]">✓</span>}
            </button>
          )
        })}
        <div className="flex gap-1 w-full mt-1">
          <input
            className="flex-1 bg-[#161f38] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#f0c040]/40"
            placeholder="Custom name..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { onSelect(custom.trim()); setCustom('') } }}
          />
          <button onClick={() => { if (custom.trim()) { onSelect(custom.trim()); setCustom('') } }}
            className="bg-[#f0c040]/10 text-[#f0c040] rounded-lg px-3 py-1 text-[11px] font-semibold active:scale-95 border border-[#f0c040]/20">
            +
          </button>
        </div>
      </div>
    </div>
  )
}
