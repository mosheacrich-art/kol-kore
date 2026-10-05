import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookMarked, BookOpen, CalendarClock, Check, MoreHorizontal, Mic, Pencil, Sparkles, Trash2, Undo2 } from 'lucide-react'
import { PARASHOT, ALL_PARASHOT } from '../../data/parashot'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { ALL_MOADIM } from '../../data/moadim'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../context/LangContext'
import { Avatar, Modal } from '../ui'

/** pending | overdue | submitted | late */
export function homeworkStatus(item) {
  if (item.status === 'submitted') return 'submitted'
  if (item.status === 'late') return 'late'
  if (item.due) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (new Date(item.due + (item.due.length === 10 ? 'T00:00' : '')) < today) return 'overdue'
  }
  return 'pending'
}

export function StatusBadge({ status, t }) {
  const map = {
    pending:   { cls: 'badge-warning', label: t('status_pending') },
    overdue:   { cls: 'badge-danger',  label: t('ui_overdue') },
    late:      { cls: 'badge-danger',  label: t('status_late') },
    submitted: { cls: 'badge-success', label: t('status_submitted') },
  }
  const s = map[status] || map.pending
  return <span className={`badge badge-dot ${s.cls}`}>{s.label}</span>
}

const TYPE_ICON = { parasha: BookOpen, haftara: BookMarked, tefila: Sparkles }

