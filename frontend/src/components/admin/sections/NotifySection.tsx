import { useState } from 'react'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'
const QUICK = [
  { title:'🏏 Match Starting!', body:'A new PPL 2026 match is about to begin. Tune in now!' },
  { title:'🎯 WICKET ALERT!',   body:'A wicket has fallen! Check the live score now.' },
  { title:'🏆 Match Result',    body:'The match has ended. Check the final scorecard.' },
  { title:'📅 Schedule Update', body:'The match schedule has been updated. Check the latest fixtures.' },
]
export default function NotifySection() {
  const [title, setTitle] = useState('')
  const [body,  setBody]  = useState('')
  const [loading, setLoading] = useState(false)
  const send = async () => {
    if(!title.trim()){toast.error('Title required');return}
    setLoading(true)
    try{ await api('/notifications/send','POST',{title,body,icon:'📢'}); setTitle(''); setBody(''); toast.success('📢 Sent to all viewers!') }
    catch(e:any){ toast.error(e.message) }
    setLoading(false)
  }
  return (
    <div className="space-y-3">
      <div className="text-xs text-[#4a5568] mb-1">Quick templates:</div>
      <div className="space-y-1.5">
        {QUICK.map((q,i)=>(
          <button key={i} onClick={()=>{setTitle(q.title);setBody(q.body)}}
            className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] rounded-xl px-3 py-2 transition-all active:scale-[0.98]">
            <div className="text-xs font-semibold text-white">{q.title}</div>
            <div className="text-[11px] text-[#4a5568] truncate">{q.body}</div>
          </button>
        ))}
      </div>
      <div className="border-t border-white/[0.04] pt-3 space-y-2">
        <input className="input-field" placeholder="Notification title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="input-field resize-none" rows={2} placeholder="Message body (optional)" value={body} onChange={e=>setBody(e.target.value)} />
        <button onClick={send} disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2">
          <Bell size={14}/>{loading?'Sending...':'📢 SEND TO ALL'}
        </button>
      </div>
    </div>
  )
}
