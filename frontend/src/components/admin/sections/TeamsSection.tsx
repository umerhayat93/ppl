import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2, Pencil } from 'lucide-react'
export default function TeamsSection() {
  const { teams, groups, setTeams } = useStore()
  const [name,setName]=useState('');const [emoji,setEmoji]=useState('🏏');const [captain,setCaptain]=useState('');const [groupId,setGroupId]=useState('');const [editId,setEditId]=useState('')
  const reload = async () => { const r:any=await api('/teams'); setTeams(r.data||r) }
  const save = async () => {
    if(!name.trim()){toast.error('Name required');return}
    try{if(editId) await api(`/teams/${editId}`,'PUT',{name,emoji,captain,groupId:groupId||null}); else await api('/teams','POST',{name,emoji,captain,groupId:groupId||null});setName('');setEmoji('🏏');setCaptain('');setGroupId('');setEditId('');await reload();toast.success(editId?'Updated':'Added')}catch(e:any){toast.error(e.message)}
  }
  const del = async (id:string) => { if(!confirm('Delete?'))return; try{await api(`/teams/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)} }
  const edit = (t:any) => { setEditId(t.id);setName(t.name);setEmoji(t.emoji);setCaptain(t.captain||'');setGroupId(t.groupId||'') }
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {teams.map(t=><div key={t.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className="text-sm text-white">{t.emoji} <strong>{t.name}</strong> <span className="text-[11px] text-[#4a5568]">· {t.group?.name||'No Group'}</span></span>
          <div className="flex gap-2"><button onClick={()=>edit(t)} className="text-[#8892b0] hover:text-[#f0c040] active:scale-95"><Pencil size={13}/></button><button onClick={()=>del(t.id)} className="text-red-400 active:scale-95"><Trash2 size={13}/></button></div>
        </div>)}
      </div>
      <input className="input-field" placeholder="Team name" value={name} onChange={e=>setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input-field" placeholder="Emoji e.g. 🦁" value={emoji} onChange={e=>setEmoji(e.target.value)} />
        <input className="input-field" placeholder="Captain name" value={captain} onChange={e=>setCaptain(e.target.value)} />
      </div>
      <select className="select-field" value={groupId} onChange={e=>setGroupId(e.target.value)}>
        <option value="">— No Group —</option>
        {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <button onClick={save} className="btn-gold w-full">{editId?'UPDATE TEAM':'+ ADD TEAM'}</button>
      {editId&&<button onClick={()=>{setEditId('');setName('');setEmoji('🏏');setCaptain('');setGroupId('')}} className="btn-outline w-full">Cancel</button>}
    </div>
  )
}
