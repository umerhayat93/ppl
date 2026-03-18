import { useStore } from '../../store'
import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'

export default function AdsSlider() {
  const { ads } = useStore()
  const [idx, setIdx] = useState(0)
  const active = ads.filter(a => a.active)

  useEffect(() => {
    if (active.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % active.length), 4000)
    return () => clearInterval(t)
  }, [active.length])

  if (!active.length) return null

  return (
    <div className="mx-3 mb-3 rounded-xl bg-[#0f1628] border border-[#f0c040]/10 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <Megaphone size={13} className="text-[#f0c040] flex-shrink-0" />
        <div className="flex-1 overflow-hidden relative h-5">
          {active.map((ad, i) => (
            <div
              key={ad.id}
              className="absolute inset-0 transition-all duration-500 flex items-center"
              style={{ opacity: i === idx ? 1 : 0, transform: `translateY(${i === idx ? 0 : 8}px)` }}
            >
              <span className="text-xs text-[#8892b0] truncate">{ad.content}</span>
            </div>
          ))}
        </div>
        {active.length > 1 && (
          <div className="flex gap-1 flex-shrink-0">
            {active.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all ${i===idx?'bg-[#f0c040]':'bg-white/20'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
