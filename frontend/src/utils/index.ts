export const fmtDate = (d: string) => {
  if (!d) return '—'
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }
  catch { return d }
}
export const fmtTime = (t: string) => {
  if (!t) return '—'
  const [h, m] = t.split(':')
  return `${+h % 12 || 12}:${m} ${+h >= 12 ? 'PM' : 'AM'}`
}
export const statusLabel: Record<string, string> = {
  upcoming: 'Upcoming', live: 'Live', completed: 'Completed',
  rain: 'Rain', delayed: 'Delayed', postponed: 'Postponed',
  cancelled: 'Cancelled', rematch: 'Rematch',
}
export const statusIcon: Record<string, string> = {
  upcoming: '🕐', live: '🔴', completed: '✅', rain: '🌧',
  delayed: '⏸', postponed: '📅', cancelled: '❌', rematch: '🔁',
}
export const statusColor: Record<string, string> = {
  upcoming:  'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  live:      'text-red-400 bg-red-400/10 border-red-400/20',
  completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  rain:      'text-blue-400 bg-blue-400/10 border-blue-400/20',
  delayed:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
  postponed: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  cancelled: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  rematch:   'text-orange-400 bg-orange-400/10 border-orange-400/20',
}
export const groupColor: Record<string, { ring: string; text: string; bg: string }> = {
  gold:   { ring: 'border-[#f0c040]/30', text: 'text-[#f0c040]',    bg: 'bg-[#f0c040]/10'   },
  blue:   { ring: 'border-cyan-400/30',  text: 'text-cyan-400',     bg: 'bg-cyan-400/10'    },
  green:  { ring: 'border-emerald-400/30', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  red:    { ring: 'border-red-400/30',   text: 'text-red-400',      bg: 'bg-red-400/10'     },
  purple: { ring: 'border-purple-400/30', text: 'text-purple-400',  bg: 'bg-purple-400/10'  },
  teal:   { ring: 'border-teal-400/30',  text: 'text-teal-400',     bg: 'bg-teal-400/10'    },
}

// Parse "runs/wkts (overs)" — handles both "120/4 (10)" and "120/4 (10.0)" and "120/4 (9.3)"
// Also handles "120/4" with no overs (uses maxOvers)
export function parseScore(s: string, maxOvers: number): { runs: number; wkts: number; overs: number } | null {
  if (!s || !s.trim()) return null
  const m = s.trim().match(/^(\d+)\/(\d+)(?:\s*\((\d+(?:\.\d+)?)\))?/)
  if (!m) return null
  const runs = +m[1]
  const wkts = +m[2]
  // Convert "9.3" to 9.5 overs equivalent: 9 + 3/6 = 9.5
  let overs = maxOvers
  if (m[3] !== undefined) {
    const raw = parseFloat(m[3])
    const wholeOvers = Math.floor(raw)
    const balls      = Math.round((raw - wholeOvers) * 10) // e.g. 9.3 → 3 balls
    overs = wholeOvers + balls / 6
  }
  return { runs, wkts, overs: Math.min(overs, maxOvers) }
}

// ICC Net Run Rate:
// NRR = (runs scored / overs faced) − (runs conceded / overs bowled)
// If team is ALL OUT (wkts = 10), use full allocated overs, not actual overs faced.
// This matches the official ICC method exactly.
export function calcNRR(teamName: string, matches: any[]): number {
  let rsBat = 0, ovBat = 0   // runs scored, overs faced
  let rsBowl = 0, ovBowl = 0 // runs conceded, overs bowled

  matches.forEach(m => {
    if (m.status !== 'completed') return
    const mo = m.overs || 10
    const s1 = parseScore(m.score1, mo)
    const s2 = parseScore(m.score2, mo)
    if (!s1 || !s2) return

    const t1 = m.team1?.name
    const t2 = m.team2?.name

    if (t1 === teamName) {
      // Batting in inn1: use full overs if all out, else actual
      const facedOvers  = s1.wkts >= 10 ? mo : s1.overs
      const bowledOvers = s2.wkts >= 10 ? mo : s2.overs
      rsBat  += s1.runs;  ovBat  += facedOvers
      rsBowl += s2.runs;  ovBowl += bowledOvers
    } else if (t2 === teamName) {
      // Batting in inn2
      const facedOvers  = s2.wkts >= 10 ? mo : s2.overs
      const bowledOvers = s1.wkts >= 10 ? mo : s1.overs
      rsBat  += s2.runs;  ovBat  += facedOvers
      rsBowl += s1.runs;  ovBowl += bowledOvers
    }
  })

  if (!ovBat || !ovBowl) return 0
  return (rsBat / ovBat) - (rsBowl / ovBowl)
}

export function getTeamStats(teamName: string, matches: any[]) {
  let p = 0, w = 0, l = 0, nr = 0, pts = 0
  matches.forEach(m => {
    if (m.status !== 'completed') return
    if (m.team1?.name !== teamName && m.team2?.name !== teamName) return
    p++
    const r = (m.result || '').toLowerCase()
    if      (r.includes('no result') || r.includes('abandoned')) { nr++; pts += 1 }
    else if (m.result?.includes(teamName))                        { w++;  pts += 2 }
    else if (r.includes('tied'))                                  {       pts += 1 }
    else                                                          { l++ }
  })
  const nrrNum = calcNRR(teamName, matches)
  return {
    played: p, won: w, lost: l, nr, pts,
    nrr: (nrrNum >= 0 ? '+' : '') + nrrNum.toFixed(3),
    nrrNum,
  }
}