export default function HomeworkItem({ item, showStudent = true, teacherId, onChange, onDelete, onEdit }) {
  const { t } = useLang()
  const locale = t('date_locale') || undefined
  const [busy, setBusy] = useState(false)
  const status = homeworkStatus(item)
  const hwType = item.type || 'parasha'
  const TypeIcon = TYPE_ICON[hwType] || BookOpen
  const typeLabels = { parasha: t('nav_parashot') || t('nav_study'), haftara: t('nav_haftara'), tefila: t('nav_tefila') }

  const parasha = item.parasha_id && hwType !== 'tefila'
    ? (PARASHOT.find(p => p.id === item.parasha_id) || ALL_PARASHOT.find(p => p.id === item.parasha_id) || ALL_MOADIM.find(p => p.id === item.parasha_id))
    : null
  const aliyah = parasha && item.aliyah_idx != null ? parasha.aliyot?.[item.aliyah_idx] : null
  const aliyahLabel = aliyah ? (aliyah.n === 8 ? 'Maftir' : `${aliyah.n}ª Aliyá`) : null
  const haftara = item.haftara_id ? ALL_HAFTAROT.find(h => h.id === item.haftara_id) : null

  const setStatus = async (next) => {
    setBusy(true)
    await supabase.from('homework').update({ status: next }).eq('id', item.id).eq('teacher_id', teacherId)
    onChange?.({ ...item, status: next })
    setBusy(false)
  }
  const remove = async () => {
    setBusy(true)
    await supabase.from('homework').delete().eq('id', item.id).eq('teacher_id', teacherId)
    onDelete?.(item.id)
  }

  return (
    <article className="flex items-start gap-4 p-4 sm:p-5">
      {showStudent && <Avatar name={item.student?.name || '?'} size={38} single />}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {showStudent && <p className="text-[13px] text-ink-3 mb-0.5 truncate">{item.student?.name || t('ui_all_students')}</p>}
            <h3 className="text-[15px] font-medium text-ink leading-snug">{item.task}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge status={status} t={t} />
            <RowMenu disabled={busy} items={[
              status !== 'submitted'
                ? { icon: Check, label: t('ui_mark_done'), onClick: () => setStatus('submitted') }
                : { icon: Undo2, label: t('ui_mark_pending'), onClick: () => setStatus('pending') },
              onEdit && { icon: Pencil, label: t('ui_edit'), onClick: () => onEdit(item) },
              { icon: Trash2, label: t('ui_delete'), danger: true, onClick: remove },
            ].filter(Boolean)} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap text-[12px]">
          <span className="badge">
            <TypeIcon size={12} strokeWidth={2} />{typeLabels[hwType]}
          </span>
          {parasha && (
            <span className="badge">
              <span className="hebrew-ui text-[13px]">{parasha.heb}</span>
              {aliyahLabel && <><span className="text-ink-4">·</span>{aliyahLabel}</>}
            </span>
          )}
          {item.word_start != null && (
            <span className="badge badge-gold">{t('ui_words')} {item.word_start + 1}–{item.word_end + 1}</span>
          )}
          {haftara && <span className="badge"><span className="hebrew-ui text-[13px]">{haftara.heb}</span></span>}
          {hwType === 'tefila' && item.subject && <span className="badge max-w-[260px] truncate">{item.subject}</span>}
          {hwType !== 'tefila' && item.subject && <span className="badge">{item.subject}</span>}
          {item.require_audio && (
            <span className="badge badge-accent"><Mic size={12} strokeWidth={2} />{t('audio_required_badge')}</span>
          )}
          {item.due && (
            <span className={`inline-flex items-center gap-1 ms-1 ${status === 'overdue' ? 'text-danger' : 'text-ink-3'}`}>
              <CalendarClock size={13} strokeWidth={1.8} />
              {t('limit_label')} {new Date(item.due + (item.due.length === 10 ? 'T00:00' : '')).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {item.status === 'submitted' && item.recording_url && (
          <div className="mt-3">
            <p className="text-[12px] text-ink-3 mb-1">{t('student_recording')}</p>
            <audio controls src={item.recording_url} preload="none" className="w-full h-9" />
          </div>
        )}
      </div>
    </article>
  )
}

export function RowMenu({ items, disabled = false, label = 'Actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={label}
        className="btn btn-ghost btn-sm btn-icon text-ink-3">
        <MoreHorizontal size={18} strokeWidth={1.8} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
            className="absolute end-0 z-40 mt-1 min-w-[200px] p-1.5 bg-surface rounded-xl shadow-pop"
            style={{ border: '1px solid var(--border)' }}>
            {items.map(it => {
              const Icon = it.icon
              return (
                <button key={it.label} role="menuitem" type="button"
                  onClick={() => { setOpen(false); it.onClick() }}
                  className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] text-start transition-colors ${it.danger ? 'text-danger hover:bg-[rgba(var(--danger-rgb),0.07)]' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'}`}>
                  {Icon && <Icon size={15} strokeWidth={1.8} />}{it.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HomeworkEditModal({ item, teacherId, onClose, onSaved }) {
  const { t } = useLang()
  const [task, setTask] = useState(item.task || '')
  const [subject, setSubject] = useState(item.type === 'tefila' ? '' : (item.subject || ''))
  const [due, setDue] = useState(item.due ? item.due.slice(0, 10) : '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!task.trim()) return
    setSaving(true)
    const patch = { task: task.trim(), due: due || null }
    if (item.type !== 'tefila') patch.subject = subject || null
    await supabase.from('homework').update(patch).eq('id', item.id).eq('teacher_id', teacherId)
    onSaved({ ...item, ...patch })
    setSaving(false)
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="sm" title={t('ui_edit_hw')}
      footer={<>
        <button onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
        <button onClick={save} disabled={saving || !task.trim()} className="btn btn-primary">{saving ? t('saving') : t('ui_save')}</button>
      </>}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="edit-task">{t('task_label')}</label>
          <input id="edit-task" value={task} onChange={e => setTask(e.target.value)} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {item.type !== 'tefila' && (
            <div>
              <label className="label" htmlFor="edit-subject">{t('subject_label')}</label>
              <input id="edit-subject" value={subject} onChange={e => setSubject(e.target.value)} className="input" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="edit-due">{t('due_label')}</label>
            <input id="edit-due" type="date" value={due} onChange={e => setDue(e.target.value)} className="input" />
          </div>
        </div>
      </div>
    </Modal>
  )
}
