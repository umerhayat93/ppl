import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
export default function PollsSection() {
  const { polls, setPolls } = useStore()
  const [q,setQ]=useState('');const [type,setType]=useState('Poll');const [opts,setOpts]=useState(['',''])
  const reload = async () => { const r:any=await api('/polls'); setPolls(r.data||r) }
  const addOpt = () => setOpts(o=>[...o,''])
  const setOpt = (i:number,v:string) => setOpts(o=>o.map((x,j)=>j===i?v:x))
  const save = async () => {
    const options = opts.filter(o=>o.trim())
    if(!q.trim()||options.length<2){toast.error('Question + 2 options needed');return}
    try{await api('/polls','POST',{type,question:q,options});setQ('');setType('Poll');setOpts(['','']);await reload();toast.success('Poll added')}catch(e:any){toast.error(e.message)}
  }
  const del = async (id:string)=>{if(!confirm('Delete?'))return;try{await api(`/polls/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)}}
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-36 overflow-y-auto">
        {polls.map(p=><div key={p.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
          <span className="text-sm text-white flex-1 truncate mr-2">{p.question}</span>
          <button onClick={()=>del(p.id)} className="text-red-400 active:scale-95 flex-shrink-0"><Trash2 size={13}/></button>
        </div>)}
      </div>
      <input className="input-field" placeholder="Poll type e.g. Prediction" value={type} onChange={e=>setType(e.target.value)} />
      <input className="input-field" placeholder="Poll question" value={q} onChange={e=>setQ(e.target.value)} />
      {opts.map((o,i)=><input key={i} className="input-field" placeholder={`Option ${i+1}`} value={o} onChange={e=>setOpt(i,e.target.value)} />)}
      <div className="flex gap-2">
        <button onClick={addOpt} className="btn-outline flex-1">+ Option</button>
        <button onClick={save} className="btn-gold flex-1">SAVE POLL</button>
      </div>
    </div>
  )
}
