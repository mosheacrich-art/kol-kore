import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2 } from 'lucide-react'
import { Modal, Spinner } from './ui'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

// Quick homework assignment modal — pre-fills type/section from props
// preType: 'parasha' | 'haftara' | 'tefila'
// preRef: the section ref/id (stored in parasha_id for tefila type)
// preName: human-readable section name for display
// preHeb: Hebrew name for display
export default function HomeworkQuickModal({ onClose, preType, preRef, preName, preHeb }) {
  const { profile } = useAuth()
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

  return (
    <Modal open onClose={onClose} size="sm" title={t('ui_assign_hw')}
      footer={!sent && <>
        <button onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
        <button onClick={handleSend} disabled={saving || !form.task.trim()} className="btn btn-primary">
          {saving ? <><Spinner size={14} />{t('sending')}</> : t('send_hw')}
        </button>
      </>}>
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: 'rgb(var(--success-rgb))' }} />
          <p className="text-[15px] font-medium text-ink">{t('hw_assigned')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Pre-selected section — read-only */}
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-surface-2" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="flex-1 min-w-0">
              {preHeb && <span className="hebrew-ui text-[16px] text-ink me-2">{preHeb}</span>}
              <span className="text-[13px] text-ink-2">{preName}</span>
            </div>
            <span className="badge flex-shrink-0">{preType === 'haftara' ? t('nav_haftara') : preType === 'parasha' ? t('nav_parashot') : t('nav_tefila')}</span>
          </div>
          <div>
            <label className="label" htmlFor="qhw-to">{t('to_label')}</label>
            <select id="qhw-to" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} className="input">
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {!students.length && <option value="">{t('no_students_opt')}</option>}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="qhw-task">{t('task_label')}</label>
            <input id="qhw-task" value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
              placeholder={t('task_placeholder')} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="qhw-due">{t('due_label')}</label>
            <input id="qhw-due" type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} className="input" />
          </div>
        </div>
      )}
    </Modal>
  )
}
