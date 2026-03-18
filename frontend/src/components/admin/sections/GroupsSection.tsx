import { useState } from 'react'
import { useStore } from '../../../store'
import { api } from '../../../api/client'
import toast from 'react-hot-toast'
import { Trash2, Pencil } from 'lucide-react'

const COLORS = ['gold','blue','green','red','purple','teal']

export default function GroupsSection() {
  const { groups, setGroups } = useStore()
  const [name, setName]     = useState('')
  const [color, setColor]   = useState('gold')
  const [editId, setEditId] = useState('')

  const reload = async () => {
    const r: any = await api('/groups')
    setGroups(r.data || r)
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Enter a group name'); return }
    try {
      if (editId) {
        await api('/groups/' + editId, 'PUT', { name: trimmed, color })
        toast.success('Group updated')
      } else {
        await api('/groups', 'POST', { name: trimmed, color })
        toast.success('Group added')
      }
      setName(''); setColor('gold'); setEditId('')
      await reload()
    } catch (e: any) { toast.error(e.message) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this group?')) return
    try { await api('/groups/' + id, 'DELETE'); await reload() }
    catch (e: any) { toast.error(e.message) }
  }

  const edit = (g: any) => { setEditId(g.id); setName(g.name); setColor(g.color) }
  const cancel = () => { setEditId(''); setName(''); setColor('gold') }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {groups.length === 0 && <p className="text-xs text-[#4a5568] text-center py-2">No groups yet</p>}
        {groups.map(g => (
          <div key={g.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.04]">
            <div>
              <span className="text-sm text-white font-semibold">{g.name}</span>
              <span className="text-[11px] text-[#4a5568] ml-2">({g.color})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(g)} className="text-[#8892b0] hover:text-[#f0c040] active:scale-95"><Pencil size={13}/></button>
              <button onClick={() => del(g.id)} className="text-red-400 active:scale-95"><Trash2 size={13}/></button>
            </div>
          </div>
        ))}
      </div>
      <input
        className="input-field"
        placeholder="Group name e.g. Group A"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
      />
      <select className="select-field" value={color} onChange={e => setColor(e.target.value)}>
        {COLORS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
      </select>
      <button onClick={save} className="btn-gold w-full">{editId ? 'UPDATE GROUP' : '+ ADD GROUP'}</button>
      {editId && <button onClick={cancel} className="btn-outline w-full">Cancel</button>}
    </div>
  )
}
