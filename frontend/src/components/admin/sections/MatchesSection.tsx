import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2, Pencil } from 'lucide-react'
import { fmtDate, fmtTime, statusLabel } from '../../../utils'
const STAGES = [{v:'group',l:'Group'},{v:'prequarter',l:'Pre-QF'},{v:'quarter',l:'QF'},{v:'semi',l:'SF'},{v:'final',l:'Final'}]
const STATUSES = ['upcoming','live','completed','rain','stopped','postponed','cancelled']
const INIT = { stage:'group',groupId:'',matchNo:'',team1Id:'',team2Id:'',date:'',time:'',year:2026,venue:'Pattan Cricket Ground',status:'upcoming',result:'',score1:'',score2:'',overs:10 }
export default function MatchesSection() {
  const { matches, teams, groups, setMatches } = useStore()
  const [form, setForm] = useState<any>(INIT); const [editId, setEditId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const reload = async () => { const r:any=await api('/matches'); setMatches(r.data||r) }
  const set = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))
  const save = async () => {
    if(!form.team1Id||!form.team2Id){toast.error('Select both teams');return}
    try{
      if(editId) await api(`/matches/${editId}`,'PUT',form); else await api('/matches','POST',form)
      setForm(INIT);setEditId('');setShowForm(false);await reload();toast.success(editId?'Updated':'Match added')
    }catch(e:any){toast.error(e.message)}
  }
  const del = async (id:string) => { if(!confirm('Delete?'))return; try{await api(`/matches/${id}`,'DELETE');await reload()}catch(e:any){toast.error(e.message)} }
  const edit = (m:any) => { setEditId(m.id);setForm({stage:m.stage,groupId:m.groupId||'',matchNo:m.matchNo,team1Id:m.team1Id,team2Id:m.team2Id,date:m.date,time:m.time,year:m.year,venue:m.venue,status:m.status,result:m.result,score1:m.score1,score2:m.score2,overs:m.overs});setShowForm(true) }
  const needsResult = ['completed','rain','stopped','postponed','cancelled'].includes(form.status)
  const filteredTeams = form.groupId ? teams.filter(t=>t.groupId===form.groupId) : teams
  return (
    <div className="space-y-3">
      <button onClick={()=>{setShowForm(s=>!s);setEditId('');setForm(INIT)}} className="btn-gold w-full">{showForm?'✕ Cancel':'+ ADD MATCH'}</button>
      {showForm && (
        <div className="space-y-2 card p-3">
          <div className="grid grid-cols-2 gap-2">
            <select className="select-field" value={form.stage} onChange={e=>set('stage',e.target.value)}>{STAGES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select>
            <input className="input-field" placeholder="Match #" value={form.matchNo} onChange={e=>set('matchNo',e.target.value)} />
          </div>
          <select className="select-field" value={form.groupId} onChange={e=>set('groupId',e.target.value)}>
            <option value="">— No Group —</option>
            {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select className="select-field" value={form.team1Id} onChange={e=>set('team1Id',e.target.value)}><option value="">Team 1</option>{filteredTeams.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</select>
            <select className="select-field" value={form.team2Id} onChange={e=>set('team2Id',e.target.value)}><option value="">Team 2</option>{filteredTeams.map(t=><option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
            <input className="input-field" type="time" value={form.time} onChange={e=>set('time',e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" placeholder="Venue" value={form.venue} onChange={e=>set('venue',e.target.value)} />
            <input className="input-field" type="number" placeholder="Overs" value={form.overs} onChange={e=>set('overs',+e.target.value)} />
          </div>
          <select className="select-field" value={form.status} onChange={e=>set('status',e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{statusLabel[s]||s}</option>)}</select>
          {needsResult && <>
            <input className="input-field" placeholder="Result" value={form.result} onChange={e=>set('result',e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input-field" placeholder="Score 1" value={form.score1} onChange={e=>set('score1',e.target.value)} />
              <input className="input-field" placeholder="Score 2" value={form.score2} onChange={e=>set('score2',e.target.value)} />
            </div>
          </>}
          <button onClick={save} className="btn-gold w-full">{editId?'UPDATE MATCH':'SAVE MATCH'}</button>
        </div>
      )}
      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {matches.map(m=>(
          <div key={m.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-semibold truncate">[{m.matchNo||'?'}] {m.team1?.name} vs {m.team2?.name}</div>
              <div className="text-[11px] text-[#4a5568]">{fmtDate(m.date)} {fmtTime(m.time)} · {statusLabel[m.status]||m.status}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-2">
              <button onClick={()=>edit(m)} className="text-[#8892b0] hover:text-[#f0c040] active:scale-95"><Pencil size={13}/></button>
              <button onClick={()=>del(m.id)} className="text-red-400 active:scale-95"><Trash2 size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
