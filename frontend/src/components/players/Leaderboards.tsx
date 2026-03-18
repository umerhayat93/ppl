import { useStore } from '../../store'
import { Trophy, Target } from 'lucide-react'

export default function Leaderboards() {
  const { players, teams, matches } = useStore()

  // Build comprehensive leaderboard from:
  // 1. Players table (manually updated stats)
  // 2. innings1 data stored in completed matches (auto from live scoring)
  // 3. Current live match data

  // Collect all batter stats from match innings data
  const batterMap: Record<string, { name: string; teamName: string; emoji: string; runs: number; balls: number; fours: number; sixes: number; best: number }> = {}
  const bowlerMap: Record<string, { name: string; teamName: string; emoji: string; wickets: number; balls: number; runs: number }> = {}

  // Helper to find team name for a player
  const findTeam = (playerName: string): string => {
    for (const t of teams) {
      if (t.squad?.some((s: any) => s.name === playerName)) return t.name
    }
    return '—'
  }
  const findTeamEmoji = (playerName: string): string => {
    for (const t of teams) {
      if (t.squad?.some((s: any) => s.name === playerName)) return t.emoji || '🏏'
    }
    return '🏏'
  }

  // Process completed matches
  matches.filter(m => m.status === 'completed').forEach(m => {
    const inn1 = (m.innings1 || {}) as any
    const allBatters = Object.values(inn1.batters || {}) as any[]
    const allBowlers = Object.values(inn1.bowlers || {}) as any[]

    // We need 2nd innings data too — stored in highlights or derived
    // For now process what we have from both innings if available
    const processInnings = (batters: any[], bowlers: any[]) => {
      batters.forEach((b: any) => {
        if (!b.name) return
        const key = b.name.toLowerCase().replace(/\s+/g, '_')
        const existing = batterMap[key]
        const runs = b.runs || 0
        if (!existing) {
          batterMap[key] = {
            name: b.name,
            teamName: findTeam(b.name),
            emoji: findTeamEmoji(b.name),
            runs, balls: b.balls || 0,
            fours: b.fours || 0, sixes: b.sixes || 0,
            best: runs
          }
        } else {
          existing.runs  += runs
          existing.balls += (b.balls || 0)
          existing.fours += (b.fours || 0)
          existing.sixes += (b.sixes || 0)
          if (runs > existing.best) existing.best = runs
        }
      })

      bowlers.forEach((b: any) => {
        if (!b.name) return
        const key = b.name.toLowerCase().replace(/\s+/g, '_')
        const existing = bowlerMap[key]
        const wkts = b.wickets || 0
        if (!existing) {
          bowlerMap[key] = {
            name: b.name,
            teamName: findTeam(b.name),
            emoji: findTeamEmoji(b.name),
            wickets: wkts,
            balls: b.ballsBowled || 0,
            runs: b.runsConceded || 0,
          }
        } else {
          existing.wickets += wkts
          existing.balls   += (b.ballsBowled || 0)
          existing.runs    += (b.runsConceded || 0)
        }
      })
    }

    processInnings(allBatters, allBowlers)
  })

  // Also merge from the players table (manually set by admin)
  players.forEach(p => {
    if (!p.name) return
    const key = p.name.toLowerCase().replace(/\s+/g, '_')

    if ((p.runs || 0) > 0) {
      if (!batterMap[key]) {
        batterMap[key] = {
          name: p.name, teamName: p.team?.name || findTeam(p.name),
          emoji: p.emoji || '🏏', runs: p.runs || 0,
          balls: 0, fours: 0, sixes: 0, best: p.runs || 0,
        }
      } else if ((p.runs || 0) > batterMap[key].runs) {
        // Admin stats take precedence if higher
        batterMap[key].runs = p.runs || 0
        batterMap[key].teamName = p.team?.name || batterMap[key].teamName
      }
    }
    if ((p.wickets || 0) > 0) {
      if (!bowlerMap[key]) {
        bowlerMap[key] = {
          name: p.name, teamName: p.team?.name || findTeam(p.name),
          emoji: p.emoji || '🏏', wickets: p.wickets || 0, balls: 0, runs: 0,
        }
      } else if ((p.wickets || 0) > bowlerMap[key].wickets) {
        bowlerMap[key].wickets = p.wickets || 0
        bowlerMap[key].teamName = p.team?.name || bowlerMap[key].teamName
      }
    }
  })

  // Sort and take top 10
  const topBat = Object.values(batterMap)
    .filter(b => b.runs > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10)

  const topBowl = Object.values(bowlerMap)
    .filter(b => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
    .slice(0, 10)

  if (!topBat.length && !topBowl.length) return (
    <div className="px-4 pb-4 text-center text-[#4a5568] text-xs pt-2">
      Leaderboard will appear after matches are played
    </div>
  )

  return (
    <div className="space-y-4 pb-6 mt-2">
      <div className="px-4 pt-2 flex items-center gap-2">
        <span className="font-display text-xl text-white tracking-wide">📊 Leaderboards</span>
      </div>

      {/* Top 10 Batters */}
      {topBat.length > 0 && (
        <div className="mx-3 card overflow-hidden">
          <div className="px-4 py-3 bg-[#f0c040]/8 border-b border-[#f0c040]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-[#f0c040]" />
              <span className="font-display text-sm text-[#f0c040] tracking-widest uppercase">Top Run Scorers</span>
            </div>
            <span className="text-[10px] text-[#4a5568]">Top {topBat.length}</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {topBat.map((p, i) => {
              const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—'
              return (
                <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
                    ${i === 0 ? 'bg-[#f0c040]/20 text-[#f0c040]' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-amber-700/30 text-amber-600' : 'bg-white/[0.03] text-[#4a5568]'}`}>
                    {i + 1}
                  </span>
                  <span className="text-xl leading-none flex-shrink-0">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white flex items-center gap-1">
                      {p.name}{i === 0 && <span className="text-base">🔥</span>}
                    </div>
                    <div className="text-[11px] text-[#4a5568] truncate">{p.teamName}</div>
                    <div className="text-[10px] text-[#4a5568] mt-0.5">
                      {p.balls > 0 && `SR: ${sr}`}
                      {p.fours > 0 && ` · 4s: ${p.fours}`}
                      {p.sixes > 0 && ` · 6s: ${p.sixes}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-black text-[#f0c040] text-xl leading-none">{p.runs}</div>
                    <div className="text-[10px] text-[#4a5568] mt-0.5">runs</div>
                    {p.best > 0 && p.best !== p.runs && (
                      <div className="text-[10px] text-[#8892b0]">Best: {p.best}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top 10 Bowlers */}
      {topBowl.length > 0 && (
        <div className="mx-3 card overflow-hidden">
          <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-red-400" />
              <span className="font-display text-sm text-red-400 tracking-widest uppercase">Top Wicket Takers</span>
            </div>
            <span className="text-[10px] text-[#4a5568]">Top {topBowl.length}</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {topBowl.map((p, i) => {
              const overs = p.balls > 0 ? `${Math.floor(p.balls / 6)}.${p.balls % 6}` : '0.0'
              const eco   = p.balls > 0 ? ((p.runs / p.balls) * 6).toFixed(2) : '—'
              return (
                <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
                    ${i === 0 ? 'bg-red-500/20 text-red-400' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-amber-700/30 text-amber-600' : 'bg-white/[0.03] text-[#4a5568]'}`}>
                    {i + 1}
                  </span>
                  <span className="text-xl leading-none flex-shrink-0">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white flex items-center gap-1">
                      {p.name}{i === 0 && <span className="text-base">🎯</span>}
                    </div>
                    <div className="text-[11px] text-[#4a5568] truncate">{p.teamName}</div>
                    <div className="text-[10px] text-[#4a5568] mt-0.5">
                      {overs} ov{p.runs > 0 ? ` · ${p.runs}R` : ''}
                      {eco !== '—' && ` · Eco: ${eco}`}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-black text-red-400 text-xl leading-none">{p.wickets}W</div>
                    <div className="text-[10px] text-[#4a5568] mt-0.5">wickets</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
