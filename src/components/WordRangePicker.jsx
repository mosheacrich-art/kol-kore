import { useState, useMemo } from 'react'
import { useAliyahText } from '../hooks/useSefaria'
import { processVerse, splitWords } from '../utils/hebrew'
import { useLang } from '../context/LangContext'

export default function WordRangePicker({ aliyahRef, onConfirm, onClose }) {
  const { t } = useLang()
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
    <div className="fixed inset-0 z-[300] flex flex-col bg-canvas" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between px-5 sm:px-8 py-4 flex-shrink-0 bg-surface app-header"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <p className="font-serif text-[18px] font-semibold text-ink">
            {step === 'start' ? t('picker_first_word') : t('picker_last_word')}
          </p>
          <p className="text-[13px] text-ink-3 mt-0.5">
            {step === 'start' ? t('picker_start_hint') : t('picker_end_hint')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {step === 'end' && (
            <button onClick={() => { setStep('start'); setStartIdx(null) }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              {t('picker_back_start')}
            </button>
          )}
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }} aria-label="Close">✕</button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-2 flex-shrink-0">
        {[{ n: 1, label: t('picker_step_start'), active: step === 'start' }, { n: 2, label: t('picker_step_end'), active: step === 'end' }].map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <div className="w-8 h-px" style={{ background: 'var(--border)' }} />}
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: s.active ? 'rgb(var(--gold-rgb))' : 'rgba(var(--gold-rgb),0.15)', color: s.active ? '#1A1204' : 'var(--text-gold)' }}>
              {s.n}
            </div>
            <span className="text-xs" style={{ color: s.active ? 'var(--text-gold)' : 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-6">
        {loading ? (
          <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>{t('loading')}</p>
        ) : (
          <div className="hebrew-reader" style={{ direction: 'rtl', textAlign: 'justify', fontSize: '26px', lineHeight: '2.4', color: 'var(--text)', background: 'var(--reader-bg)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
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
                    background: highlighted ? 'rgba(var(--gold-rgb),0.3)' : isStart ? 'rgba(var(--gold-rgb),0.2)' : 'transparent',
                    color: highlighted || isStart ? 'var(--text)' : 'inherit',
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
