import { useStore } from '../../store'
import LiveCard from './LiveCard'
import SentimentWidget from './SentimentWidget'
import BallFeed from './BallFeed'
import Leaderboards from '../players/Leaderboards'
import { Radio } from 'lucide-react'
import type { Match, LiveState } from '../../types'

export default function LivePage() {
  const { live, matches } = useStore()
  const liveMatch = matches.find(m => m.status === 'live')
  const lastMatch = [...matches]
    .filter(m => m.status === 'completed')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]

  return (
    <div className="fade-up">
      <div className="px-4 py-3 flex items-center gap-2">
        <Radio size={14} className="text-red-400 animate-pulse" />
        <span className="font-display text-xl text-white tracking-wide">Live Match</span>
      </div>

      {liveMatch && live ? (
        <>
          <LiveCard />
          <SentimentWidget matchId={liveMatch.id} />
          <BallFeed />
          <FullScorecard match={liveMatch} live={live} />
        </>
      ) : lastMatch ? (
        <LastMatchCard match={lastMatch} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="text-5xl mb-4 opacity-30">🔴</div>
          <p className="text-[#4a5568] text-sm">No live match right now</p>
          <p className="text-[#4a5568]/60 text-xs mt-1">Check back when a match starts</p>
        </div>
      )}

      <Leaderboards />
    </div>
  )
}

function FullScorecard({ match, live }: { match: Match; live: LiveState }) {
  const batters = Object.values(live.batters || {}) as any[]
  const bowlers = Object.values(live.bowlers || {}) as any[]
  const striker = live.striker as any
  const nonstriker = live.nonstriker as any
  const currentBowler = live.currentBowler as any

  if (striker?.name && !batters.find((b: any) => b.name === striker.name)) batters.unshift({ ...striker })
  if (nonstriker?.name && !batters.find((b: any) => b.name === nonstriker.name)) batters.splice(1, 0, { ...nonstriker })
  if (currentBowler?.name && !bowlers.find((b: any) => b.name === currentBowler.name)) bowlers.unshift({ ...currentBowler })

  const bat = live.innings === 2 ? live.bowlingFirst : live.battingFirst
  const fld = live.innings === 2 ? live.battingFirst : live.bowlingFirst

  return (
    <div className="mx-3 mb-3 space-y-2">
      {batters.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-[#f0c040]/5 border-b border-[#f0c040]/10">
            <span className="text-[11px] text-[#f0c040] tracking-widest uppercase font-semibold">🏏 Batting — {bat}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((h, i) => (
                    <th key={h} className={`py-2 px-3 text-[10px] text-[#4a5568] uppercase tracking-widest font-semibold ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batters.map((b: any) => {
                  const isStr = striker?.name === b.name && !b.out
                  const bd = isStr ? striker : (nonstriker?.name === b.name && !b.out ? nonstriker : b)
                  const sr = bd.balls > 0 ? ((bd.runs / bd.balls) * 100).toFixed(1) : '—'
                  return (
                    <tr key={b.name} className="border-b border-white/[0.02] last:border-0">
                      <td className="py-2.5 px-3">
                        <span className={`font-semibold ${!b.out ? 'text-white' : 'text-[#4a5568] line-through'}`}>{bd.name}{isStr ? '*' : ''}</span>
                        <div className="text-[10px] text-[#4a5568] mt-0.5">{bd.out ? bd.how || 'out' : 'batting'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#f0c040] font-bold">{bd.runs || 0}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{bd.balls || 0}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{bd.fours || 0}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{bd.sixes || 0}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{sr}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bowlers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-red-500/5 border-b border-red-500/10">
            <span className="text-[11px] text-red-400 tracking-widest uppercase font-semibold">🎯 Bowling — {fld}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Bowler', 'O', 'R', 'W', 'Econ'].map((h, i) => (
                    <th key={h} className={`py-2 px-3 text-[10px] text-[#4a5568] uppercase tracking-widest font-semibold ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bowlers.map((b: any) => {
                  const isCur = currentBowler?.name === b.name
                  const bd = isCur ? currentBowler : b
                  const ov2 = `${Math.floor((bd.ballsBowled || 0) / 6)}.${(bd.ballsBowled || 0) % 6}`
                  return (
                    <tr key={b.name} className={`border-b border-white/[0.02] last:border-0 ${isCur ? 'bg-red-500/5' : ''}`}>
                      <td className="py-2.5 px-3 font-semibold text-white">{bd.name}{isCur ? ' ◀' : ''}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{ov2}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{bd.runsConceded || 0}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-red-400 font-bold">{bd.wickets || 0}</td>
                      <td className="py-2.5 px-3 text-center text-[#8892b0]">{bd.economy ? Number(bd.economy).toFixed(2) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function LastMatchCard({ match }: { match: Match }) {
  const h = (match.highlights || {}) as any
  return (
    <div className="mx-3 mb-3 card-gold p-4">
      <div className="text-[11px] text-[#8892b0] tracking-widest uppercase mb-2">Last Match Result</div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center mb-3">
        <div>
          <div className="font-display text-sm text-white">{match.team1?.name}</div>
          <div className="font-mono text-2xl text-[#f0c040] font-black">{match.score1 || '—'}</div>
        </div>
        <div className="font-display text-[#4a5568]">VS</div>
        <div>
          <div className="font-display text-sm text-white">{match.team2?.name}</div>
          <div className="font-mono text-2xl text-emerald-400 font-black">{match.score2 || '—'}</div>
        </div>
      </div>
      {match.result && (
        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2 text-emerald-400 text-sm font-semibold">
          🏆 {match.result}
        </div>
      )}
      {(h.topBatter || h.topBowler) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {h.topBatter && (
            <div className="bg-[#f0c040]/5 border border-[#f0c040]/15 rounded-xl p-3">
              <div className="text-[10px] text-[#f0c040] uppercase tracking-widest mb-1">🏏 Top Bat</div>
              <div className="font-semibold text-white text-sm">{h.topBatter.name}</div>
              <div className="font-mono text-[#f0c040] font-black text-lg">{h.topBatter.runs}<span className="text-xs text-[#8892b0] font-normal ml-0.5">({h.topBatter.balls})</span></div>
            </div>
          )}
          {h.topBowler && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
              <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1">🎯 Top Bowl</div>
              <div className="font-semibold text-white text-sm">{h.topBowler.name}</div>
              <div className="font-mono text-red-400 font-black text-lg">{h.topBowler.wickets}/{h.topBowler.runs}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
