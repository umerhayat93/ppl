import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
export default function RulesSection() {
  const { rules, setRules } = useStore()
  const [content, setContent] = useState('')
  const reload = async () => { const r:any=await api('/rules'); setRules(r.data||r) }
  const add = async () => { if(!content.trim())return; try{await api('/rules','POST',{content});setContent('');await reload();toast.success('Rule added')}catch(e:any){toast.error(e.message)} }
  const del = async (id:number)=>{ try{await api(`/rules/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)} }
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {rules.map((r,i)=><div key={r.id} className="flex items-start gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className="text-[11px] text-[#f0c040] font-bold mt-0.5 flex-shrink-0">{i+1}.</span>
          <span className="text-sm text-[#8892b0] flex-1">{r.content}</span>
          <button onClick={()=>del(r.id)} className="text-red-400 active:scale-95 flex-shrink-0 mt-0.5"><Trash2 size={13}/></button>
        </div>)}
      </div>
      <input className="input-field" placeholder="Add rule..." value={content} onChange={e=>setContent(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} />
      <button onClick={add} className="btn-gold w-full">+ ADD RULE</button>
    </div>
  )
}
