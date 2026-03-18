import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
const ROLES = [{v:'bat',l:'Batsman'},{v:'bowl',l:'Bowler'},{v:'ar',l:'All-Rounder'},{v:'wk',l:'WK-Bat'}]
export default function SquadSection() {
  const { teams } = useStore()
  const [tid, setTid] = useState('')
  const [squad, setSquad] = useState<any[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('bat')
  const load = async (id: string) => { setTid(id); if(!id){setSquad([]);return} try{const r:any=await api(`/squads/${id}`);setSquad(r.data||r)}catch(e:any){toast.error(e.message)} }
  const add = async () => { if(!name.trim()||!tid){toast.error('Enter name');return} try{await api(`/squads/${tid}`,'POST',{name:name.trim(),role});setName('');await load(tid);toast.success('Added')}catch(e:any){toast.error(e.message)} }
  const del = async (id: string) => { try{await api(`/squads/${id}`,'DELETE');await load(tid)}catch(e:any){toast.error(e.message)} }
  return (
    <div className="space-y-3">
      <select className="select-field" value={tid} onChange={e=>load(e.target.value)}>
        <option value="">— Select team —</option>
        {teams.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
      </select>
      {tid && <>
        <div className="text-xs text-[#4a5568]">{squad.length} players</div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {squad.map(p=><div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
            <div><span className="text-sm text-white font-semibold">{p.name}</span><span className="text-[11px] text-[#4a5568] ml-2">({p.role})</span></div>
            <button onClick={()=>del(p.id)} className="text-red-400 hover:text-red-300 active:scale-95 transition-all"><Trash2 size={14}/></button>
          </div>)}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="input-field" placeholder="Player name" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} />
          <select className="select-field w-auto" value={role} onChange={e=>setRole(e.target.value)}>
            {ROLES.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </div>
        <button onClick={add} className="btn-gold w-full">+ ADD PLAYER</button>
      </>}
    </div>
  )
}
