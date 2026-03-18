import { create } from 'zustand'
import type {
  Bootstrap, LiveState, Group, Team, Match, Player,
  Poll, Org, Rule, Announcement, Gallery, Ad
} from '../types'

interface AppStore {
  groups:       Group[]
  teams:        Team[]
  matches:      Match[]
  players:      Player[]
  polls:        Poll[]
  orgs:         Org[]
  rules:        Rule[]
  ann:          Announcement[]
  gallery:      Gallery[]
  ads:          Ad[]
  live:         LiveState | null
  loaded:       boolean
  activeTab:    string
  adminOpen:    boolean
  sessionId:    string
  setBootstrap: (bs: Bootstrap) => void
  setLive:      (l: LiveState | null) => void
  setGroups:    (g: Group[]) => void
  setTeams:     (t: Team[]) => void
  setMatches:   (m: Match[]) => void
  setPlayers:   (p: Player[]) => void
  setPolls:     (p: Poll[]) => void
  setOrgs:      (o: Org[]) => void
  setRules:     (r: Rule[]) => void
  setAnn:       (a: Announcement[]) => void
  setGallery:   (g: Gallery[]) => void
  setAds:       (a: Ad[]) => void
  setActiveTab: (t: string) => void
  setAdminOpen: (o: boolean) => void
  setLoaded:    (l: boolean) => void
}

function genSession() {
  try {
    const s = localStorage.getItem('ppl_session')
    if (s) return s
    const id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('ppl_session', id)
    return id
  } catch {
    return 'sess_' + Math.random().toString(36).slice(2)
  }
}

export const useStore = create<AppStore>((set) => ({
  groups: [], teams: [], matches: [], players: [],
  polls: [], orgs: [], rules: [], ann: [], gallery: [], ads: [],
  live: null, loaded: false, activeTab: 'home', adminOpen: false,
  sessionId: genSession(),

  setBootstrap: (bs) => set({
    groups: bs.groups, teams: bs.teams, matches: bs.matches,
    players: bs.players, polls: bs.polls, orgs: bs.orgs,
    rules: bs.rules, ann: bs.ann, gallery: bs.gallery,
    ads: bs.ads, live: bs.live, loaded: true,
  }),
  setLive:      (live)    => set({ live }),
  setGroups:    (groups)  => set({ groups }),
  setTeams:     (teams)   => set({ teams }),
  setMatches:   (matches) => set({ matches }),
  setPlayers:   (players) => set({ players }),
  setPolls:     (polls)   => set({ polls }),
  setOrgs:      (orgs)    => set({ orgs }),
  setRules:     (rules)   => set({ rules }),
  setAnn:       (ann)     => set({ ann }),
  setGallery:   (gallery) => set({ gallery }),
  setAds:       (ads)     => set({ ads }),
  setActiveTab: (activeTab)  => set({ activeTab }),
  setAdminOpen: (adminOpen)  => set({ adminOpen }),
  setLoaded:    (loaded)     => set({ loaded }),
}))
