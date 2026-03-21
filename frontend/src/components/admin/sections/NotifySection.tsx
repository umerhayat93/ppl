import { useState } from 'react'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Bell, Send } from 'lucide-react'

const QUICK = [
  { title: 'PPL 2026 — Match Starting!',   body: 'A new match is about to begin. Open the app to follow live!' },
  { title: 'PPL 2026 — WICKET! 🎯',        body: 'A wicket has fallen! Check the live scorecard now.' },
  { title: 'PPL 2026 — SIX! 🏏',           body: 'That\'s a massive six! Follow the live action.' },
  { title: 'PPL 2026 — Match Result 🏆',   body: 'The match has ended. Check the final scorecard.' },
  { title: 'PPL 2026 — Schedule Update 📅', body: 'Match schedule has been updated. Check the latest fixtures.' },
  { title: 'PPL 2026 — Live Now! 🔴',      body: 'A match is live right now. Open the app to follow the action!' },
]

export default function NotifySection() {
  const [title,   setTitle]   = useState('')
  const [body,    setBody]    = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!title.trim()) { toast.error('Title required'); return }
    setLoading(true)
    try {
      const r: any = await api('/notifications/send', 'POST', { title, body })
      setTitle(''); setBody('')
      toast.success(`📢 Sent to ${r.sent ?? r.total ?? '?'} devices!`)
    } catch (e: any) { toast.error(e.message) }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {/* Quick templates */}
      <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#7c5fa0' }}>
        Quick Templates
      </div>
      <div className="space-y-1.5">
        {QUICK.map((q, i) => (
          <button key={i} onClick={() => { setTitle(q.title); setBody(q.body) }}
            className="w-full text-left rounded-xl px-3 py-2.5 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(147,51,234,0.06)', border: '1px solid rgba(147,51,234,0.1)' }}>
            <div className="text-xs font-semibold" style={{ color: '#f0e6ff' }}>{q.title}</div>
            <div className="text-[11px] truncate mt-0.5" style={{ color: '#7c5fa0' }}>{q.body}</div>
          </button>
        ))}
      </div>

      {/* Custom */}
      <div className="pt-3 space-y-2" style={{ borderTop: '1px solid rgba(147,51,234,0.1)' }}>
        <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#7c5fa0' }}>
          Custom Message
        </div>
        <input
          className="input-field"
          placeholder="Title — shown large & bold (e.g. PPL 2026 — Match Result)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder="Message body — shown below title"
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        {/* Preview */}
        {title && (
          <div className="rounded-xl p-3" style={{ background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.15)' }}>
            <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#7c5fa0' }}>Preview on device</div>
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1a0a2e, #2d1060)' }}>
                <span className="text-sm">🏏</span>
              </div>
              <div>
                <div className="font-bold text-sm leading-tight" style={{ color: '#f0e6ff' }}>{title}</div>
                {body && <div className="text-xs mt-0.5 leading-snug" style={{ color: '#a78bcf' }}>{body}</div>}
              </div>
            </div>
          </div>
        )}

        <button onClick={send} disabled={loading}
          className="btn-gold w-full flex items-center justify-center gap-2">
          <Send size={14} />
          {loading ? 'Sending...' : 'SEND TO ALL DEVICES'}
        </button>
      </div>
    </div>
  )
}
