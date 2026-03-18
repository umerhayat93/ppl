import { useStore } from '../../store'
import { Activity } from 'lucide-react'

function BallDot({ b, idx }: { b: string; idx: number }) {
  const cls = b==='W'?'ball-W':b==='6'?'ball-6':b==='4'?'ball-4':(b==='Wd'||b==='NB')?'ball-WD':b==='•'||b==='0'?'ball-0':'ball-n'
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${cls}`}>
      {b === '•' ? '0' : b}
    </div>
  )
}

export default function LiveCard() {
  const { live, matches } = useStore()
  const liveMatch = matches.find(m => m.status === 'live')
  if (!liveMatch || !live) return null

  const ov  = Math.floor(live.balls / 6)
  const bl  = live.balls % 6
  const mo  = liveMatch.overs || 10
  const crr = live.balls > 0 ? (live.runs / (live.balls / 6)).toFixed(2) : '0.00'
  const bat = live.innings === 2 ? live.bowlingFirst : live.battingFirst
  const fld = live.innings === 2 ? live.battingFirst : live.bowlingFirst
  const tgt = live.innings === 2 && live.target ? live.target : null
  const last8 = (live.lastBalls || []).slice(-8)

  return (
    <div className="mx-3 mb-3 card-gold overflow-hidden">
      <div className="bg-[#f0c040]/8 px-4 py-2.5 border-b border-[#f0c040]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-[#f0c040]" />
          <span className="text-[11px] text-[#8892b0] tracking-widest uppercase">
            M{liveMatch.matchNo} · Inn {live.innings} · T{mo}
          </span>
        </div>
        <span className="badge-live live-blip text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />LIVE
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div>
            <div className="font-display text-sm text-white tracking-wide truncate">{bat.toUpperCase()}</div>
            <div className="font-mono text-3xl text-[#f0c040] font-black leading-tight mt-1">
              {live.runs}/{live.wickets}
            </div>
            <div className="text-[11px] text-[#8892b0] mt-0.5">{ov}.{bl} / {mo} ov</div>
          </div>
          <div className="font-display text-[#4a5568] text-lg">VS</div>
          <div>
            <div className="font-display text-sm text-white tracking-wide truncate">{fld.toUpperCase()}</div>
            <div className="font-mono text-2xl text-[#4a5568] font-black leading-tight mt-1">
              {live.innings === 2 && liveMatch.score1 ? liveMatch.score1 : '—'}
            </div>
            <div className="text-[11px] text-[#4a5568] mt-0.5">{live.innings === 2 ? '1st inn' : 'yet to bat'}</div>
          </div>
        </div>

        {tgt && (
          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center">
            <span className="text-xs text-amber-400 font-semibold">
              Target {tgt} · Need {tgt - live.runs} off {mo * 6 - live.balls} balls
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.04]">
          {([['CRR', crr], ['WKT', `${live.wickets}/10`], ['EXT', String((live.extras?.wide || 0) + (live.extras?.noball || 0))]] as [string, string][]).map(([l, v]) => (
            <div key={l} className="text-center">
              <div className="font-mono text-[#00d4ff] text-sm font-bold">{v}</div>
              <div className="text-[9px] text-[#4a5568] uppercase tracking-widest mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        {last8.length > 0 && (
          <div className="flex gap-1.5 justify-center mt-3 pt-3 border-t border-white/[0.04] flex-wrap">
            {last8.map((b, i) => <BallDot key={i} b={b} idx={i} />)}
          </div>
        )}

        {(live.striker?.name || live.nonstriker?.name) && (
          <div className="flex gap-2 mt-3">
            {([{ bat: live.striker, isStriker: true }, { bat: live.nonstriker, isStriker: false }] as const).map(({ bat: b, isStriker }) =>
              b?.name ? (
                <div key={b.name} className={`flex-1 rounded-xl p-2.5 border ${isStriker ? 'border-[#f0c040]/25 bg-[#f0c040]/5' : 'border-white/[0.04] bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white truncate">{b.name}</span>
                    {isStriker && <span className="text-[#f0c040] text-xs font-bold">*</span>}
                  </div>
                  <div className="font-mono text-sm text-[#f0c040] font-bold mt-0.5">
                    {b.runs}<span className="text-[#4a5568] text-xs font-normal ml-0.5">({b.balls})</span>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

        {live.currentBowler?.name && (
          <div className="mt-2 flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2">
            <span className="text-xs text-[#8892b0]">🎯 {live.currentBowler.name}</span>
            <span className="text-xs font-mono text-red-400 font-semibold">
              {Math.floor((live.currentBowler.ballsBowled || 0) / 6)}.{(live.currentBowler.ballsBowled || 0) % 6} ov
              · {live.currentBowler.wickets || 0}w · {live.currentBowler.runsConceded || 0}r
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
