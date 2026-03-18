import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useStore } from '../store'
import toast from 'react-hot-toast'

// Use window location as fallback so it works on same-origin deploys too
const WS_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL)
  || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
  || ''

let socket: Socket | null = null

export function useSocket() {
  const {
    setLive, setTeams, setMatches, setPlayers, setGroups,
    setPolls, setOrgs, setGallery, setRules, setAnn, setAds
  } = useStore()
  const connectedRef = useRef(false)

  useEffect(() => {
    if (connectedRef.current) return
    connectedRef.current = true

    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    })

    socket.on('connect',    () => console.log('[WS] connected'))
    socket.on('disconnect', () => console.log('[WS] disconnected'))

    socket.on('live',    (d: any) => setLive(d))
    socket.on('teams',   (d: any) => { if (d) setTeams(d) })
    socket.on('matches', (d: any) => { if (d) setMatches(d) })
    socket.on('players', (d: any) => { if (d) setPlayers(d) })
    socket.on('groups',  (d: any) => { if (d) setGroups(d) })
    socket.on('polls',   (d: any) => { if (d) setPolls(d) })
    socket.on('orgs',    (d: any) => { if (d) setOrgs(d) })
    socket.on('gallery', (d: any) => { if (d) setGallery(d) })
    socket.on('rules',   (d: any) => { if (d) setRules(d) })
    socket.on('ann',     (d: any) => { if (d) setAnn(d) })
    socket.on('ads',     (d: any) => { if (d) setAds(d) })

    socket.on('notification', (d: { title: string; body: string; icon: string }) => {
      toast(d.body || d.title, {
        icon: d.icon || '📢',
        duration: 7000,
        style: {
          background: '#0f1628',
          color: '#e8eaf0',
          border: '1px solid rgba(240,192,64,0.2)'
        },
      })
      if (Notification.permission === 'granted') {
        try { new Notification(d.title, { body: d.body, icon: '/icons/icon-192.png' }) } catch {}
      }
    })

    return () => {
      socket?.disconnect()
      connectedRef.current = false
    }
  }, [])

  return socket
}
