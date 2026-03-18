import { useStore } from '../../store'
import LiveCard from '../live/LiveCard'
import AdsSlider from './AdsSlider'
import NotifBanner from './NotifBanner'
import { getTeamStats } from '../../utils'
import { Calendar, Trophy, Shield, Users, BarChart3, Image, Download } from 'lucide-react'

interface QuickCardProps { icon:any; label:string; sub:string; onClick:()=>void; id?:string }
function QuickCard({ icon, label, sub, onClick }: QuickCardProps) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:border-[#f0c040]/15 active:scale-95 transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-sm text-white">{label}</div>
      <div className="text-[11px] text-[#4a5568] mt-0.5">{sub}</div>
    </button>
  )
}

export default function HomePage() {
  const { teams, matches, players, groups, live, setActiveTab } = useStore()
  const liveMatch   = matches.find(m=>m.status==='live')
  const upcoming    = matches.filter(m=>m.status==='upcoming').sort((a,b)=>a.date?.localeCompare(b.date||'')||0)[0]
  const completed   = matches.filter(m=>m.status==='completed').length
  const top = [...players].sort((a,b)=>(b.runs||0)-(a.runs||0))[0]

  // NRR leader
  const pointsLeader = groups.length ? (() => {
    const all = teams.map(t=>({...t,...getTeamStats(t.name,matches)})).sort((a,b)=>b.pts-a.pts)
    return all[0]
  })() : null

  return (
    <div className="fade-up pb-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#0f1628] to-[#161f38] px-4 py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0c040]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0c040]" />
            <span className="text-[10px] text-[#f0c040] font-semibold tracking-widest uppercase">Official App · PPL 2026</span>
          </div>
          <h1 className="font-display text-4xl text-white leading-[0.9] tracking-wide">
            Pattan<br/><span className="text-[#f0c040]">Premier</span><br/>League
          </h1>
          <p className="text-[#8892b0] text-sm mt-2">📍 Pattan Cricket Ground &nbsp;·&nbsp; <span className="text-[#ffd966]">2026</span></p>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              ['Teams',    teams.length  ],
              ['Matches',  matches.length],
              ['Players',  players.length],
              ['Completed',completed     ],
            ].map(([l,v])=>(
              <div key={l as string} className="bg-white/[0.04] border border-[#f0c040]/10 rounded-xl p-2 text-center">
                <div className="font-mono text-[#f0c040] font-bold text-lg leading-none">{v}</div>
                <div className="text-[9px] text-[#4a5568] uppercase tracking-widest mt-0.5">{l as string}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live card */}
      {liveMatch && live && (
        <div className="mt-3">
          <LiveCard />
        </div>
      )}

      {/* Ads */}
      <div className="mt-3">
        <AdsSlider />
      </div>

      {/* Notification banner */}
      <NotifBanner />

      {/* Next match */}
      {upcoming && !liveMatch && (
        <div className="mx-3 mb-3 mt-0">
          <div className="rounded-2xl bg-gradient-to-br from-[#0d1f0d] to-[#182b18] border border-emerald-500/20 overflow-hidden relative">
            <div className="absolute top-2 -left-4 bg-emerald-400 text-[#040810] font-display text-[9px] tracking-widest px-8 py-1 rotate-[-45deg]">NEXT</div>
            <div className="px-4 py-3">
              <div className="text-[11px] text-emerald-400 tracking-widest uppercase font-semibold mb-2">Up Next · M{upcoming.matchNo}</div>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="text-3xl mb-1">{upcoming.team1?.emoji||'🏏'}</div>
                  <div className="font-display text-sm text-white">{upcoming.team1?.name}</div>
                </div>
                <div className="font-display text-2xl text-[#4a5568]">VS</div>
                <div className="text-center">
                  <div className="text-3xl mb-1">{upcoming.team2?.emoji||'🏏'}</div>
                  <div className="font-display text-sm text-white">{upcoming.team2?.name}</div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2 text-xs text-[#4a5568]">
                <span>📅 {upcoming.date||'TBD'}</span>
                <span>⏰ {upcoming.time||'TBD'}</span>
                <span>📍 {upcoming.venue||'TBD'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hot player */}
      {top && (
        <div className="mx-3 mb-3">
          <div className="font-display text-base text-white tracking-wide px-1 mb-2">🔥 Top Scorer</div>
          <div className="card-gold flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6432] to-[#c83200] flex items-center justify-center text-3xl shadow-lg flex-shrink-0">{top.emoji||'🏏'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-amber-400 tracking-widest uppercase font-semibold">🔥 Top Bat</div>
              <div className="font-display text-lg text-white tracking-wide leading-tight">{top.name}</div>
              <div className="text-xs text-[#8892b0]">{top.team?.name||'—'}</div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div className="text-center"><div className="font-mono text-[#f0c040] font-black text-xl">{top.runs||0}</div><div className="text-[9px] text-[#4a5568] uppercase">Runs</div></div>
              {top.best && <div className="text-center"><div className="font-mono text-[#8892b0] font-bold text-sm">{top.best}</div><div className="text-[9px] text-[#4a5568] uppercase">Best</div></div>}
            </div>
          </div>
        </div>
      )}

      {/* Quick access */}
      <div className="px-3">
        <div className="font-display text-base text-white tracking-wide px-1 mb-2">Quick Access</div>
        <div className="grid grid-cols-2 gap-2">
          <QuickCard icon="📅" label="Schedule"  sub="All stages"     onClick={()=>setActiveTab('schedule')} />
          <QuickCard icon="🏆" label="Standings" sub="Points table"   onClick={()=>setActiveTab('points')} />
          <QuickCard icon="🛡" label="Teams"     sub="Squads & more"  onClick={()=>setActiveTab('teams')} />
          <QuickCard icon="👤" label="Players"   sub="Stats leaders"  onClick={()=>setActiveTab('players')} />
          <QuickCard icon="📊" label="Polls"     sub="Vote now!"      onClick={()=>setActiveTab('polls')} />
          <QuickCard icon="📸" label="Gallery"   sub="Match photos"   onClick={()=>setActiveTab('gallery')} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 px-4 flex items-center justify-between text-[10px] text-[#4a5568]">
        <span className="font-display text-[#c8960a] tracking-widest">PPL 2026</span>
        <span>Pattan Premier League · Since 2010</span>
      </div>
    </div>
  )
}
