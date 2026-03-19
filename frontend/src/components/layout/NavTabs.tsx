import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store'
import { MoreHorizontal, X } from 'lucide-react'

const PRIMARY_TABS = [
  { id:'home',     label:'Home',     icon:'🏠' },
  { id:'live',     label:'Live',     icon:'🔴' },
  { id:'schedule', label:'Schedule', icon:'📅' },
  { id:'points',   label:'Points',   icon:'🏆' },
  { id:'groups',   label:'Groups',   icon:'🔢' },
  { id:'teams',    label:'Teams',    icon:'🛡'  },
  { id:'players',  label:'Players',  icon:'👤' },
]
const MORE_TABS = [
  { id:'polls',      label:'Polls',     icon:'📊' },
  { id:'gallery',    label:'Gallery',   icon:'📸' },
  { id:'organisers', label:'Officials', icon:'🎖'  },
  { id:'rules',      label:'Rules',     icon:'📋' },
  { id:'about',      label:'About',     icon:'ℹ️'  },
]
const ALL_TABS = [...PRIMARY_TABS, ...MORE_TABS]

export default function NavTabs() {
  const { activeTab, setActiveTab } = useStore()
  const [showMore, setShowMore] = useState(false)
  const startXRef = useRef<number | null>(null)

  // Swipe left/right on main content to change tabs
  useEffect(() => {
    const el = document.getElementById('main-content')
    if (!el) return
    const onStart = (e: TouchEvent) => { startXRef.current = e.touches[0].clientX }
    const onEnd   = (e: TouchEvent) => {
      if (startXRef.current === null) return
      const dx = e.changedTouches[0].clientX - startXRef.current
      if (Math.abs(dx) < 70) { startXRef.current = null; return }
      const allIds = ALL_TABS.map(t => t.id)
      const cur    = allIds.indexOf(activeTab)
      if (dx < 0 && cur < allIds.length - 1) setActiveTab(allIds[cur + 1])
      if (dx > 0 && cur > 0)                 setActiveTab(allIds[cur - 1])
      startXRef.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend',   onEnd,   { passive: true })
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  }, [activeTab, setActiveTab])

  const inMore = MORE_TABS.some(t => t.id === activeTab)

  const tabStyle = (isActive: boolean) => ({
    color:             isActive ? '#d4a017' : '#7c5fa0',
    borderBottomColor: isActive ? '#d4a017' : 'transparent',
    borderBottomWidth: '2px' as const,
    borderBottomStyle: 'solid' as const,
  })

  return (
    <>
      <nav className="overflow-x-auto no-scrollbar flex-shrink-0"
        style={{ background: 'rgba(22,10,46,0.98)', borderBottom: '1px solid rgba(147,51,234,0.12)' }}>
        <div className="flex px-2 gap-0.5">
          {PRIMARY_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-3 py-2.5 font-body font-semibold text-[11px] tracking-widest uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5"
              style={tabStyle(activeTab === t.id)}>
              <span className="text-sm leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <button onClick={() => setShowMore(true)}
            className="px-3 py-2.5 font-body font-semibold text-[11px] tracking-widest uppercase cursor-pointer transition-all whitespace-nowrap flex items-center gap-1"
            style={tabStyle(inMore)}>
            <MoreHorizontal size={13} />
            <span>{inMore ? MORE_TABS.find(t => t.id === activeTab)?.label : 'More'}</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl" style={{ background: '#160a2e', border: '1px solid rgba(147,51,234,0.2)', borderBottom: 'none' }}>
            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: 'rgba(147,51,234,0.3)' }} />
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(147,51,234,0.1)' }}>
              <span className="font-display text-base tracking-wide" style={{ color: '#f0e6ff' }}>More</span>
              <button onClick={() => setShowMore(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(147,51,234,0.1)', color: '#9333ea' }}>
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 p-5 pb-10">
              {MORE_TABS.map(t => {
                const isActive = activeTab === t.id
                return (
                  <button key={t.id} onClick={() => { setActiveTab(t.id); setShowMore(false) }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl active:scale-95 transition-all"
                    style={{ background: isActive ? 'rgba(212,160,23,0.1)' : 'rgba(147,51,234,0.06)', border: `1px solid ${isActive ? 'rgba(212,160,23,0.3)' : 'rgba(147,51,234,0.12)'}` }}>
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: isActive ? '#d4a017' : '#7c5fa0' }}>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
