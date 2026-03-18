import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2, Pencil } from 'lucide-react'
export default function OrgsSection() {
  const { orgs, setOrgs } = useStore()
  const [name,setName]=useState('');const [role,setRole]=useState('');const [emoji,setEmoji]=useState('🏢');const [since,setSince]=useState('');const [editId,setEditId]=useState('')
  const reload = async () => { const r:any=await api('/orgs'); setOrgs(r.data||r) }
  const save = async () => {
    if(!name.trim()){toast.error('Name required');return}
    try{if(editId) await api(`/orgs/${editId}`,'PUT',{name,role,emoji,since}); else await api('/orgs','POST',{name,role,emoji,since});setName('');setRole('');setEmoji('🏢');setSince('');setEditId('');await reload();toast.success(editId?'Updated':'Added')}catch(e:any){toast.error(e.message)}
  }
  const del = async (id:string)=>{if(!confirm('Delete?'))return;try{await api(`/orgs/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)}}
  const edit = (o:any)=>{setEditId(o.id);setName(o.name);setRole(o.role);setEmoji(o.emoji);setSince(o.since)}
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-36 overflow-y-auto">
        {orgs.map(o=><div key={o.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className="text-sm text-white">{o.emoji} <strong>{o.name}</strong> <span className="text-[11px] text-[#4a5568]">· {o.role}</span></span>
          <div className="flex gap-2"><button onClick={()=>edit(o)} className="text-[#8892b0] hover:text-[#f0c040] active:scale-95"><Pencil size={13}/></button><button onClick={()=>del(o.id)} className="text-red-400 active:scale-95"><Trash2 size={13}/></button></div>
        </div>)}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input className="input-field" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input-field w-14" placeholder="🏢" value={emoji} onChange={e=>setEmoji(e.target.value)} />
      </div>
      <input className="input-field" placeholder="Role / Title" value={role} onChange={e=>setRole(e.target.value)} />
      <input className="input-field" placeholder="Since (year)" value={since} onChange={e=>setSince(e.target.value)} />
      <button onClick={save} className="btn-gold w-full">{editId?'UPDATE':'+ ADD OFFICIAL'}</button>
      {editId&&<button onClick={()=>{setEditId('');setName('');setRole('');setEmoji('🏢');setSince('')}} className="btn-outline w-full">Cancel</button>}
    </div>
  )
}
