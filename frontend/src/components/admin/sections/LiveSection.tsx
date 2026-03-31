import { useState, useEffect } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'

// ── Overlay API helper ──────────────────────────────────────────────
const postOverlay = (patch: any) => api('/overlay', 'POST', patch).catch(() => {})

export default function LiveSection() {
  const { matches, teams, live, setLive } = useStore()
  const [selMatch, setSelMatch] = useState(live?.matchId || '')
  const upcomingAndLive = matches.filter(m => ['upcoming', 'live'].includes(m.status))

  // Overlay panel toggles
  const [ovState, setOvState] = useState<any>({
    squadComparison: false, scoreCard: false, batterCard: false,
    bowlerFigures: false, hotPlayer: false, topBatters: false,
    topBowlers: false, runsRequired: false,
  })

  // Load current overlay state on mount
  useEffect(() => {
    api('/overlay', 'GET').then((r: any) => { if (r?.data) setOvState(r.data) }).catch(() => {})
  }, [])

  const toggleOverlay = async (key: string, extra?: any) => {
    const next = { ...ovState, [key]: !ovState[key], ...(extra || {}) }
    setOvState(next)
    await postOverlay(next)
    toast(next[key] ? `👁 ${key} shown on overlay` : `🚫 ${key} hidden`)
  }

  const setOverlay = async (patch: any) => {
    const next = { ...ovState, ...patch }
    setOvState(next)
    await postOverlay(next)
  }

  const hideAll = async () => {
    const next = {
      squadComparison: false, scoreCard: false, batterCard: false,
      bowlerFigures: false, hotPlayer: false, topBatters: false,
      topBowlers: false, runsRequired: false,
    }
    setOvState(next)
    await postOverlay(next)
    toast('🚫 All overlay panels hidden')
  }

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
        striker: { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
        nonstriker: { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
        currentBowler: { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 },
        batters: {}, bowlers: {}, extras: { wide: 0, noball: 0 }, lastBalls: [],
      }
      await api('/live', 'PUT', ls)
      setLive(ls)
      toast.success(`🔴 LIVE! ${battingFirst} batting`)
    } catch (e: any) { toast.error(e.message) }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  const pkey = (n: string) => n.replace(/[.#$[\]/\s]/g, '_')

  const flush = (lv: any) => {
    lv.batters = lv.batters || {}
    lv.bowlers = lv.bowlers || {}
    if (lv.striker?.name) lv.batters[pkey(lv.striker.name)] = { ...lv.striker }
    if (lv.nonstriker?.name) lv.batters[pkey(lv.nonstriker.name)] = { ...lv.nonstriker }
    if (lv.currentBowler?.name) lv.bowlers[pkey(lv.currentBowler.name)] = { ...lv.currentBowler }
  }

  const calcEco = (balls: number, runs: number) =>
    !balls ? 0 : Math.round((runs / (balls / 6)) * 100) / 100

  const ballsToOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`

  const movers = (lv: any) => matches.find(x => x.id === lv.matchId)?.overs || 10

  const ss = (lv: any) => {
    const ov = Math.floor(lv.balls / 6), bl = lv.balls % 6
    return `${lv.runs}/${lv.wickets} (${ov}.${bl})`
  }

  const save = async (lv: any) => {
    flush(lv)
    await api('/live', 'PUT', lv)
    setLive({ ...lv })
  }

  const rotateStrike = (lv: any, runs: number, isEndOfOver: boolean) => {
    const isOdd = runs % 2 !== 0
    if (isOdd) { const t = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = t }
    if (isEndOfOver && !isOdd) { const t = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = t }
  }

  const addRun = async (r: number) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += r; lv.balls += 1
    if (lv.striker?.name) {
      lv.striker.runs += r; lv.striker.balls += 1
      if (r === 4) lv.striker.fours = (lv.striker.fours || 0) + 1
      if (r === 6) lv.striker.sixes = (lv.striker.sixes || 0) + 1
    }
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled += 1; lv.currentBowler.runsConceded += r
      lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled, lv.currentBowler.runsConceded)
    }
    lv.lastBalls = [...(lv.lastBalls || []), r === 0 ? '•' : String(r)]
    const isEOO = lv.balls % 6 === 0
    rotateStrike(lv, r, isEOO)
    if (isEOO) { flush(lv); lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 } }
    if (lv.balls >= movers(lv) * 6) { await endInnings(lv); return }
    try { await save(lv) } catch (e: any) { toast.error(e.message) }
  }

  const addWide = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1; lv.extras = { ...lv.extras, wide: (lv.extras?.wide || 0) + 1 }
    if (lv.currentBowler?.name) { lv.currentBowler.runsConceded += 1; lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled, lv.currentBowler.runsConceded) }
    lv.lastBalls = [...(lv.lastBalls || []), 'Wd']
    try { await save(lv); toast('↔️ Wide +1') } catch (e: any) { toast.error(e.message) }
  }

  const addNoBall = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1; lv.extras = { ...lv.extras, noball: (lv.extras?.noball || 0) + 1 }
    if (lv.currentBowler?.name) { lv.currentBowler.runsConceded += 1; lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled, lv.currentBowler.runsConceded) }
    lv.lastBalls = [...(lv.lastBalls || []), 'NB']
    try { await save(lv); toast('🚫 No Ball +1') } catch (e: any) { toast.error(e.message) }
  }

  const addWicket = async (how: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.wickets += 1; lv.balls += 1
    if (lv.striker?.name) { lv.striker.out = true; lv.striker.how = how }
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled += 1; lv.currentBowler.wickets += 1
      lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled, lv.currentBowler.runsConceded)
    }
    lv.lastBalls = [...(lv.lastBalls || []), 'W']
    flush(lv)

    // ── AUTO: Show batter dismissal card on overlay ───────────────
    const outBatter = live.striker
    if (outBatter?.name) {
      const bData = {
        name: outBatter.name, how,
        runs: outBatter.runs || 0, balls: outBatter.balls || 0,
        fours: outBatter.fours || 0, sixes: outBatter.sixes || 0,
      }
      const ns = { ...ovState, batterCard: true, batterData: bData }
      setOvState(ns); postOverlay(ns)
      // Auto-hide batter card after 8 seconds
      setTimeout(async () => {
        const nh = { ...ns, batterCard: false }
        setOvState(nh); postOverlay(nh)
      }, 8000)
    }

    lv.striker = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 }
    const isEOO = lv.balls % 6 === 0
    if (isEOO) lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    if (lv.wickets >= 10 || lv.balls >= movers(lv) * 6) { await endInnings(lv); return }
    try { await save(lv); toast.error(`🎯 ${how}! Select new batter`) } catch (e: any) { toast.error(e.message) }
  }

  const addRunOut = async () => {
    if (!live) return
    const runs = parseInt(prompt('Runs before run-out (0 = direct):', '0') || '0') || 0
    const lv = JSON.parse(JSON.stringify(live))
    lv.wickets += 1; lv.balls += 1; lv.runs += runs
    if (lv.striker?.name) { lv.striker.runs += runs; lv.striker.balls += 1; lv.striker.out = true; lv.striker.how = 'Run Out' }
    if (lv.currentBowler?.name) {
      lv.currentBowler.ballsBowled += 1; lv.currentBowler.runsConceded += runs
      lv.currentBowler.economy = calcEco(lv.currentBowler.ballsBowled, lv.currentBowler.runsConceded)
    }
    lv.lastBalls = [...(lv.lastBalls || []), 'W']
    flush(lv)

    // AUTO: batter card
    const outBatter = live.striker
    if (outBatter?.name) {
      const bData = { name: outBatter.name, how: 'Run Out', runs: (outBatter.runs||0)+runs, balls: (outBatter.balls||0)+1, fours: outBatter.fours||0, sixes: outBatter.sixes||0 }
      const ns = { ...ovState, batterCard: true, batterData: bData }
      setOvState(ns); postOverlay(ns)
      setTimeout(async () => { const nh={...ns,batterCard:false};setOvState(nh);postOverlay(nh) }, 8000)
    }

    lv.striker = { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 }
    const isEOO = lv.balls % 6 === 0
    if (isEOO) lv.currentBowler = { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 }
    if (lv.wickets >= 10 || lv.balls >= movers(lv) * 6) { await endInnings(lv); return }
    try { await save(lv); toast.error('💨 Run Out! Select new batter') } catch (e: any) { toast.error(e.message) }
  }

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
          ...state, innings: 2, runs: 0, wickets: 0, balls: 0, target: state.runs + 1,
          striker: { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
          nonstriker: { name: '', runs: 0, balls: 0, fours: 0, sixes: 0 },
          currentBowler: { name: '', ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 },
          batters: {}, bowlers: {}, lastBalls: [],
        }
        await api('/live', 'PUT', ns)
        setLive(ns)

        // AUTO: Show inn1 scorecard
        const inn1Data = { batters: state.batters, bowlers: state.bowlers, scoreStr, inn: 1, teamName: state.battingFirst }
        const ov2 = { ...ovState, scoreCard: true, scorecardData: inn1Data }
        setOvState(ov2); postOverlay(ov2)

        toast.success(`✅ Inn 1 done — Target ${state.runs + 1}`)
      } catch (e: any) { toast.error(e.message) }
    } else {
      await finishMatch(state, scoreStr)
    }
  }

  const finishMatch = async (state: any, scoreStr: string) => {
    const m = matches.find(x => x.id === state.matchId)
    if (!m) return
    flush(state)
    const inn1 = (m.innings1 as any) || {}
    const inn1Bat = Object.values(inn1.batters || {}) as any[]
    const inn1Bowl = Object.values(inn1.bowlers || {}) as any[]
    const inn2Bat = Object.values(state.batters || {}) as any[]
    const inn2Bowl = Object.values(state.bowlers || {}) as any[]
    const p1 = (m.score1 || '').match(/^(\d+)\/(\d+)/)
    const p2 = scoreStr.match(/^(\d+)\/(\d+)/)
    const r1 = p1 ? +p1[1] : 0, r2 = p2 ? +p2[1] : 0, w2 = p2 ? +p2[2] : 0
    let result = ''
    if (p1 && p2) {
      if (r2 > r1) result = `${state.bowlingFirst} won by ${10 - w2} wicket${10 - w2 !== 1 ? 's' : ''}`
      else if (r1 > r2) result = `${state.battingFirst} won by ${r1 - r2} run${r1 - r2 !== 1 ? 's' : ''}`
      else result = 'Match Tied'
    }
    const allBat = [...inn1Bat, ...inn2Bat].filter(b => b?.name)
    const allBowl = [...inn1Bowl, ...inn2Bowl].filter(b => b?.name)
    const tb = allBat.sort((a: any, b: any) => (b.runs || 0) - (a.runs || 0))[0]
    const tbw = allBowl.filter((b: any) => (b.wickets || 0) > 0).sort((a: any, b: any) => (b.wickets || 0) - (a.wickets || 0))[0]
    const hl = {
      topBatter: tb ? { name: tb.name, runs: tb.runs || 0, balls: tb.balls || 0, fours: tb.fours || 0, sixes: tb.sixes || 0, sr: tb.balls > 0 ? ((tb.runs / tb.balls) * 100).toFixed(1) : '—' } : null,
      topBowler: tbw ? { name: tbw.name, wickets: tbw.wickets || 0, runs: tbw.runsConceded || 0, eco: (tbw.economy || 0).toFixed(2) } : null,
    }
    try {
      await api(`/matches/${m.id}/finish`, 'POST', {
        result, s1: m.score1, s2: scoreStr, highlights: hl, innings1: inn1,
        innings2: { batters: state.batters || {}, bowlers: state.bowlers || {} },
        battingFirst: state.battingFirst, bowlingFirst: state.bowlingFirst,
      })
      await api('/live', 'DELETE')
      setLive(null)
      toast.success(`🏆 ${result || 'Match ended'}`)
      try { await api('/notifications/send', 'POST', { title: '🏆 Match Result', body: `${m.team1?.name} vs ${m.team2?.name} — ${result}`, icon: '🏆', url: '/' }) } catch { }
    } catch (e: any) { toast.error(e.message) }
  }

  const endMatch = async () => {
    if (!live || !confirm('End match now? Cannot be undone.')) return
    const state = JSON.parse(JSON.stringify(live)); flush(state)
    if (state.innings === 2) { await finishMatch(state, ss(state)) }
    else {
      try {
        const m = matches.find(x => x.id === state.matchId)
        if (m) await api(`/matches/${m.id}/status`, 'POST', { status: 'upcoming' })
        await api('/live', 'DELETE'); setLive(null); toast('Match ended')
      } catch { }
    }
  }

  const swapStrike = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const t = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = t
    try { await save(lv); toast(`🔄 Strike → ${lv.striker?.name || '?'}`) } catch { }
  }

  const selectStriker = async (name: string) => {
    if (!live) return
    if (live.nonstriker?.name === name) { toast.error('Already non-striker'); return }
    const lv = JSON.parse(JSON.stringify(live)); flush(lv)
    const ex = Object.values(lv.batters || {}).find((b: any) => b.name === name && !b.out) as any
    lv.striker = ex ? { ...ex } : { name, runs: 0, balls: 0, fours: 0, sixes: 0 }
    try { await save(lv); toast.success(`⚡ ${name} on strike`) } catch { }
  }

  const selectNonStriker = async (name: string) => {
    if (!live) return
    if (live.striker?.name === name) { toast.error('Already on strike'); return }
    const lv = JSON.parse(JSON.stringify(live)); flush(lv)
    const ex = Object.values(lv.batters || {}).find((b: any) => b.name === name && !b.out) as any
    lv.nonstriker = ex ? { ...ex } : { name, runs: 0, balls: 0, fours: 0, sixes: 0 }
    try { await save(lv); toast.success(`🏏 ${name} non-striker`) } catch { }
  }

  const selectBowler = async (name: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live)); flush(lv)
    const ex = Object.values(lv.bowlers || {}).find((b: any) => b.name === name) as any
    if (ex) { lv.currentBowler = { ...ex, economy: calcEco(ex.ballsBowled || 0, ex.runsConceded || 0) } }
    else { lv.currentBowler = { name, ballsBowled: 0, wickets: 0, runsConceded: 0, economy: 0 } }
    try { await save(lv); toast.success(`🎯 ${name} bowling`) } catch { }
  }

  const [batSquad, setBatSquad] = useState<any[]>([])
  const [bowlSquad, setBowlSquad] = useState<any[]>([])

  useEffect(() => {
    if (!live?.matchId) return
    const battingNow = live.innings === 2 ? live.bowlingFirst : live.battingFirst
    const bowlingNow = live.innings === 2 ? live.battingFirst : live.bowlingFirst
    const batT = teams.find(t => t.name === battingNow)
    const bowlT = teams.find(t => t.name === bowlingNow)
    if (batT) api(`/squads/${batT.id}`).then((r: any) => setBatSquad(r.data || r)).catch(() => { })
    if (bowlT) api(`/squads/${bowlT.id}`).then((r: any) => setBowlSquad(r.data || r)).catch(() => { })
  }, [live?.matchId, live?.innings])

  const outNames = live ? Object.values(live.batters || {}).filter((b: any) => b.out).map((b: any) => b.name) : []
  const ov = live ? Math.floor(live.balls / 6) : 0
  const bl = live ? live.balls % 6 : 0
  const mo = live ? movers(live) : 10
  const battingNow = live?.innings === 2 ? live?.bowlingFirst : live?.battingFirst

  // ── Overlay panel helpers ────────────────────────────────────────
  const m = live ? matches.find(x => x.id === live.matchId) : null

  const showSquadComparison = async () => {
    if (!m) { toast.error('No live match'); return }
    const squadData = {
      team1: { name: m.team1.name, squad: m.team1.squad || [] },
      team2: { name: m.team2.name, squad: m.team2.squad || [] },
    }
    await setOverlay({ squadComparison: true, squadData })
    toast.success('✅ Squad panel shown')
  }

  const showScorecardPanel = async (which: 'inn1' | 'inn2') => {
    if (!live || !m) { toast.error('No live match'); return }
    flush(JSON.parse(JSON.stringify(live)))
    const isInn1 = which === 'inn1'
    const inn = isInn1 ? (m.innings1 as any) || {} : { batters: live.batters, bowlers: live.bowlers }
    const teamName = isInn1 ? live.battingFirst : (live.innings === 2 ? live.bowlingFirst : live.battingFirst)
    const scoreStr = isInn1 ? m.score1 || '' : ss(live)
    const scorecardData = { batters: inn.batters || {}, bowlers: inn.bowlers || {}, scoreStr, inn: isInn1 ? 1 : 2, teamName }
    await setOverlay({ scoreCard: true, scorecardData })
    toast.success(`✅ Scorecard Inn${isInn1 ? 1 : 2} shown`)
  }

  const showBowlerCard = async () => {
    if (!live?.currentBowler?.name) { toast.error('No current bowler'); return }
    await setOverlay({ bowlerFigures: true, bowlerData: live.currentBowler })
    toast.success('✅ Bowler figures shown')
  }

  const showBatterCard = async (batter: any) => {
    if (!batter?.name) { toast.error('Select a batter'); return }
    await setOverlay({ batterCard: true, batterData: batter })
    toast.success(`✅ ${batter.name}'s card shown`)
  }

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
                  ⚡ <b>{live.striker.name}*</b> — {live.striker.runs}({live.striker.balls}) · 4s:{live.striker.fours || 0} · 6s:{live.striker.sixes || 0}
                </div>
                : <div className="text-xs text-amber-400 animate-pulse px-3">⚡ SELECT STRIKER ↓</div>
              }
              {live.nonstriker?.name && (
                <div className="text-xs text-[#8892b0] px-3">🏏 {live.nonstriker.name} — {live.nonstriker.runs}({live.nonstriker.balls})</div>
              )}
              {live.currentBowler?.name
                ? <div className="text-xs text-red-400 bg-red-500/5 rounded-lg px-3 py-1.5">
                  🎯 <b>{live.currentBowler.name}</b> — {Math.floor((live.currentBowler.ballsBowled || 0) / 6)}.{(live.currentBowler.ballsBowled || 0) % 6} ov · {live.currentBowler.wickets}W · {live.currentBowler.runsConceded}R · Eco:{(live.currentBowler.economy || 0).toFixed(1)}
                </div>
                : <div className="text-xs text-amber-400 animate-pulse px-3">🎯 SELECT BOWLER ↓</div>
              }
            </div>
          </div>

          {/* Last balls */}
          {(live.lastBalls || []).length > 0 && (
            <div className="flex gap-1.5 flex-wrap justify-center">
              {(live.lastBalls || []).slice(-12).map((b: string, i: number) => {
                const c = b === 'W' ? 'ball-W' : b === '6' ? 'ball-6' : b === '4' ? 'ball-4' : (b === 'Wd' || b === 'NB') ? 'ball-WD' : (b === '•' || b === '0') ? 'ball-0' : 'ball-n'
                return <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${c}`}>{b === '•' ? '0' : b}</div>
              })}
            </div>
          )}

          {/* Scoring pad */}
          <div className="space-y-2">
            <p className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center font-semibold">Runs (ball counted)</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(r => (
                <button key={r} onClick={() => addRun(r)} className="bg-[#1e2a4a] text-white rounded-xl py-3 font-display text-xl hover:bg-[#f0c040]/20 active:scale-95 transition-all border border-white/[0.04]">{r}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addRun(4)} className="bg-[#f0c040]/20 text-[#f0c040] rounded-xl py-3 font-display text-2xl font-bold hover:bg-[#f0c040]/30 active:scale-95 border border-[#f0c040]/20">4</button>
              <button onClick={() => addRun(6)} className="bg-emerald-500/20 text-emerald-400 rounded-xl py-3 font-display text-2xl font-bold hover:bg-emerald-500/30 active:scale-95 border border-emerald-500/20">6</button>
            </div>
            <p className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center font-semibold mt-1">Extras (ball NOT counted)</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addWide} className="bg-amber-500/15 text-amber-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-amber-500/20">↔️ WD Wide</button>
              <button onClick={addNoBall} className="bg-amber-500/15 text-amber-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-amber-500/20">🚫 NB No Ball</button>
            </div>
            <p className="text-[10px] text-[#4a5568] uppercase tracking-widest text-center font-semibold mt-1">Wickets (ball counted)</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addWicket('Bowled')} className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-red-500/20">BWD Bowled</button>
              <button onClick={() => addWicket('Caught')} className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-red-500/20">CT Caught</button>
              <button onClick={() => addWicket('LBW')} className="bg-red-500/15 text-red-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-red-500/20">LBW</button>
              <button onClick={addRunOut} className="bg-orange-500/15 text-orange-400 rounded-xl py-2.5 font-bold text-sm active:scale-95 border border-orange-500/20">⚡ RO Run Out</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addWicket('Stumped')} className="bg-red-500/10 text-red-400 rounded-xl py-2 font-bold text-xs active:scale-95 border border-red-500/15">Stumped</button>
              <button onClick={() => addWicket('Hit Wicket')} className="bg-red-500/10 text-red-400 rounded-xl py-2 font-bold text-xs active:scale-95 border border-red-500/15">Hit Wicket</button>
            </div>
          </div>

          {/* Player pickers */}
          <PlayerPicker label="⚡ STRIKER (batting)" squad={batSquad} selected={live.striker?.name} disabled={[...outNames, live.nonstriker?.name || '']} onSelect={selectStriker} />
          <PlayerPicker label="🏏 NON-STRIKER" squad={batSquad} selected={live.nonstriker?.name} disabled={[...outNames, live.striker?.name || '']} onSelect={selectNonStriker} />
          <PlayerPicker label="🎯 CURRENT BOWLER" squad={bowlSquad} selected={live.currentBowler?.name} disabled={[]} onSelect={selectBowler} />

          <div className="grid grid-cols-2 gap-2">
            <button onClick={swapStrike} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95">🔄 Swap Strike</button>
            <button onClick={() => endInnings()} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95">🏁 End Innings</button>
          </div>
          <button onClick={endMatch} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95">❌ End Match</button>

          {/* ═══════════════════════════════════════
              OVERLAY CONTROLS PANEL
          ═══════════════════════════════════════ */}
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#f0c040] uppercase tracking-widest font-black">📺 Overlay Controls</p>
              <button onClick={hideAll} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-2.5 py-1 font-semibold active:scale-95">🚫 Hide All</button>
            </div>

            {/* 1. Squad Comparison */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">1 · Squad Comparison</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={showSquadComparison}
                  className="bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-xl py-2 text-xs font-bold active:scale-95">
                  ⚔️ Show Squads
                </button>
                <button onClick={() => setOverlay({ squadComparison: false })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${ovState.squadComparison ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-white/[0.03] text-[#4a5568] border-white/[0.04]'}`}>
                  {ovState.squadComparison ? '✕ Hide' : '(hidden)'}
                </button>
              </div>
            </div>

            {/* 2. Scorecard */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">2 · Score Card</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => showScorecardPanel('inn1')}
                  className="bg-sky-500/15 text-sky-300 border border-sky-500/25 rounded-xl py-2 text-xs font-bold active:scale-95">
                  📋 Inn 1
                </button>
                <button onClick={() => showScorecardPanel('inn2')}
                  className="bg-sky-500/15 text-sky-300 border border-sky-500/25 rounded-xl py-2 text-xs font-bold active:scale-95">
                  📋 Inn 2
                </button>
                <button onClick={() => setOverlay({ scoreCard: false })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${ovState.scoreCard ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-white/[0.03] text-[#4a5568] border-white/[0.04]'}`}>
                  {ovState.scoreCard ? '✕ Hide' : '(hidden)'}
                </button>
              </div>
            </div>

            {/* 3. Batter Card */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">3 · Batter Card (auto on wicket)</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => showBatterCard(live.striker)}
                  className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-xl py-2 text-xs font-bold active:scale-95">
                  🏏 Striker Card
                </button>
                <button onClick={() => setOverlay({ batterCard: false })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${ovState.batterCard ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-white/[0.03] text-[#4a5568] border-white/[0.04]'}`}>
                  {ovState.batterCard ? '✕ Hide' : '(hidden)'}
                </button>
              </div>
            </div>

            {/* 4. Bowler Figures */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">4 · Bowler Figures</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={showBowlerCard}
                  className="bg-orange-500/15 text-orange-300 border border-orange-500/25 rounded-xl py-2 text-xs font-bold active:scale-95">
                  🎯 Show Bowler
                </button>
                <button onClick={() => setOverlay({ bowlerFigures: false })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${ovState.bowlerFigures ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-white/[0.03] text-[#4a5568] border-white/[0.04]'}`}>
                  {ovState.bowlerFigures ? '✕ Hide' : '(hidden)'}
                </button>
              </div>
            </div>

            {/* 5. Hot Player */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">5 · Hot Player (auto-detected)</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setOverlay({ hotPlayer: true })}
                  className="bg-red-500/15 text-red-300 border border-red-500/25 rounded-xl py-2 text-xs font-bold active:scale-95">
                  🔥 Show Hot
                </button>
                <button onClick={() => setOverlay({ hotPlayer: false })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${ovState.hotPlayer ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-white/[0.03] text-[#4a5568] border-white/[0.04]'}`}>
                  {ovState.hotPlayer ? '✕ Hide' : '(hidden)'}
                </button>
              </div>
            </div>

            {/* 6. Leaderboards */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">6 · Leaderboards</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setOverlay({ topBatters: !ovState.topBatters })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border transition-all ${ovState.topBatters ? 'bg-[#f0c040]/20 text-[#f0c040] border-[#f0c040]/30' : 'bg-[#1e2a4a] text-[#8892b0] border-white/[0.06]'}`}>
                  🏆 {ovState.topBatters ? '✓ Batters' : 'Top Batters'}
                </button>
                <button onClick={() => setOverlay({ topBowlers: !ovState.topBowlers })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border transition-all ${ovState.topBowlers ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-[#1e2a4a] text-[#8892b0] border-white/[0.06]'}`}>
                  🎯 {ovState.topBowlers ? '✓ Bowlers' : 'Top Bowlers'}
                </button>
              </div>
            </div>

            {/* 7. Runs Required */}
            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-[#8892b0] uppercase tracking-widest">7 · Runs Required {live.innings !== 2 ? '(Inn 2 only)' : ''}</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setOverlay({ runsRequired: true })}
                  disabled={live.innings !== 2}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${live.innings === 2 ? 'bg-lime-500/15 text-lime-300 border-lime-500/25' : 'opacity-30 bg-white/[0.03] text-[#4a5568] border-white/[0.04] cursor-not-allowed'}`}>
                  🎯 Show RR
                </button>
                <button onClick={() => setOverlay({ runsRequired: false })}
                  className={`rounded-xl py-2 text-xs font-bold active:scale-95 border ${ovState.runsRequired ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-white/[0.03] text-[#4a5568] border-white/[0.04]'}`}>
                  {ovState.runsRequired ? '✕ Hide' : '(hidden)'}
                </button>
              </div>
            </div>

          </div>{/* end overlay controls */}

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
            value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { onSelect(custom.trim()); setCustom('') } }}
          />
          <button onClick={() => { if (custom.trim()) { onSelect(custom.trim()); setCustom('') } }}
            className="bg-[#f0c040]/10 text-[#f0c040] rounded-lg px-3 py-1 text-[11px] font-bold active:scale-95 border border-[#f0c040]/20">+</button>
        </div>
      </div>
    </div>
  )
}
