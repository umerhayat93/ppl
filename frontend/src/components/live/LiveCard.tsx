import { useStore } from '../../store'
import { useRef, useEffect, useState } from 'react'
import { Activity } from 'lucide-react'

function BallDot({ b, isNew }: { b: string; isNew: boolean }) {
  const cls = b==='W'?'ball-W':b==='6'?'ball-6':b==='4'?'ball-4':(b==='Wd'||b==='NB')?'ball-WD':(b==='•'||b==='0')?'ball-0':'ball-n'
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${cls} ${isNew ? 'ball-slide-in' : ''}`}>
      {b === '•' ? '0' : b}
    </div>
  )
}

function AnimatedScore({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(value)
  const [flash, setFlash]     = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlash(true)
      // Count up animation
      const start = prevRef.current
      const end   = value
      const dur   = 400
      const t0    = Date.now()
      const tick  = () => {
        const p = Math.min((Date.now() - t0) / dur, 1)
        setDisplay(Math.round(start + (end - start) * p))
        if (p < 1) requestAnimationFrame(tick)
        else { setDisplay(end); setTimeout(() => setFlash(false), 200) }
      }
      requestAnimationFrame(tick)
      prevRef.current = value
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(30)
    }
  }, [value])

  return (
    <span className={flash ? 'score-flash' : ''} style={{ color }}>
      {display}
    </span>
  )
}

export default function LiveCard() {
  const { live, matches } = useStore()
  const liveMatch = matches.find(m => m.status === 'live')
  if (!liveMatch || !live) return null

  const ov   = Math.floor(live.balls / 6)
  const bl   = live.balls % 6
  const mo   = liveMatch.overs || 10
  const crr  = live.balls > 0 ? (live.runs / (live.balls / 6)).toFixed(2) : '0.00'
  const bat  = live.innings === 2 ? live.bowlingFirst : live.battingFirst
  const fld  = live.innings === 2 ? live.battingFirst : live.bowlingFirst
  const tgt  = live.innings === 2 && live.target ? live.target : null

  // Split balls into current over and previous
  const allBalls  = live.lastBalls || []
  const curStart  = ov * 6
  const curBalls  = allBalls.slice(curStart)
  const prevBalls = allBalls.slice(Math.max(0, curStart - 6), curStart)

  return (
    <div className="mx-3 mb-3 rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, #160a2e, #1e0f3d)',
      border: '1px solid rgba(212,160,23,0.25)',
    }}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(212,160,23,0.06)', borderBottom: '1px solid rgba(212,160,23,0.1)' }}>
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: '#d4a017' }} />
          <span className="text-[11px] tracking-widest uppercase" style={{ color: '#7c5fa0' }}>M{liveMatch.matchNo} · Inn {live.innings} · T{mo}</span>
        </div>
        <span className="badge-live live-blip text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />LIVE
        </span>
      </div>

      <div className="p-4">
        {/* Score row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <div className="font-display text-sm tracking-wide truncate" style={{ color: '#f0e6ff' }}>{bat.toUpperCase()}</div>
            <div className="font-mono text-4xl font-black leading-tight mt-1">
              <AnimatedScore value={live.runs} color="#d4a017" />
              <span style={{ color: '#4a3060' }}>/</span>
              <AnimatedScore value={live.wickets} color="#f97316" />
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: '#7c5fa0' }}>{ov}.{bl} / {mo} ov</div>
          </div>
          <div className="font-display text-lg" style={{ color: '#2d1060' }}>VS</div>
          <div>
            <div className="font-display text-sm tracking-wide truncate" style={{ color: '#f0e6ff' }}>{fld.toUpperCase()}</div>
            <div className="font-mono text-2xl font-black leading-tight mt-1" style={{ color: '#4a3060' }}>
              {live.innings === 2 && liveMatch.score1 ? liveMatch.score1 : '—'}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: '#4a3060' }}>{live.innings === 2 ? '1st inn' : 'yet to bat'}</div>
          </div>
        </div>

        {tgt && (
          <div className="mt-3 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span className="text-xs font-semibold" style={{ color: '#f97316' }}>
              Target {tgt} · Need {tgt - live.runs} off {mo * 6 - live.balls} balls
            </span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(147,51,234,0.1)' }}>
          {([['CRR', crr], ['WKT', `${live.wickets}/10`], ['EXT', String((live.extras?.wide || 0) + (live.extras?.noball || 0))]] as [string,string][]).map(([l, v]) => (
            <div key={l} className="text-center">
              <div className="font-mono text-sm font-bold" style={{ color: '#9333ea' }}>{v}</div>
              <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#4a3060' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Ball dots — current over separated from prev */}
        {(curBalls.length > 0 || prevBalls.length > 0) && (
          <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(147,51,234,0.1)' }}>
            {prevBalls.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: '#4a3060' }}>Prev</span>
                <div className="flex gap-1 flex-wrap opacity-50">
                  {prevBalls.map((b, i) => <BallDot key={i} b={b} isNew={false} />)}
                </div>
              </div>
            )}
            {curBalls.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: '#d4a017' }}>This ov</span>
                <div className="flex gap-1.5 flex-wrap">
                  {curBalls.map((b, i) => <BallDot key={i} b={b} isNew={i === curBalls.length - 1} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batters */}
        {(live.striker?.name || live.nonstriker?.name) && (
          <div className="flex gap-2 mt-3">
            {([{ bat: live.striker, isStriker: true }, { bat: live.nonstriker, isStriker: false }] as const).map(({ bat: b, isStriker }) =>
              b?.name ? (
                <div key={b.name} className="flex-1 rounded-xl p-2.5" style={{
                  border: `1px solid ${isStriker ? 'rgba(212,160,23,0.3)' : 'rgba(147,51,234,0.12)'}`,
                  background: isStriker ? 'rgba(212,160,23,0.05)' : 'rgba(147,51,234,0.04)',
                }}>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold truncate" style={{ color: '#f0e6ff' }}>{b.name}</span>
                    {isStriker && <span className="font-bold text-xs" style={{ color: '#d4a017' }}>*</span>}
                  </div>
                  <div className="font-mono text-sm font-bold mt-0.5" style={{ color: '#d4a017' }}>
                    {b.runs}<span className="text-xs font-normal ml-0.5" style={{ color: '#4a3060' }}>({b.balls})</span>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Bowler */}
        {live.currentBowler?.name && (
          <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <span className="text-xs" style={{ color: '#7c5fa0' }}>🎯 {live.currentBowler.name}</span>
            <span className="text-xs font-mono font-semibold" style={{ color: '#f97316' }}>
              {Math.floor((live.currentBowler.ballsBowled || 0) / 6)}.{(live.currentBowler.ballsBowled || 0) % 6} ov
              · {live.currentBowler.wickets || 0}w · {live.currentBowler.runsConceded || 0}r
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
