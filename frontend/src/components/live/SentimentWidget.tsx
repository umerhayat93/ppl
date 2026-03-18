import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { apiPost, apiGet } from '../../api/client'
import { Heart } from 'lucide-react'

interface SentimentData {
  total: number
  team1: { id:string; name:string; votes:number }
  team2: { id:string; name:string; votes:number }
}

export default function SentimentWidget({ matchId }: { matchId: string }) {
  const { sessionId, matches } = useStore()
  const match = matches.find(m => m.id === matchId)
  const [data, setData] = useState<SentimentData|null>(null)
  const [voted, setVoted] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet<{ok:boolean;data:SentimentData}>(`/sentiment/${matchId}`)
      .then(r => setData((r as any).data ?? r))
      .catch(() => {})
    const v = localStorage.getItem(`ppl_vote_${matchId}`)
    if (v) setVoted(v)
  }, [matchId])

  // Listen for real-time updates
  useEffect(() => {
    // Data can be updated via socket in parent; poll lightly as fallback
    const t = setInterval(() => {
      apiGet<any>(`/sentiment/${matchId}`).then(r => setData(r.data ?? r)).catch(()=>{})
    }, 10000)
    return () => clearInterval(t)
  }, [matchId])

  const vote = async (teamId: string) => {
    if (loading) return
    setLoading(true)
    try {
      const r = await apiPost<any>(`/sentiment/${matchId}`, { teamId, sessionId })
      const d = r.data ?? r
      setData(d)
      const newVote = voted === teamId ? null : teamId
      setVoted(newVote)
      if (newVote) localStorage.setItem(`ppl_vote_${matchId}`, newVote)
      else         localStorage.removeItem(`ppl_vote_${matchId}`)
    } catch {}
    setLoading(false)
  }

  if (!data || !match) return null
  const total = data.total || 1
  const p1 = Math.round((data.team1.votes / total) * 100) || 0
  const p2 = 100 - p1

  return (
    <div className="mx-3 mb-3 card overflow-hidden">
      <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-white/[0.04]">
        <Heart size={13} className="text-red-400" />
        <span className="text-[11px] text-[#8892b0] tracking-widest uppercase font-semibold">Fan Sentiment</span>
        <span className="ml-auto text-[10px] text-[#4a5568]">{data.total} votes</span>
      </div>
      <div className="p-3 space-y-3">
        {/* Team buttons */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { team: data.team1, pct: p1 },
            { team: data.team2, pct: p2 },
          ].map(({ team, pct }) => {
            const isVoted = voted === team.id
            return (
              <button
                key={team.id}
                onClick={() => vote(team.id)}
                disabled={loading}
                className={`relative overflow-hidden rounded-xl p-3 border transition-all active:scale-95 text-left ${
                  isVoted
                    ? 'border-[#f0c040]/40 bg-[#f0c040]/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                }`}
              >
                <div className="font-display text-sm tracking-wide truncate text-white">{team.name}</div>
                <div className={`font-mono text-2xl font-black mt-0.5 ${isVoted?'text-[#f0c040]':'text-[#8892b0]'}`}>{pct}%</div>
                <div className={`text-[10px] mt-0.5 ${isVoted?'text-[#f0c040]/60':'text-[#4a5568]'}`}>{team.votes} votes</div>
                {isVoted && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#f0c040] flex items-center justify-center"><span className="text-[#040810] text-[9px] font-black">✓</span></div>}
              </button>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-[#c8960a] to-[#f0c040] sent-bar transition-all duration-700 rounded-full"
            style={{ '--w': `${p1}%`, width: `${p1}%` } as any}
          />
          <div
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 sent-bar transition-all duration-700 rounded-full"
            style={{ '--w': `${p2}%`, width: `${p2}%`, animationDelay:'0.1s' } as any}
          />
        </div>
      </div>
    </div>
  )
}
