import { useState, useEffect } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'

export default function LiveSection() {
  const { matches, teams, live, setLive } = useStore()
  const [selMatch, setSelMatch] = useState(live?.matchId || '')
  const upcomingAndLive = matches.filter(m => ['upcoming', 'live'].includes(m.status))

  // ── Start live ───────────────────────────────────────────────────
  const startLive = async (mid: string) => {
    const m = matches.find(x => x.id === mid)
    if (!m) return
    if (live?.matchId === mid) return
    if (!confirm(`Start live scoring: ${m.team1.name} vs ${m.team2.name}?`)) return
    const ans = prompt(`Who bats first?\n1. ${m.team1.name}\n2. ${m.team2.name}`, '1')
    if (!ans) return
    const isT1 = ans.trim() === '1' || ans.trim().toLowerCase() === m.team1.name.toLowerCase()
    const battingFirst = isT1 ? m.team1.name : m.team2.name
    const bowlingFirst = isT1 ? m.team2.name : m.team1.name
    try {
      for (const mx of matches.filter(x => x.status === 'live'))
        await api(`/matches/${mx.id}/status`, 'POST', { status: 'upcoming' }).catch(() => {})
      await api(`/matches/${mid}/status`, 'POST', { status: 'live' })
      const ls: any = {
        matchId: mid, innings: 1, runs: 0, wickets: 0, balls: 0, target: null,
        battingFirst, bowlingFirst,
        striker:       { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
        nonstriker:    { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
        currentBowler: { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 },
        batters: {}, bowlers: {}, extras: { wide: 0, noball: 0 }, lastBalls: [],
      }
      await api('/live', 'PUT', ls)
      setLive(ls)
      toast.success(`🔴 LIVE! ${battingFirst} batting`)
    } catch (e: any) { toast.error(e.message) }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  // Safe player key for object storage
  const pkey = (n: string) => n.replace(/[.#$[\]/\s]/g, '_')

  // Flush active striker/nonstriker/bowler into stored records
  const flush = (lv: any) => {
    lv.batters = lv.batters || {}
    lv.bowlers = lv.bowlers || {}
    if (lv.striker?.name)       lv.batters[pkey(lv.striker.name)]       = { ...lv.striker }
    if (lv.nonstriker?.name)    lv.batters[pkey(lv.nonstriker.name)]    = { ...lv.nonstriker }
    if (lv.currentBowler?.name) lv.bowlers[pkey(lv.currentBowler.name)] = { ...lv.currentBowler }
  }

  // Economy = runs per over. Always calculated fresh from raw ball/run counts.
  const calcEco = (balls: number, runs: number): number => {
    if (!balls) return 0
    return Math.round((runs / (balls / 6)) * 100) / 100
  }

  // Overs display: total balls → "X.Y" format
  const ballsToOvers = (balls: number): string =>
    `${Math.floor(balls / 6)}.${balls % 6}`

  const movers = (lv: any) => matches.find(x => x.id === lv.matchId)?.overs || 10

  // Score string in standard format: "runs/wkts (X.Y)"
  const ss = (lv: any) => {
    const ov = Math.floor(lv.balls / 6)
    const bl = lv.balls % 6
    return `${lv.runs}/${lv.wickets} (${ov}.${bl})`
  }

  // Save to DB + broadcast
  const save = async (lv: any) => {
    flush(lv)
    await api('/live', 'PUT', lv)
    setLive({ ...lv })
  }

  // ── Strike rotation ───────────────────────────────────────────────
  // End of over (even or odd runs already handled): non-striker faces
  // Mid over odd runs: swap
  const rotateStrike = (lv: any, runs: number, isEndOfOver: boolean) => {
    const isOdd = runs % 2 !== 0
    if (isOdd) {
      const t = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = t
    }
    // End of over: if runs were even, batters at wrong end — swap
    // If runs were odd, already swapped above → they ARE at right end, no extra swap needed
    if (isEndOfOver && !isOdd) {
      const t = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = t
    }
  }

  // ── ADD RUN (ball counts) ─────────────────────────────────────────
  const addRun = async (r: number) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))

    lv.runs  += r
    lv.balls += 1

    if (lv.striker?.name) {
      lv.striker.runs  += r
      lv.striker.balls += 1
      if (r === 4) lv.striker.fours = (lv.striker.fours || 0) + 1
      if (r === 6) lv.striker.sixes = (lv.striker.sixes || 0) + 1
    }
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled   += 1
      lv.currentBowler.runsConceded  += r
      lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled || 0, lv.currentBowler.runsConceded || 0)
    }

    lv.lastBalls = [...(lv.lastBalls || []), r === 0 ? '•' : String(r)]

    const isEOO = lv.balls % 6 === 0
    rotateStrike(lv, r, isEOO)

    if (isEOO) {
      flush(lv)
      lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    }

    if (lv.balls >= movers(lv) * 6) { await endInnings(lv); return }
    try { await save(lv) } catch (e: any) { toast.error(e.message) }
  }

  // ── WIDE: +1 run, ball NOT counted, no strike rotation ───────────
  const addWide = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1
    lv.extras = { ...lv.extras, wide: (lv.extras?.wide || 0) + 1 }
    if (lv.currentBowler?.name) { lv.currentBowler.runsConceded += 1; lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled || 0, lv.currentBowler.runsConceded || 0) }
    lv.lastBalls = [...(lv.lastBalls || []), 'Wd']
    try { await save(lv); toast('↔️ Wide +1') } catch (e: any) { toast.error(e.message) }
  }

  // ── NO BALL: +1 run, ball NOT counted, no strike rotation ────────
  const addNoBall = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1
    lv.extras = { ...lv.extras, noball: (lv.extras?.noball || 0) + 1 }
    if (lv.currentBowler?.name) { lv.currentBowler.runsConceded += 1; lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled || 0, lv.currentBowler.runsConceded || 0) }
    lv.lastBalls = [...(lv.lastBalls || []), 'NB']
    try { await save(lv); toast('🚫 No Ball +1') } catch (e: any) { toast.error(e.message) }
  }

  // ── WICKET — Bowled/Caught/LBW/Stumped/HitWicket ─────────────────
  // Ball counts, wicket counts for bowler, striker out → need new batter
  const addWicket = async (how: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))

    lv.wickets += 1
    lv.balls   += 1

    if (lv.striker?.name) {
      lv.striker.out = true
      lv.striker.how = how
    }
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled += 1
      lv.currentBowler.wickets     += 1
      lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled || 0, lv.currentBowler.runsConceded || 0)
    }

    lv.lastBalls = [...(lv.lastBalls || []), 'W']
    flush(lv)
    lv.striker = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 }

    const isEOO = lv.balls % 6 === 0
    if (isEOO) {
      lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    }

    if (lv.wickets >= 10 || lv.balls >= movers(lv) * 6) { await endInnings(lv); return }
    try { await save(lv); toast.error(`🎯 ${how}! Select new batter`) } catch (e: any) { toast.error(e.message) }
  }

  // ── RUN OUT: Ball counts, wicket NOT for bowler ───────────────────
  const addRunOut = async () => {
    if (!live) return
    const runs = parseInt(prompt('Runs before run-out (0 = direct):', '0') || '0') || 0
    const lv = JSON.parse(JSON.stringify(live))

    lv.wickets += 1
    lv.balls   += 1
    lv.runs    += runs

    if (lv.striker?.name) {
      lv.striker.runs  += runs
      lv.striker.balls += 1
      lv.striker.out   = true
      lv.striker.how   = 'Run Out'
    }
    // Bowler: ball counts, runs count, but wicket does NOT
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled  += 1
      lv.currentBowler.runsConceded += runs
      lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled || 0, lv.currentBowler.runsConceded || 0)
    }

    lv.lastBalls = [...(lv.lastBalls || []), 'W']
    flush(lv)
    lv.striker = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 }

    const isEOO = lv.balls % 6 === 0
    if (isEOO) lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }

    if (lv.wickets >= 10 || lv.balls >= movers(lv) * 6) { await endInnings(lv); return }
    try { await save(lv); toast.error('💨 Run Out! Select new batter') } catch (e: any) { toast.error(e.message) }
  }

  // ── END INNINGS ───────────────────────────────────────────────────
  const endInnings = async (lv?: any) => {
    const state = lv || (live ? JSON.parse(JSON.stringify(live)) : null)
    if (!state) return
    flush(state)
    const m = matches.find(x => x.id === state.matchId)
    if (!m) return
    const scoreStr = ss(state)

    if (state.innings === 1) {
      try {
        await api(`/matches/${m.id}/inn1`, 'POST', {
          inn1: { batters: state.batters || {}, bowlers: state.bowlers || {} },
          s1: scoreStr,
        })
        const ns = {
          ...state, innings: 2, runs: 0, wickets: 0, balls: 0,
          target: state.runs + 1,
          striker:       { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
          nonstriker:    { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
          currentBowler: { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 },
          batters: {}, bowlers: {}, lastBalls: [],
        }
        await api('/live', 'PUT', ns)
        setLive(ns)
        toast.success(`✅ Inn 1 done — Target ${state.runs + 1}`)
      } catch (e: any) { toast.error(e.message) }
    } else {
      await finishMatch(state, scoreStr)
    }
  }

  // ── FINISH MATCH ──────────────────────────────────────────────────
  const finishMatch = async (state: any, scoreStr: string) => {
    const m = matches.find(x => x.id === state.matchId)
    if (!m) return
    flush(state)

    const inn1    = (m.innings1 as any) || {}
    const inn1Bat = Object.values(inn1.batters  || {}) as any[]
    const inn1Bowl= Object.values(inn1.bowlers  || {}) as any[]
    const inn2Bat = Object.values(state.batters || {}) as any[]
    const inn2Bowl= Object.values(state.bowlers || {}) as any[]

    // Result calculation
    // Inn1: battingFirst batted → their score is score1
    // Inn2: bowlingFirst batted → their score is scoreStr (current)
    const p1 = (m.score1 || '').match(/^(\d+)\/(\d+)/)
    const p2 = scoreStr.match(/^(\d+)\/(\d+)/)
    const r1 = p1 ? +p1[1] : 0
    const r2 = p2 ? +p2[1] : 0
    const w2 = p2 ? +p2[2] : 0

    let result = ''
    if (p1 && p2) {
      if      (r2 > r1) result = `${state.bowlingFirst} won by ${10 - w2} wicket${10 - w2 !== 1 ? 's' : ''}`
      else if (r1 > r2) result = `${state.battingFirst} won by ${r1 - r2} run${r1 - r2 !== 1 ? 's' : ''}`
      else              result = 'Match Tied'
    }

    // Top performers (from combined both innings)
    const allBat  = [...inn1Bat, ...inn2Bat].filter(b => b?.name)
    const allBowl = [...inn1Bowl, ...inn2Bowl].filter(b => b?.name)
    const tb  = allBat.sort( (a: any, b: any) => (b.runs || 0) - (a.runs || 0))[0]
    const tbw = allBowl.filter((b: any) => (b.wickets || 0) > 0).sort((a: any, b: any) => (b.wickets || 0) - (a.wickets || 0))[0]
    const hl  = {
      topBatter: tb  ? { name: tb.name,  runs: tb.runs||0, balls: tb.balls||0, fours: tb.fours||0, sixes: tb.sixes||0, sr: tb.balls>0 ? ((tb.runs/tb.balls)*100).toFixed(1):'—' } : null,
      topBowler: tbw ? { name: tbw.name, wickets: tbw.wickets||0, runs: tbw.runsConceded||0, eco: (tbw.economy||0).toFixed(2) } : null,
    }

    try {
      await api(`/matches/${m.id}/finish`, 'POST', {
        result,
        s1: m.score1,
        s2: scoreStr,
        highlights: hl,
        innings1: inn1,
        innings2: { batters: state.batters || {}, bowlers: state.bowlers || {} },
        // Tell backend exactly which team batted which innings for correct stat attribution
        battingFirst:  state.battingFirst,
        bowlingFirst:  state.bowlingFirst,
      })
      await api('/live', 'DELETE')
      setLive(null)
      toast.success(`🏆 ${result || 'Match ended'}`)
      try {
        await api('/notifications/send', 'POST', {
          title: '🏆 Match Result',
          body: `${m.team1?.name} vs ${m.team2?.name} — ${result}`,
          icon: '🏆', url: '/',
        })
      } catch {}
    } catch (e: any) { toast.error(e.message) }
  }

  const endMatch = async () => {
    if (!live || !confirm('End match now? Cannot be undone.')) return
    const state = JSON.parse(JSON.stringify(live))
    flush(state)
    if (state.innings === 2) { await finishMatch(state, ss(state)) }
    else {
      try {
        const m = matches.find(x => x.id === state.matchId)
        if (m) await api(`/matches/${m.id}/status`, 'POST', { status: 'upcoming' })
        await api('/live', 'DELETE')
        setLive(null)
        toast('Match ended')
      } catch {}
    }
  }

  const swapStrike = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const t = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = t
    try { await save(lv); toast(`🔄 Strike → ${lv.striker?.name || '?'}`) } catch {}
  }

  const selectStriker = async (name: string) => {
    if (!live) return
    if (live.nonstriker?.name === name) { toast.error('Already non-striker'); return }
    const lv = JSON.parse(JSON.stringify(live))
    flush(lv)
    const ex = Object.values(lv.batters || {}).find((b: any) => b.name === name && !b.out) as any
    lv.striker = ex ? { ...ex } : { name, runs: 0, balls: 0, fours: 0, sixes: 0 }
    try { await save(lv); toast.success(`⚡ ${name} on strike`) } catch {}
  }

  const selectNonStriker = async (name: string) => {
    if (!live) return
    if (live.striker?.name === name) { toast.error('Already on strike'); return }
    const lv = JSON.parse(JSON.stringify(live))
    flush(lv)
    const ex = Object.values(lv.batters || {}).find((b: any) => b.name === name && !b.out) as any
    lv.nonstriker = ex ? { ...ex } : { name, runs: 0, balls: 0, fours: 0, sixes: 0 }
    try { await save(lv); toast.success(`🏏 ${name} non-striker`) } catch {}
  }

  const selectBowler = async (name: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    flush(lv)
    // Restore previous stats for this bowler if they bowled before
    const ex = Object.values(lv.bowlers || {}).find((b: any) => b.name === name) as any
    if (ex) {
      // Always recalc economy from raw data — never trust stored stale value
      const restoredEco = calcEco(ex.ballsBowled || 0, ex.runsConceded || 0)
      lv.currentBowler = { ...ex, economy: restoredEco }
    } else {
      lv.currentBowler = { name, ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    }
    try { await save(lv); toast.success(`🎯 ${name} bowling`) } catch {}
  }

  // ── Squad pickers ─────────────────────────────────────────────────
  const [batSquad,  setBatSquad]  = useState<any[]>([])
  const [bowlSquad, setBowlSquad] = useState<any[]>([])

  useEffect(() => {
    if (!live?.matchId) return
    const battingNow = live.innings === 2 ? live.bowlingFirst : live.battingFirst
    const bowlingNow = live.innings === 2 ? live.battingFirst : live.bowlingFirst
    const batT  = teams.find(t => t.name === battingNow)
    const bowlT = teams.find(t => t.name === bowlingNow)
    if (batT)  api(`/squads/${batT.id}` ).then((r: any) => setBatSquad(r.data  || r)).catch(() => {})
    if (bowlT) api(`/squads/${bowlT.id}`).then((r: any) => setBowlSquad(r.data || r)).catch(() => {})
  }, [live?.matchId, live?.innings])

  const outNames   = live ? Object.values(live.batters || {}).filter((b: any) => b.out).map((b: any) => b.name) : []
  const ov  = live ? Math.floor(live.balls / 6) : 0
  const bl  = live ? live.balls % 6 : 0
  const mo  = live ? movers(live) : 10
  const battingNow = live?.innings === 2 ? live?.bowlingFirst : live?.battingFirst

  return (
    <div className="space-y-4">
      {/* Match selector */}
      <div>
        <label className="text-xs text-[#8892b0] mb-1.5 block">Select Match</label>
        <select className="select-field" value={selMatch}
          onChange={e => { setSelMatch(e.target.value); if (e.target.value) startLive(e.target.value) }}>
          <option value="">— Select match to go live —</option>
          {upcomingAndLive.map(m => (
            <option key={m.id} value={m.id}>
              [{m.matchNo || '?'}] {m.team1.name} vs {m.team2.name} {m.status === 'live' ? '🔴' : ''}
            </option>
          ))}
        </select>
      </div>

      {live && (
        <div id="liveControls" className="space-y-4">
          {/* Live scoreboard */}
          <div className="card-gold p-4 text-center rounded-xl">
            <div className="text-[10px] text-[#8892b0] tracking-widest uppercase mb-1">
              Inn {live.innings} · {battingNow} batting · {ov}.{bl} / {mo} ov
              {live.target ? ` · Target ${live.target}` : ''}
            </div>
            <div className="font-mono text-5xl text-[#f0c040] font-black tracking-tight">
              {live.runs}/{live.wickets}
            </div>
            <div className="mt-2 space-y-1 text-left">
              {live.striker?.name
                ? <div className="text-xs text-[#f0c040] bg-[#f0c040]/5 rounded-lg px-3 py-1.5">
                    ⚡ <b>{live.striker.name}*</b> — {live.striker.runs}({live.striker.balls}) · 4s:{live.striker.fours||0} · 6s:{live.striker.sixes||0}
                  </div>
                : <div className="text-xs text-amber-400 animate-pulse px-3">⚡ SELECT STRIKER ↓</div>
              }
              {live.nonstriker?.name && (
                <div className="text-xs text-[#8892b0] px-3">
                  🏏 {live.nonstriker.name} — {live.nonstriker.runs}({live.nonstriker.balls})
                </div>
              )}
              {live.currentBowler?.name
                ? <div className="text-xs text-red-400 bg-red-500/5 rounded-lg px-3 py-1.5">
                    🎯 <b>{live.currentBowler.name}</b> — {Math.floor((live.currentBowler.ballsBowled||0)/6)}.{(live.currentBowler.ballsBowled||0)%6} ov · {live.currentBowler.wickets}W · {live.currentBowler.runsConceded}R · Eco:{(live.currentBowler.economy||0).toFixed(1)}
                  </div>
                : <div className="text-xs text-amber-400 animate-pulse px-3">🎯 SELECT BOWLER ↓</div>
              }
            </div>
          </div>

          {/* Last balls */}
          {(live.lastBalls || []).length > 0 && (
            <div className="flex gap-1.5 flex-wrap justify-center">
              {(live.lastBalls || []).slice(-12).map((b: string, i: number) => {
                const c = b==='W'?'ball-W':b==='6'?'ball-6':b==='4'?'ball-4':(b==='Wd'||b==='NB')?'ball-WD':(b==='•'||b==='0')?'ball-0':'ball-n'
                return <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${c}`}>{b==='•'?'0':b}</div>
              })}
            </div>
          )}

          {/* Scoring pad */}
          <div className="space-y-2">
            <p className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center font-semibold">Runs (ball counted)</p>
            <div className="grid grid-cols-4 gap-2">
              {[0,1,2,3].map(r => (
                <button key={r} onClick={() => addRun(r)}
                  className="bg-[#1e2a4a] text-white rounded-xl py-3 font-display text-xl hover:bg-[#f0c040]/20 active:scale-95 transition-all border border-white/[0.04]">
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addRun(4)} className="bg-[#f0c040]/20 text-[#f0c040] rounded-xl py-3 font-display text-2xl font-bold hover:bg-[#f0c040]/30 active:scale-95 border border-[#f0c040]/20">4</button>
              <button onClick={() => addRun(6)} className="bg-emerald-500/20 text-emerald-400 rounded-xl py-3 font-display text-2xl font-bold hover:bg-emerald-500/30 active:scale-95 border border-emerald-500/20">6</button>
            </div>

            <p className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center font-semibold mt-1">Extras (ball NOT counted)</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addWide}   className="bg-amber-500/15 text-amber-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-amber-500/20">↔️ WD Wide</button>
              <button onClick={addNoBall} className="bg-amber-500/15 text-amber-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-amber-500/20">🚫 NB No Ball</button>
            </div>

            <p className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center font-semibold mt-1">Wickets (ball counted)</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addWicket('Bowled')}     className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-red-500/20">BWD Bowled</button>
              <button onClick={() => addWicket('Caught')}     className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-red-500/20">CT Caught</button>
              <button onClick={() => addWicket('LBW')}        className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-red-500/20">LBW</button>
              <button onClick={addRunOut}                     className="bg-orange-500/15 text-orange-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-orange-500/20">⚡ RO Run Out</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addWicket('Stumped')}    className="bg-red-500/10 text-red-400 rounded-xl py-2 font-bold text-xs active:scale-95 border border-red-500/15">Stumped</button>
              <button onClick={() => addWicket('Hit Wicket')} className="bg-red-500/10 text-red-400 rounded-xl py-2 font-bold text-xs active:scale-95 border border-red-500/15">Hit Wicket</button>
            </div>
          </div>

          {/* Player pickers */}
          <PlayerPicker label="⚡ STRIKER (batting)"     squad={batSquad}  selected={live.striker?.name}       disabled={[...outNames, live.nonstriker?.name||'']} onSelect={selectStriker} />
          <PlayerPicker label="🏏 NON-STRIKER"           squad={batSquad}  selected={live.nonstriker?.name}    disabled={[...outNames, live.striker?.name||'']}    onSelect={selectNonStriker} />
          <PlayerPicker label="🎯 CURRENT BOWLER"        squad={bowlSquad} selected={live.currentBowler?.name} disabled={[]}                                         onSelect={selectBowler} />

          <div className="grid grid-cols-2 gap-2">
            <button onClick={swapStrike}     className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95">🔄 Swap Strike</button>
            <button onClick={() => endInnings()} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95">🏁 End Innings</button>
          </div>
          <button onClick={endMatch} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95">❌ End Match</button>
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
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white/[0.02] rounded-xl border border-white/[0.04]">
        {squad.length === 0 && <p className="text-[11px] text-[#4a5568] w-full text-center py-1">No squad — use custom below</p>}
        {squad.map(p => {
          const isOut = disabled.includes(p.name)
          const isSel = selected === p.name
          return (
            <button key={p.id} disabled={isOut} onClick={() => onSelect(p.name)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                ${isSel ? 'bg-[#f0c040]/20 text-[#f0c040] border border-[#f0c040]/30'
                : isOut ? 'opacity-25 cursor-not-allowed text-[#4a5568] line-through'
                : 'bg-white/[0.04] text-[#8892b0] hover:text-white hover:bg-white/[0.08] active:scale-95'}`}>
              {p.name}{isSel ? ' ✓' : ''}
            </button>
          )
        })}
        <div className="flex gap-1 w-full mt-1">
          <input
            className="flex-1 bg-[#161f38] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#f0c040]/30"
            placeholder="Custom player name..."
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { onSelect(custom.trim()); setCustom('') }}}
          />
          <button
            onClick={() => { if (custom.trim()) { onSelect(custom.trim()); setCustom('') }}}
            className="bg-[#f0c040]/10 text-[#f0c040] rounded-lg px-3 py-1 text-[11px] font-bold active:scale-95 border border-[#f0c040]/20">
            +
          </button>
        </div>
      </div>
    </div>
  )
}
