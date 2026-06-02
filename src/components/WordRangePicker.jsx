import { useState, useMemo } from 'react'
import { useAliyahText } from '../hooks/useSefaria'
import { processVerse, splitWords } from '../utils/hebrew'

export default function WordRangePicker({ aliyahRef, onConfirm, onClose }) {
  const { verses, loading } = useAliyahText(aliyahRef, true, null)
  const [step, setStep] = useState('start')
  const [startIdx, setStartIdx] = useState(null)
  const [hoverIdx, setHoverIdx] = useState(-1)

  const allWords = useMemo(() => {
    const result = []
    verses.forEach(verse => splitWords(processVerse(verse, 'taamim')).forEach(w => result.push(w)))
    return result
  }, [verses])

  const handleClick = (i) => {
    if (step === 'start') { setStartIdx(i); setStep('end') }
    else {
      const s = Math.min(startIdx, i), e = Math.max(startIdx, i)
      onConfirm(s, e)
    }
  }

  const inRange = (i) => {
    if (step !== 'end' || startIdx == null || hoverIdx < 0) return false
    return i >= Math.min(startIdx, hoverIdx) && i <= Math.max(startIdx, hoverIdx)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}>
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <p className="text-sm font-semibold text-white">
            {step === 'start' ? 'Toca la primera palabra' : 'Toca la última palabra'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {step === 'start' ? 'Empieza seleccionando el inicio del fragmento' : 'Ahora selecciona el final del fragmento'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {step === 'end' && (
            <button onClick={() => { setStep('start'); setStartIdx(null) }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              ← Inicio
            </button>
          )}
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>✕</button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-2 flex-shrink-0">
        {[{ n: 1, label: 'Inicio', active: step === 'start' }, { n: 2, label: 'Fin', active: step === 'end' }].map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: s.active ? '#f59e0b' : 'rgba(249,184,0,0.15)', color: s.active ? '#000' : '#f59e0b' }}>
              {s.n}
            </div>
            <span className="text-xs" style={{ color: s.active ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
        ) : (
          <div className="hebrew-reader" style={{ direction: 'rtl', textAlign: 'justify', fontSize: '26px', lineHeight: '2.4', color: 'rgba(255,255,255,0.88)' }}>
            {allWords.map((word, i) => {
              const highlighted = inRange(i)
              const isStart = step === 'end' && i === startIdx
              return (
                <span key={i}
                  onClick={() => handleClick(i)}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(-1)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '3px',
                    padding: '1px 2px',
                    background: highlighted ? 'rgba(249,184,0,0.3)' : isStart ? 'rgba(249,184,0,0.2)' : 'transparent',
                    color: highlighted || isStart ? '#fbbf24' : 'rgba(255,255,255,0.88)',
                    transition: 'background 0.07s, color 0.07s',
                  }}>
                  {word}{' '}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
