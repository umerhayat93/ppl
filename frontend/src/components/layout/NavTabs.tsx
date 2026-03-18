import { useStore } from '../../store'

const TABS = [
  { id:'home',       label:'Home',      icon:'🏠' },
  { id:'live',       label:'Live',      icon:'🔴' },
  { id:'schedule',   label:'Schedule',  icon:'📅' },
  { id:'points',     label:'Points',    icon:'🏆' },
  { id:'groups',     label:'Groups',    icon:'🔢' },
  { id:'teams',      label:'Teams',     icon:'🛡' },
  { id:'players',    label:'Players',   icon:'👤' },
  { id:'polls',      label:'Polls',     icon:'📊' },
  { id:'gallery',    label:'Gallery',   icon:'📸' },
  { id:'organisers', label:'Officials', icon:'🎖' },
  { id:'rules',      label:'Rules',     icon:'📋' },
  { id:'about',      label:'About',     icon:'ℹ️'  },
]

export default function NavTabs() {
  const { activeTab, setActiveTab } = useStore()

  return (
    <nav className="bg-[#0a0f1e] border-b border-[#f0c040]/10 overflow-x-auto no-scrollbar">
      <div className="flex px-2 gap-0.5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`nav-tab flex items-center gap-1.5 ${activeTab === t.id ? 'nav-tab-active' : ''}`}
          >
            <span className="text-sm leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
