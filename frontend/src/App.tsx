import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store'
import { api } from './api/client'
import { useSocket } from './hooks/useSocket'
import Splash from './components/common/Splash'
import Header from './components/layout/Header'
import NavTabs from './components/layout/NavTabs'
import Ticker from './components/common/Ticker'
import AdminPanel from './components/admin/AdminPanel'
import InstallButton from './components/pwa/InstallButton'

import HomePage       from './components/common/HomePage'
import LivePage       from './components/live/LivePage'
import SchedulePage   from './components/matches/SchedulePage'
import PointsPage     from './components/matches/PointsPage'
import GroupsPage     from './components/common/GroupsPage'
import TeamsPage      from './components/teams/TeamsPage'
import PlayersPage    from './components/players/PlayersPage'
import PollsPage      from './components/common/PollsPage'
import GalleryPage    from './components/common/GalleryPage'
import OrgsPage       from './components/common/OrgsPage'
import RulesPage      from './components/common/RulesPage'
import AboutPage      from './components/common/AboutPage'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const { activeTab, adminOpen, setAdminOpen, setBootstrap } = useStore()

  useSocket()

  useEffect(() => {
    api('/bootstrap').then((r: any) => {
      setBootstrap(r.data ?? r)
    }).catch(console.error)
  }, [])

  const PAGE_MAP: Record<string, JSX.Element> = {
    home:       <HomePage />,
    live:       <LivePage />,
    schedule:   <SchedulePage />,
    points:     <PointsPage />,
    groups:     <GroupsPage />,
    teams:      <TeamsPage />,
    players:    <PlayersPage />,
    polls:      <PollsPage />,
    gallery:    <GalleryPage />,
    organisers: <OrgsPage />,
    rules:      <RulesPage />,
    about:      <AboutPage />,
  }

  return (
    <>
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}

      <div className={`flex flex-col min-h-screen transition-opacity duration-300 ${splashDone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Ticker />
        <Header onAdminClick={() => setAdminOpen(true)} />
        <NavTabs />
        <main className="flex-1 overflow-x-hidden">
          {Object.entries(PAGE_MAP).map(([key, page]) => (
            <div key={key} className={activeTab === key ? 'block' : 'hidden'}>
              {page}
            </div>
          ))}
        </main>
      </div>

      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
      <InstallButton />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f1628',
            color: '#e8eaf0',
            border: '1px solid rgba(240,192,64,0.15)',
            borderRadius: '12px',
            fontSize: '13px'
          },
          success: { iconTheme: { primary: '#f0c040', secondary: '#040810' } },
          error:   { iconTheme: { primary: '#ff3b5c', secondary: '#040810' } },
        }}
      />
    </>
  )
}
