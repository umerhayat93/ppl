import { useStore } from '../../store'
import { apiPost } from '../../api/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { BarChart3 } from 'lucide-react'

export default function PollsPage() {
  const { polls, setPolls, sessionId } = useStore()
  const [voted, setVoted] = useState<Record<string,number>>(() => {
    try { return JSON.parse(localStorage.getItem('ppl_poll_votes')||'{}') } catch { return {} }
  })

  const vote = async (pid: string, idx: number) => {
    if (voted[pid] !== undefined) { toast.error('Already voted'); return }
    try {
      await apiPost(`/polls/${pid}/vote`, { idx, voter: sessionId })
      const v = { ...voted, [pid]: idx }
      setVoted(v)
      localStorage.setItem('ppl_poll_votes', JSON.stringify(v))
      toast.success('Vote recorded!')
    } catch (e: any) { toast.error(e.message || 'Error') }
  }

  return (
    <div className="fade-up">
      <div className="px-4 py-3 flex items-center gap-2">
        <BarChart3 size={16} className="text-[#f0c040]" />
        <span className="font-display text-xl text-white tracking-wide">Fan Polls</span>
      </div>
      {!polls.length && (
        <div className="text-center py-16 text-[#4a5568]"><div className="text-4xl mb-3 opacity-30">📊</div><p className="text-sm">No polls yet</p></div>
      )}
      <div className="px-3 space-y-3 pb-6">
        {polls.map(poll => {
          const total = (poll.votes||[]).reduce((a,b)=>a+b,0)
          const myVote = voted[poll.id]
          return (
            <div key={poll.id} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <div className="text-[10px] text-[#f0c040] tracking-widest uppercase font-semibold mb-1">{poll.type||'Poll'}</div>
                <div className="font-semibold text-white text-sm leading-snug">{poll.question}</div>
                <div className="text-[11px] text-[#4a5568] mt-1">{total} votes</div>
              </div>
              <div className="p-3 space-y-2">
                {(poll.options||[]).map((opt,i)=>{
                  const pct = total>0?Math.round((poll.votes[i]||0)/total*100):0
                  const isVoted = myVote===i
                  return (
                    <button key={i} onClick={()=>vote(poll.id,i)} disabled={myVote!==undefined}
                      className={`w-full rounded-xl overflow-hidden border transition-all text-left relative ${isVoted?'border-[#f0c040]/30':'border-white/[0.06] hover:border-white/10'} ${myVote!==undefined?'cursor-default':''}`}>
                      <div className={`absolute inset-0 h-full transition-all duration-700 ${isVoted?'bg-[#f0c040]/15':'bg-white/[0.02]'}`} style={{ width:`${pct}%`, transition:'width 0.7s cubic-bezier(0.34,1.56,0.64,1)' }} />
                      <div className="relative flex items-center justify-between px-3 py-2.5">
                        <span className="text-xs font-semibold text-white">{opt}</span>
                        {myVote!==undefined && <span className={`font-mono text-xs font-bold ${isVoted?'text-[#f0c040]':'text-[#4a5568]'}`}>{pct}%</span>}
                        {isVoted && <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#f0c040] flex items-center justify-center text-[9px] font-black text-[#040810]">✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
