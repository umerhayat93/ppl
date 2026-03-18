import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { Zap } from 'lucide-react'

interface FeedEntry { ball: string; desc: string; over: string }

let globalFeed: FeedEntry[] = []

export function addBallFeedEntry(ball: string, desc: string, over: string) {
  globalFeed = [{ ball, desc, over }, ...globalFeed].slice(0, 40)
}

function BallDot({ b }: { b: string }) {
  const cls = b === 'W' ? 'ball-W' : b === '6' ? 'ball-6' : b === '4' ? 'ball-4'
    : (b === 'Wd' || b === 'NB') ? 'ball-WD' : (b === '•' || b === '0') ? 'ball-0' : 'ball-n'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls}`}>
      {b === '•' ? '0' : b}
    </div>
  )
}

export default function BallFeed() {
  const { live } = useStore()
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [prevLen, setPrevLen] = useState(0)

  useEffect(() => {
    if (!live?.lastBalls) return
    const len = live.lastBalls.length
    if (len > prevLen && prevLen > 0) {
      const ball = live.lastBalls[len - 1]
      const ov = Math.floor((live.balls - 1) / 6)
      const bl = ((live.balls - 1) % 6) + 1
      const s = live.striker?.name || 'Batter'
      const b = live.currentBowler?.name || 'Bowler'
      let desc = ''
      if      (ball === 'W')  desc = `<b>WICKET!</b> ${s} out (${(live.striker as any)?.how || 'dismissed'}) — ${b}`
      else if (ball === '6')  desc = `<b>SIX!</b> ${s} — over the rope!`
      else if (ball === '4')  desc = `<b>FOUR!</b> ${s} — boundary`
      else if (ball === 'Wd') desc = `Wide — ${b} (+1)`
      else if (ball === 'NB') desc = `No Ball — ${b} (+1)`
      else if (ball === '•' || ball === '0') desc = `Dot ball — ${s} defended`
      else desc = `${ball} run${ball !== '1' ? 's' : ''} — ${s}`

      addBallFeedEntry(ball, desc, `${ov}.${bl}`)
      setFeed([...globalFeed])
    }
    setPrevLen(len)
  }, [live?.balls])

  if (!live || !feed.length) return null

  return (
    <div className="mx-3 mb-3 card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-[#f0c040]" />
          <span className="text-[11px] text-[#8892b0] tracking-widest uppercase font-semibold">Ball by Ball</span>
        </div>
        <span className="text-[10px] text-[#4a5568]">Latest first</span>
      </div>
      <div className="divide-y divide-white/[0.03] max-h-64 overflow-y-auto">
        {feed.slice(0, 20).map((e, i) => {
          const hl = e.ball === 'W' ? 'bg-red-500/5' : e.ball === '6' ? 'bg-emerald-500/5' : e.ball === '4' ? 'bg-[#f0c040]/5' : ''
          return (
            <div key={`feed-${i}`} className={`flex items-center gap-3 px-4 py-2.5 ${hl} fade-up`}>
              <BallDot b={e.ball} />
              <p className="flex-1 text-xs text-[#8892b0] leading-relaxed" dangerouslySetInnerHTML={{ __html: e.desc }} />
              <span className="text-[10px] text-[#4a5568] font-mono flex-shrink-0">Ov {e.over}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
