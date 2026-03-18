import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { api, setToken, getToken, isAdmin } from '../../api/client'
import toast from 'react-hot-toast'
import { X, LogOut, Shield } from 'lucide-react'

// ─── sub-sections ───────────────────────────────────────────────────
import LiveSection    from './sections/LiveSection'
import SquadSection   from './sections/SquadSection'
import GroupsSection  from './sections/GroupsSection'
import TeamsSection   from './sections/TeamsSection'
import MatchesSection from './sections/MatchesSection'
import PlayersSection from './sections/PlayersSection'
import AdsSection     from './sections/AdsSection'
import PollsSection   from './sections/PollsSection'
import AnnouncementsSection from './sections/AnnouncementsSection'
import RulesSection   from './sections/RulesSection'
import OrgsSection    from './sections/OrgsSection'
import NotifySection  from './sections/NotifySection'

const SECTIONS = [
  'Live Scoring','Squad','Groups','Teams','Matches',
  'Players','Ads','Polls','Announcements','Rules','Officials','Notifications',
]

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [loggedIn, setLoggedIn] = useState(isAdmin())
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('Live Scoring')

  const doLogin = async () => {
    setLoading(true)
    try {
      const r: any = await api('/auth/login', 'POST', { user, pass })
      setToken(r.token)
      setLoggedIn(true)
      toast.success('Welcome, Admin!')
    } catch (e: any) {
      toast.error(e.message || 'Invalid credentials')
    }
    setLoading(false)
  }

  const logout = () => { setToken(null); setLoggedIn(false); toast('Logged out') }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md max-h-[90vh] bg-[#0a0f1e] border border-[#f0c040]/15 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#f0c040]" />
            <span className="font-display text-lg text-[#f0c040] tracking-wide">ADMIN PANEL</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#8892b0] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {!loggedIn ? (
          /* Login form */
          <div className="p-5 space-y-3">
            <p className="text-sm text-[#4a5568] text-center mb-4">Enter admin credentials</p>
            <input className="input-field" placeholder="Username" value={user} onChange={e=>setUser(e.target.value)} autoComplete="username" />
            <input className="input-field" type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doLogin()} autoComplete="current-password" />
            <button onClick={doLogin} disabled={loading} className="btn-gold w-full py-3.5 mt-2">
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Section nav */}
            <div className="px-3 py-2 border-b border-white/[0.04] overflow-x-auto no-scrollbar flex-shrink-0">
              <div className="flex gap-1.5">
                {SECTIONS.map(s => (
                  <button key={s} onClick={() => setActiveSection(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${activeSection===s?'bg-[#f0c040]/15 text-[#f0c040] border border-[#f0c040]/25':'text-[#4a5568] hover:text-[#8892b0]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Section content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeSection === 'Live Scoring'  && <LiveSection />}
              {activeSection === 'Squad'          && <SquadSection />}
              {activeSection === 'Groups'         && <GroupsSection />}
              {activeSection === 'Teams'          && <TeamsSection />}
              {activeSection === 'Matches'        && <MatchesSection />}
              {activeSection === 'Players'        && <PlayersSection />}
              {activeSection === 'Ads'            && <AdsSection />}
              {activeSection === 'Polls'          && <PollsSection />}
              {activeSection === 'Announcements'  && <AnnouncementsSection />}
              {activeSection === 'Rules'          && <RulesSection />}
              {activeSection === 'Officials'      && <OrgsSection />}
              {activeSection === 'Notifications'  && <NotifySection />}
            </div>
            {/* Logout */}
            <div className="px-4 py-3 border-t border-white/[0.04] flex-shrink-0">
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-sm text-[#4a5568] hover:text-red-400 transition-colors py-2">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
