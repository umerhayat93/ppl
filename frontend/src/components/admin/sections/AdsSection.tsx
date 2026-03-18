import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2, Pencil } from 'lucide-react'
export default function AdsSection() {
  const { ads, setAds } = useStore()
  const [content,setContent]=useState('');const [editId,setEditId]=useState('');const [active,setActive]=useState(true)
  const reload = async () => { const r:any=await api('/ads/admin'); setAds(r.data||r) }
  const save = async () => {
    if(!content.trim()){toast.error('Content required');return}
    try{if(editId) await api(`/ads/${editId}`,'PUT',{content,active}); else await api('/ads','POST',{content,active});setContent('');setEditId('');setActive(true);await reload();toast.success(editId?'Updated':'Ad added')}catch(e:any){toast.error(e.message)}
  }
  const del = async (id:string)=>{if(!confirm('Delete?'))return;try{await api(`/ads/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)}}
  const edit = (a:any)=>{setEditId(a.id);setContent(a.content);setActive(a.active)}
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {ads.map(a=><div key={a.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className={`text-sm flex-1 truncate mr-2 ${a.active?'text-white':'text-[#4a5568] line-through'}`}>{a.content}</span>
          <div className="flex gap-2 flex-shrink-0"><button onClick={()=>edit(a)} className="text-[#8892b0] hover:text-[#f0c040] active:scale-95"><Pencil size={13}/></button><button onClick={()=>del(a.id)} className="text-red-400 active:scale-95"><Trash2 size={13}/></button></div>
        </div>)}
      </div>
      <input className="input-field" placeholder="Ad text content" value={content} onChange={e=>setContent(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-[#8892b0] cursor-pointer">
        <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} className="w-4 h-4 rounded" />
        Active
      </label>
      <button onClick={save} className="btn-gold w-full">{editId?'UPDATE AD':'+ ADD AD'}</button>
      {editId&&<button onClick={()=>{setEditId('');setContent('');setActive(true)}} className="btn-outline w-full">Cancel</button>}
    </div>
  )
}
