import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
export default function AnnouncementsSection() {
  const { ann, setAnn } = useStore()
  const [content, setContent] = useState('')
  const reload = async () => { const r:any=await api('/ann'); setAnn(r.data||r) }
  const add = async () => { if(!content.trim())return; try{await api('/ann','POST',{content});setContent('');await reload();toast.success('Posted')}catch(e:any){toast.error(e.message)} }
  const del = async (id:number)=>{ try{await api(`/ann/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)} }
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {ann.map(a=><div key={a.id} className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className="text-sm text-[#8892b0] flex-1 truncate">{a.content}</span>
          <button onClick={()=>del(a.id)} className="text-red-400 active:scale-95 flex-shrink-0"><Trash2 size={13}/></button>
        </div>)}
      </div>
      <textarea className="input-field resize-none" rows={2} placeholder="Type announcement..." value={content} onChange={e=>setContent(e.target.value)} />
      <button onClick={add} className="btn-gold w-full">📢 POST ANNOUNCEMENT</button>
    </div>
  )
}
