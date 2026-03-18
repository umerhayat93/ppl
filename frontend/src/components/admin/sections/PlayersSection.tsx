import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2, Pencil } from 'lucide-react'
const ROLES = ['batting','bowling','allround','wk']
const INIT = { name:'',emoji:'🏏',teamId:'',role:'batting',runs:0,wickets:0,strikeRate:0,economy:0,best:'' }
export default function PlayersSection() {
  const { players, teams, setPlayers } = useStore()
  const [form, setForm] = useState<any>(INIT); const [editId, setEditId] = useState(''); const [show,setShow]=useState(false)
  const reload = async () => { const r:any=await api('/players'); setPlayers(r.data||r) }
  const set = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))
  const save = async () => {
    if(!form.name.trim()){toast.error('Name required');return}
    try{if(editId) await api(`/players/${editId}`,'PUT',form); else await api('/players','POST',{...form,teamId:form.teamId||null});setForm(INIT);setEditId('');setShow(false);await reload();toast.success(editId?'Updated':'Added')}catch(e:any){toast.error(e.message)}
  }
  const del = async (id:string)=>{if(!confirm('Delete?'))return;try{await api(`/players/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)}}
  const edit = (p:any)=>{setEditId(p.id);setForm({name:p.name,emoji:p.emoji,teamId:p.teamId||'',role:p.role,runs:p.runs,wickets:p.wickets,strikeRate:p.strikeRate,economy:p.economy,best:p.best});setShow(true)}
  return (
    <div className="space-y-3">
      <button onClick={()=>{setShow(s=>!s);setEditId('');setForm(INIT)}} className="btn-gold w-full">{show?'✕ Cancel':'+ ADD PLAYER'}</button>
      {show && <div className="space-y-2 card p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="input-field" placeholder="Player name" value={form.name} onChange={e=>set('name',e.target.value)} />
          <input className="input-field w-16" placeholder="🏏" value={form.emoji} onChange={e=>set('emoji',e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className="select-field" value={form.teamId} onChange={e=>set('teamId',e.target.value)}><option value="">— No Team —</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select className="select-field" value={form.role} onChange={e=>set('role',e.target.value)}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input-field" type="number" placeholder="Runs" value={form.runs} onChange={e=>set('runs',+e.target.value)} />
          <input className="input-field" type="number" placeholder="Wickets" value={form.wickets} onChange={e=>set('wickets',+e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input-field" type="number" placeholder="Strike Rate" value={form.strikeRate} onChange={e=>set('strikeRate',+e.target.value)} />
          <input className="input-field" type="number" placeholder="Economy" value={form.economy} onChange={e=>set('economy',+e.target.value)} />
        </div>
        <input className="input-field" placeholder="Best e.g. 5/22" value={form.best} onChange={e=>set('best',e.target.value)} />
        <button onClick={save} className="btn-gold w-full">{editId?'UPDATE':'SAVE PLAYER'}</button>
      </div>}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {players.map(p=><div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className="text-sm text-white">{p.emoji} <strong>{p.name}</strong> <span className="text-[11px] text-[#4a5568]">· {p.runs}r {p.wickets}w</span></span>
          <div className="flex gap-2"><button onClick={()=>edit(p)} className="text-[#8892b0] hover:text-[#f0c040] active:scale-95"><Pencil size={13}/></button><button onClick={()=>del(p.id)} className="text-red-400 active:scale-95"><Trash2 size={13}/></button></div>
        </div>)}
      </div>
    </div>
  )
}
