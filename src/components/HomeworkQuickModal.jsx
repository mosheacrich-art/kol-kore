import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

// Quick homework assignment modal — pre-fills type/section from props
// preType: 'parasha' | 'haftara' | 'tefila'
// preRef: the section ref/id (stored in parasha_id for tefila type)
// preName: human-readable section name for display
// preHeb: Hebrew name for display
export default function HomeworkQuickModal({ onClose, preType, preRef, preName, preHeb }) {
  const { profile } = useAuth()
  const { isDark } = useTheme()
  const { t } = useLang()

  const [students, setStudents] = useState([])
  const [form, setForm] = useState({
    to: '',
    task: '',
    due: '',
  })
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name')
      .eq('teacher_id', profile.id)
      .eq('role', 'student')
      .then(({ data }) => {
        setStudents(data || [])
        if (data?.length) setForm(f => ({ ...f, to: data[0].id }))
      })
  }, [profile.id])

  const handleSend = async () => {
    if (!form.task.trim()) return
    setSaving(true)

    await supabase.from('homework').insert({
      teacher_id: profile.id,
      student_id: form.to || null,
      task: form.task.trim(),
      due: form.due || null,
      type: preType,
      parasha_id: preType === 'parasha' ? preRef : (preType === 'tefila' ? preRef : null),
      aliyah_idx: null,
      require_audio: false,
      haftara_id: preType === 'haftara' ? preRef : null,
      status: 'pending',
      // Store display name in subject for tefila type
      subject: preType === 'tefila' ? preName : null,
    })

    setSaving(false)
    setSent(true)
    setTimeout(onClose, 1200)
  }

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  }

  const typeColor = preType === 'tefila' ? '#8b5cf6' : preType === 'haftara' ? '#10b981' : '#f59e0b'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-gold)' }}>
              שִׁעוּרֵי בַּיִת · Deberes
            </p>
            <h2 className="text-lg font-light" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Asignar deber
            </h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="#22c55e" strokeWidth="1.5"/>
                <path d="M6.5 11l3 3L15.5 8" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t('hw_assigned')}</p>
          </div>
        ) : (
          <>
            {/* Pre-selected section — read-only badge */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: `${typeColor}0d`, border: `1px solid ${typeColor}30` }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: typeColor }} />
              <div className="flex-1 min-w-0">
                {preHeb && (
                  <span className="hebrew text-sm mr-2" style={{ color: typeColor }}>{preHeb}</span>
                )}
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>{preName}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0"
                style={{ background: `${typeColor}18`, color: typeColor }}>
                {t('nav_tefila')}
              </span>
            </div>

            {/* Student */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('to_label')}</label>
              <select value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                {!students.length && <option value="">{t('no_students_opt')}</option>}
              </select>
            </div>

            {/* Task */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('task_label')}</label>
              <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
                placeholder={t('task_placeholder')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>

            {/* Due date */}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('due_label')}</label>
              <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                {t('cancel')}
              </button>
              <button onClick={handleSend} disabled={saving || !form.task.trim()}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: form.task.trim() && !saving ? `${typeColor}18` : 'var(--bg-card)',
                  color: form.task.trim() && !saving ? typeColor : 'var(--text-muted)',
                  border: `1px solid ${form.task.trim() && !saving ? typeColor + '40' : 'var(--border-subtle)'}`,
                  opacity: saving ? 0.7 : 1,
                }}>
                {saving ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                      style={{ borderColor: `${typeColor}40`, borderTopColor: typeColor }} />
                    {t('sending')}
                  </span>
                ) : t('send_hw')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
