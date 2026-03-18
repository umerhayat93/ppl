import { useState, useEffect } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'

const OVERS = 10

export default function LiveSection() {
  const { matches, teams, live, setLive } = useStore()
  const [selMatch, setSelMatch] = useState(live?.matchId || '')
  const upcomingAndLive = matches.filter(m => ['upcoming','live'].includes(m.status))

  const startLive = async (mid: string) => {
    const m = matches.find(x => x.id === mid)
    if (!m) return
    if (live?.matchId === mid) return
    if (!confirm(`Start live scoring for ${m.team1.name} vs ${m.team2.name}?`)) return
    const firstBat = prompt(`Who bats first?\n1. ${m.team1.name}\n2. ${m.team2.name}`, '1')
    if (!firstBat) return
    const isT1 = firstBat === '1' || firstBat.toLowerCase() === m.team1.name.toLowerCase()
    const battingFirst = isT1 ? m.team1.name : m.team2.name
    const bowlingFirst = isT1 ? m.team2.name : m.team1.name
    try {
      await api(`/matches/${mid}/status`, 'POST', { status: 'live' })
      const ls = {
        matchId: mid, innings: 1, runs: 0, wickets: 0, balls: 0, target: null,
        battingFirst, bowlingFirst,
        striker: { name:'', runs:0, balls:0, fours:0, sixes:0 },
        nonstriker: { name:'', runs:0, balls:0, fours:0, sixes:0 },
        currentBowler: { name:'', ballsBowled:0, wickets:0, runsConceded:0, economy:0 },
        batters: {}, bowlers: {}, extras: { wide:0, noball:0 }, lastBalls: []
      }
      await api('/live', 'PUT', ls)
      setLive(ls as any)
      toast.success(`🔴 ${m.team1.name} vs ${m.team2.name} LIVE!`)
    } catch (e:any) { toast.error(e.message) }
  }

  const saveLive = async (updated: any) => {
    try {
      flush(updated)
      await api('/live', 'PUT', updated)
      setLive(updated)
    } catch (e:any) { toast.error('Save error: ' + e.message) }
  }

  const flush = (lv: any) => {
    if (lv.striker?.name)       { lv.batters = lv.batters||{}; lv.batters[lv.striker.name.replace(/[.#$[\]/]/g,'_')] = {...lv.striker} }
    if (lv.nonstriker?.name)    { lv.batters = lv.batters||{}; lv.batters[lv.nonstriker.name.replace(/[.#$[\]/]/g,'_')] = {...lv.nonstriker} }
    if (lv.currentBowler?.name) { lv.bowlers = lv.bowlers||{}; lv.bowlers[lv.currentBowler.name.replace(/[.#$[\]/]/g,'_')] = {...lv.currentBowler} }
  }

  const addRun = async (r: number) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const ballsBefore = lv.balls
    lv.runs += r
    lv.balls++
    if (lv.striker) { lv.striker.runs += r; lv.striker.balls++; if(r===4) lv.striker.fours++; if(r===6) lv.striker.sixes++ }
    if (lv.currentBowler) { lv.currentBowler.ballsBowled++; lv.currentBowler.runsConceded += r; const ov=lv.currentBowler.ballsBowled/6; lv.currentBowler.economy=ov>0?lv.currentBowler.runsConceded/ov:0 }
    lv.lastBalls = [...(lv.lastBalls||[]), r===0?'•':String(r)]
    const isEOO = lv.balls % 6 === 0
    if (r%2!==0) { const tmp=lv.striker; lv.striker=lv.nonstriker; lv.nonstriker=tmp }
    if (isEOO && r%2===0) { const tmp=lv.striker; lv.striker=lv.nonstriker; lv.nonstriker=tmp }
    if (isEOO) { lv.currentBowler = { name:'', ballsBowled:0, wickets:0, runsConceded:0, economy:0 } }
    const m = matches.find(x=>x.id===lv.matchId)
    const mo = m?.overs||OVERS
    if (lv.balls >= mo*6) { await endInnings(lv); return }
    await saveLive(lv)
  }

  const addExtra = async (type: 'WD'|'NB') => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.runs += 1
    if (type==='WD') lv.extras.wide = (lv.extras?.wide||0)+1
    else             lv.extras.noball = (lv.extras?.noball||0)+1
    if (lv.currentBowler) { lv.currentBowler.runsConceded += 1; const ov=lv.currentBowler.ballsBowled/6; lv.currentBowler.economy=ov>0?lv.currentBowler.runsConceded/ov:0 }
    lv.lastBalls = [...(lv.lastBalls||[]), type==='WD'?'Wd':'NB']
    await saveLive(lv)
  }

  const addWicket = async (how: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    lv.wickets++
    lv.balls++
    if (lv.striker) { lv.striker.out = true; lv.striker.how = how }
    if (lv.currentBowler) { lv.currentBowler.ballsBowled++; lv.currentBowler.wickets++ }
    lv.lastBalls = [...(lv.lastBalls||[]), 'W']
    flush(lv)
    lv.striker = { name:'', runs:0, balls:0, fours:0, sixes:0 }
    const m = matches.find(x=>x.id===lv.matchId)
    const mo = m?.overs||OVERS
    if (lv.wickets >= 10 || lv.balls >= mo*6) { await endInnings(lv); return }
    await saveLive(lv)
  }

  const endInnings = async (lv?: any) => {
    const state = lv || (live ? JSON.parse(JSON.stringify(live)) : null)
    if (!state) return
    const m = matches.find(x=>x.id===state.matchId)
    const ss = `${state.runs}/${state.wickets} (${Math.floor(state.balls/6)}.${state.balls%6})`
    if (state.innings === 1 && m) {
      try {
        await api(`/matches/${m.id}/inn1`, 'POST', { inn1: { batters:state.batters||{}, bowlers:state.bowlers||{} }, s1: ss })
        const ns = { ...state, innings:2, runs:0, wickets:0, balls:0, target:state.runs+1,
          striker:{name:'',runs:0,balls:0,fours:0,sixes:0}, nonstriker:{name:'',runs:0,balls:0,fours:0,sixes:0},
          currentBowler:{name:'',ballsBowled:0,wickets:0,runsConceded:0,economy:0},
          batters:{}, bowlers:{}, lastBalls:[] }
        await api('/live', 'PUT', ns); setLive(ns as any)
        toast.success(`1st inn done! Target: ${state.runs+1}`)
      } catch(e:any) { toast.error(e.message) }
    } else if (m) {
      await finishMatch(state, ss)
    }
  }

  const finishMatch = async (state: any, ss: string) => {
    const m = matches.find(x=>x.id===state.matchId)
    if (!m) return
    flush(state)
    const inn1 = m.innings1 as any || {}
    const allBat = [...Object.values(inn1.batters||{}), ...Object.values(state.batters||{})] as any[]
    const allBowl= [...Object.values(inn1.bowlers||{}), ...Object.values(state.bowlers||{})] as any[]
    const mo = m.overs||OVERS
    const s1 = m.score1, s2 = ss
    const p1 = s1?.match(/(\d+)\/(\d+)/); const p2 = s2?.match(/(\d+)\/(\d+)/)
    let result = ''
    if (p1 && p2) {
      const r1=+p1[1], r2=+p2[1], w2=+p2[2]
      if (r2>r1) result=`${m.team2.name} won by ${10-w2} wicket${10-w2!==1?'s':''}`
      else if (r1>r2) result=`${m.team1.name} won by ${r1-r2} runs`
      else result='Match Tied'
    }
    const tb  = allBat.filter((b:any)=>b.name).sort((a:any,b:any)=>(b.runs||0)-(a.runs||0))[0]
    const tbw = allBowl.filter((b:any)=>b.name&&(b.wickets||0)>0).sort((a:any,b:any)=>(b.wickets||0)-(a.wickets||0))[0]
    const hl = {
      topBatter: tb ? { name:tb.name, runs:tb.runs||0, balls:tb.balls||0, fours:tb.fours||0, sixes:tb.sixes||0, sr:tb.balls>0?((tb.runs/tb.balls)*100).toFixed(1):'—' } : null,
      topBowler: tbw ? { name:tbw.name, wickets:tbw.wickets||0, runs:tbw.runsConceded||0, eco:(tbw.economy||0).toFixed(2) } : null,
    }
    try {
      await api(`/matches/${m.id}/finish`, 'POST', { result, s1: m.score1, s2: ss, highlights: hl })
      await api('/live', 'DELETE'); setLive(null)
      toast.success(`🏆 ${result}`)
      await api('/notifications/send', 'POST', { title:'🏆 Match Result', body:`${m.team1.name} vs ${m.team2.name} — ${result}`, icon:'🏆' }).catch(()=>{})
    } catch(e:any) { toast.error(e.message) }
  }

  const endMatch = async () => {
    if (!live) return
    if (!confirm('End match now?')) return
    const state = JSON.parse(JSON.stringify(live))
    const ss = `${state.runs}/${state.wickets} (${Math.floor(state.balls/6)}.${state.balls%6})`
    if (state.innings===2) await finishMatch(state, ss)
    else { try { await api('/live','DELETE'); setLive(null) } catch {} }
    toast('Match ended')
  }

  const selectPlayer = async (type: 'striker'|'nonstriker'|'bowler', name: string) => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    if (type==='striker') {
      if (lv.nonstriker?.name===name) { toast.error('Already non-striker'); return }
      flush(lv)
      const ex = Object.values(lv.batters||{}).find((b:any)=>b.name===name&&!b.out) as any
      lv.striker = ex ? {...ex} : { name, runs:0, balls:0, fours:0, sixes:0 }
    } else if (type==='nonstriker') {
      if (lv.striker?.name===name) { toast.error('Already striker'); return }
      flush(lv)
      const ex = Object.values(lv.batters||{}).find((b:any)=>b.name===name&&!b.out) as any
      lv.nonstriker = ex ? {...ex} : { name, runs:0, balls:0, fours:0, sixes:0 }
    } else {
      flush(lv)
      const ex = Object.values(lv.bowlers||{}).find((b:any)=>b.name===name) as any
      lv.currentBowler = ex ? {...ex} : { name, ballsBowled:0, wickets:0, runsConceded:0, economy:0 }
    }
    await saveLive(lv)
    toast.success(`${type==='bowler'?'🎯':'⚡'} ${name}`)
  }

  const swapStrike = async () => {
    if (!live) return
    const lv = JSON.parse(JSON.stringify(live))
    const tmp = lv.striker; lv.striker = lv.nonstriker; lv.nonstriker = tmp
    await saveLive(lv)
    toast(`🔄 Strike → ${lv.striker?.name||'?'}`)
  }

  // Squad pickers
  const [batSquad, setBatSquad] = useState<any[]>([])
  const [bowlSquad, setBowlSquad] = useState<any[]>([])

  useEffect(() => {
    if (!live?.matchId) return
    const m = matches.find(x=>x.id===live.matchId)
    if (!m) return
    const bat = live.innings===2 ? live.bowlingFirst : live.battingFirst
    const bowl= live.innings===2 ? live.battingFirst : live.bowlingFirst
    const batT = teams.find(t=>t.name===bat)
    const bowlT= teams.find(t=>t.name===bowl)
    if (batT) api(`/squads/${batT.id}`).then((r:any)=>setBatSquad(r.data||r)).catch(()=>{})
    if (bowlT) api(`/squads/${bowlT.id}`).then((r:any)=>setBowlSquad(r.data||r)).catch(()=>{})
  }, [live?.matchId, live?.innings, live?.balls])

  const outNames = Object.values(live?.batters||{}).filter((b:any)=>b.out).map((b:any)=>b.name)
  const ov = live ? Math.floor(live.balls/6) : 0
  const bl = live ? live.balls%6 : 0

  return (
    <div className="space-y-4">
      {/* Match selector */}
      <div>
        <label className="text-xs text-[#8892b0] mb-1.5 block">Select Match to Go Live</label>
        <select className="select-field" value={selMatch} onChange={e=>{ setSelMatch(e.target.value); if(e.target.value) startLive(e.target.value) }}>
          <option value="">— Select match —</option>
          {upcomingAndLive.map(m=>(
            <option key={m.id} value={m.id}>[{m.matchNo||'?'}] {m.team1.name} vs {m.team2.name} {m.status==='live'?'🔴':''}</option>
          ))}
        </select>
      </div>

      {live && (
        <>
          {/* Score display */}
          <div className="card-gold p-4 text-center">
            <div className="font-mono text-4xl text-[#f0c040] font-black">{live.runs}/{live.wickets}</div>
            <div className="text-sm text-[#8892b0] mt-1">{ov}.{bl} overs · Inn {live.innings}{live.target?` · Target ${live.target}`:''}</div>
            {live.striker?.name && <div className="text-xs text-[#f0c040] mt-2">⚡ {live.striker.name}* {live.striker.runs}({live.striker.balls})</div>}
            {live.nonstriker?.name && <div className="text-xs text-[#8892b0]">{live.nonstriker.name} {live.nonstriker.runs}({live.nonstriker.balls})</div>}
            {live.currentBowler?.name && <div className="text-xs text-red-400 mt-1">🎯 {live.currentBowler.name} {Math.floor((live.currentBowler.ballsBowled||0)/6)}.{(live.currentBowler.ballsBowled||0)%6} ov {live.currentBowler.wickets}w</div>}
          </div>

          {/* Scoring buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {[0,1,2,3].map(r=><button key={r} onClick={()=>addRun(r)} className="bg-[#1e2a4a] text-white rounded-xl py-3 font-display text-lg hover:bg-[#f0c040]/20 active:scale-95 transition-all">{r}</button>)}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={()=>addRun(4)} className="bg-[#f0c040]/20 text-[#f0c040] rounded-xl py-3 font-display text-lg hover:bg-[#f0c040]/30 active:scale-95 transition-all">4</button>
              <button onClick={()=>addRun(6)} className="bg-emerald-500/20 text-emerald-400 rounded-xl py-3 font-display text-lg hover:bg-emerald-500/30 active:scale-95 transition-all">6</button>
              <button onClick={()=>addExtra('WD')} className="bg-amber-500/20 text-amber-400 rounded-xl py-3 font-bold text-sm hover:bg-amber-500/30 active:scale-95 transition-all">WD</button>
              <button onClick={()=>addExtra('NB')} className="bg-amber-500/20 text-amber-400 rounded-xl py-3 font-bold text-sm hover:bg-amber-500/30 active:scale-95 transition-all">NB</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[['BWD','Bowled'],['CT','Caught'],['RO','RunOut'],['LBW','LBW']].map(([lbl,how])=>(
                <button key={lbl} onClick={()=>addWicket(how)} className="bg-red-500/15 text-red-400 rounded-xl py-3 font-bold text-sm hover:bg-red-500/25 active:scale-95 transition-all border border-red-500/20">{lbl}</button>
              ))}
            </div>
          </div>

          {/* Player selectors */}
          <PlayerPicker label="⚡ STRIKER" squad={batSquad} selected={live.striker?.name} disabled={[...outNames, live.nonstriker?.name||'']} onSelect={n=>selectPlayer('striker',n)} />
          <PlayerPicker label="🏏 NON-STRIKER" squad={batSquad} selected={live.nonstriker?.name} disabled={[...outNames, live.striker?.name||'']} onSelect={n=>selectPlayer('nonstriker',n)} />
          <PlayerPicker label="🎯 BOWLER" squad={bowlSquad} selected={live.currentBowler?.name} disabled={[]} onSelect={n=>selectPlayer('bowler',n)} />

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={swapStrike} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all">🔄 Swap Strike</button>
            <button onClick={()=>endInnings()} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all">🏁 End Innings</button>
          </div>
          <button onClick={endMatch} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-all">❌ End Match</button>
        </>
      )}
    </div>
  )
}

function PlayerPicker({ label, squad, selected, disabled, onSelect }: { label:string; squad:any[]; selected?:string; disabled:string[]; onSelect:(n:string)=>void }) {
  const [custom, setCustom] = useState('')
  return (
    <div>
      <div className="text-[10px] text-[#8892b0] tracking-widest uppercase mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white/[0.02] rounded-xl border border-white/[0.04]">
        {squad.map(p=>{
          const isOut = disabled.includes(p.name)
          const isSel = selected===p.name
          return (
            <button key={p.id} disabled={isOut} onClick={()=>onSelect(p.name)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isSel?'bg-[#f0c040]/20 text-[#f0c040] border border-[#f0c040]/30':isOut?'opacity-30 cursor-not-allowed text-[#4a5568]':'bg-white/[0.04] text-[#8892b0] hover:text-white active:scale-95'}`}>
              {p.name}
            </button>
          )
        })}
        <div className="flex gap-1 w-full mt-1">
          <input className="flex-1 bg-[#161f38] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-[#4a5568] focus:outline-none" placeholder="Custom name..." value={custom} onChange={e=>setCustom(e.target.value)} />
          <button onClick={()=>{ if(custom.trim()){ onSelect(custom.trim()); setCustom('') }}} className="bg-[#f0c040]/10 text-[#f0c040] rounded-lg px-2 py-1 text-[11px] font-semibold active:scale-95">+</button>
        </div>
      </div>
    </div>
  )
}
