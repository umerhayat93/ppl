import { useState } from 'react'
import { useStore } from '../../store'
const CATS = ['all','match','players','crowd','ceremony']
export default function GalleryPage() {
  const { gallery } = useStore()
  const [cat, setCat] = useState('all')
  const items = cat==='all' ? gallery : gallery.filter(g=>g.category===cat)
  return (
    <div className="fade-up">
      <div className="px-4 py-3"><span className="font-display text-xl text-white tracking-wide">📸 Gallery</span></div>
      <div className="px-3 flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${cat===c?'bg-[#f0c040]/15 text-[#f0c040] border border-[#f0c040]/25':'bg-white/[0.03] text-[#8892b0] border border-white/[0.06]'}`}>{c}</button>)}
      </div>
      {!items.length && <div className="text-center py-16 text-[#4a5568]"><div className="text-4xl mb-3 opacity-30">📸</div><p className="text-sm">No items yet</p></div>}
      <div className="px-3 grid grid-cols-3 gap-2 pb-6">
        {items.map(g=><div key={g.id} className="card aspect-square flex flex-col items-center justify-center gap-1 p-2">
          <span className="text-3xl">{g.emoji}</span>
          <span className="text-[10px] text-[#4a5568] text-center line-clamp-2">{g.label}</span>
        </div>)}
      </div>
    </div>
  )
}
