import { useMemo, useState } from 'react'
import { BookMarked, BookOpen, CalendarPlus, Mic, Repeat, Sparkles, TextSelect, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendPushToUser } from '../../lib/sendPush'
import { PARASHOT, COMBINED_PARASHOT, ALL_PARASHOT } from '../../data/parashot'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { ALL_MOADIM, MOADIM_LIST } from '../../data/moadim'
import { useLang } from '../../context/LangContext'
import { useSiddurIndex, useSiddurShabbatIndex } from '../../hooks/useSefaria'
import WordRangePicker from '../WordRangePicker'
import { Modal } from '../ui'

const HAFTARA_CHAG_LABELS = {
  'rosh-hashana': 'Rosh Hashaná', 'yom-kipur': 'Yom Kipur',
  'sucot': 'Sucot', 'pesaj': 'Pesaj', 'shavuot': 'Shavuot',
}

const EMPTY = {
  task: '', subject: '', due: '',
  type: 'parasha',
  parasha_id: '', aliyah_idx: 0, require_audio: false,
  haftara_id: '',
  word_start: null, word_end: null,
  tefila_ref: '', tefila_name: '',
}

/**
 * Create homework for a student (teacher side). Inserts the row(s), a
 * notification per row and a push — same behaviour as the original Deberes flow.
 * Mount only while open (it loads the Siddur index for the Tefilá picker).
 */
export default function HomeworkComposer({ teacherId, students = [], fixedStudent = null, onClose, onCreated }) {
  const { t } = useLang()
  const [to, setTo] = useState(fixedStudent?.id || students[0]?.id || '')
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [repeatMode, setRepeatMode] = useState(false)
  const [repeatDates, setRepeatDates] = useState([])
  const [newDate, setNewDate] = useState('')

  const { services: tefilaWeekday } = useSiddurIndex('sefard')
  const { services: tefilaShabbat } = useSiddurShabbatIndex('sefard')
  const tefilaGroups = useMemo(() => {
    const build = list => (list || []).map(srv => ({
      name: srv.name,
      items: (srv.allSections || []).map(s => ({ ref: s.ref, label: `${srv.name} · ${s.title}`, heb: s.heTitle || '' })),
    })).filter(g => g.items.length)
    return [...build(tefilaWeekday), ...build(tefilaShabbat)]
  }, [tefilaWeekday, tefilaShabbat])

  const selectedParasha = ALL_PARASHOT.find(p => p.id === form.parasha_id) || ALL_MOADIM.find(p => p.id === form.parasha_id)
  const set = (patch) => setForm(f => ({ ...f, ...patch }))

  const toggleRepeat = () => {
    setRepeatMode(v => {
      setRepeatDates(!v && form.due ? [form.due] : [])
      return !v
    })
  }
  const addRepeatDate = () => {
    if (!newDate || repeatDates.includes(newDate)) return
    setRepeatDates(prev => [...prev, newDate].sort())
    setNewDate('')
  }

  const canSend = form.task.trim() && to && !(repeatMode && repeatDates.length === 0)

  const send = async () => {
    if (!canSend) return
    setSaving(true)
    const base = {
      teacher_id: teacherId,
      student_id: to || null,
      task: form.task.trim(),
      subject: form.type === 'tefila' ? (form.tefila_name || null) : (form.subject || null),
      type: form.type,
      parasha_id: form.type === 'parasha'
        ? (form.parasha_id || null)
        : (form.type === 'tefila' ? (form.tefila_ref || null) : null),
      aliyah_idx: form.type === 'parasha' && form.parasha_id ? form.aliyah_idx : null,
      require_audio: form.type === 'parasha' && form.parasha_id ? form.require_audio : false,
      haftara_id: form.type === 'haftara' ? (form.haftara_id || null) : null,
      word_start: form.type === 'parasha' && form.parasha_id && form.word_start != null ? form.word_start : null,
      word_end: form.type === 'parasha' && form.parasha_id && form.word_end != null ? form.word_end : null,
      status: 'pending',
    }
    const dues = repeatMode ? repeatDates : [form.due || null]
    const { data } = await supabase.from('homework')
      .insert(dues.map(d => ({ ...base, due: d })))
      .select('*, student:student_id(name)')

    if (base.student_id) {
      await supabase.from('notifications').insert(dues.map(() => ({
        student_id: base.student_id,
        teacher_id: teacherId,
        type: 'homework',
        message: base.task,
        parasha_id: base.parasha_id || null,
        aliyah_label: base.aliyah_idx != null ? `Aliyá ${base.aliyah_idx + 1}` : null,
        read: false,
      })))
      sendPushToUser(base.student_id, { title: '📚 Nuevo deber', body: base.task })
    }
    setSaving(false)
    onCreated?.(data || [])
    onClose()
  }

  const types = [
    { key: 'parasha', label: t('nav_parashot') || t('nav_study'), icon: BookOpen },
    { key: 'haftara', label: t('nav_haftara'), icon: BookMarked },
    { key: 'tefila',  label: t('nav_tefila'),  icon: Sparkles },
  ]
  const fmtDate = (d) => new Date(d + 'T00:00').toLocaleDateString(t('date_locale') || undefined, { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <>
      <Modal open onClose={onClose} size="md"
        title={fixedStudent ? t('ui_hw_for').replace('{name}', fixedStudent.name?.split(' ')[0] || '') : t('send_hw_title')}
        footer={<>
          <button onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
          <button onClick={send} disabled={saving || !canSend} className="btn btn-primary">
            {saving ? t('sending') : repeatMode && repeatDates.length > 1
              ? t('ui_send_n_hw').replace('{n}', repeatDates.length) : t('send_hw')}
          </button>
        </>}>
        <div className="flex flex-col gap-4">
          {!fixedStudent && (
            <div>
              <label className="label" htmlFor="hw-to">{t('to_label')}</label>
              <select id="hw-to" value={to} onChange={e => setTo(e.target.value)} className="input">
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label" htmlFor="hw-task">{t('task_label')}</label>
            <input id="hw-task" value={form.task} onChange={e => set({ task: e.target.value })}
              placeholder={t('task_placeholder')} className="input" />
          </div>

          <div>
            <span className="label">{t('hw_type_label')}</span>
            <div className="segmented w-full" role="tablist">
              {types.map(opt => {
                const Icon = opt.icon
                return (
                  <button key={opt.key} type="button" role="tab" aria-selected={form.type === opt.key}
                    onClick={() => set({ ...EMPTY, task: form.task, due: form.due, type: opt.key })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5">
                    <Icon size={14} strokeWidth={1.8} />{opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {form.type === 'parasha' && (
            <div>
              <label className="label" htmlFor="hw-parasha">{t('parasha_optional')}</label>
              <select id="hw-parasha" value={form.parasha_id}
                onChange={e => set({ parasha_id: e.target.value, aliyah_idx: 0, word_start: null, word_end: null })}
                className="input">
                <option value="">{t('no_parasha_opt')}</option>
                <optgroup label={t('ui_weekly_parashot')}>
                  {PARASHOT.map(p => <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>)}
                </optgroup>
                <optgroup label={t('ui_combined_parashot')}>
                  {COMBINED_PARASHOT.map(p => <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>)}
                </optgroup>
                {MOADIM_LIST.map(m => {
                  const items = ALL_MOADIM.filter(p => p.chag === m.id)
                  if (!items.length) return null
                  return (
                    <optgroup key={m.id} label={`${m.name} · ${m.heb}`}>
                      {items.map(p => <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            </div>
          )}

          {form.type === 'parasha' && form.parasha_id && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="hw-aliyah">{t('aliyah_label')}</label>
                <select id="hw-aliyah" value={form.aliyah_idx}
                  onChange={e => set({ aliyah_idx: Number(e.target.value), word_start: null, word_end: null })}
                  className="input">
                  {(selectedParasha?.aliyot || []).map((a, i) => (
                    <option key={i} value={i}>{a.n === 8 ? 'Maftir' : `${a.n}ª Aliyá`} — {a.ref}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label">{t('fragment_label')}</span>
                {form.word_start != null ? (
                  <div className="input flex items-center gap-2" style={{ background: 'rgba(var(--gold-rgb),0.08)', borderColor: 'rgba(var(--gold-rgb),0.3)' }}>
                    <TextSelect size={15} className="text-gold-ink flex-shrink-0" />
                    <span className="text-gold-ink truncate">{t('words_range').replace('{s}', form.word_start + 1).replace('{e}', form.word_end + 1)}</span>
                    <button type="button" onClick={() => set({ word_start: null, word_end: null })}
                      className="ms-auto text-ink-3 hover:text-ink" aria-label={t('full_aliyah_btn')}>
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowRangePicker(true)} className="input flex items-center gap-2 text-ink-3 text-start">
                    <TextSelect size={15} className="flex-shrink-0" />
                    <span className="truncate">{t('select_fragment')}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {form.type === 'parasha' && form.parasha_id && (
            <button type="button" role="switch" aria-checked={form.require_audio}
              onClick={() => set({ require_audio: !form.require_audio })}
              className="flex items-center gap-3 p-3.5 rounded-xl text-start transition-colors"
              style={{ background: form.require_audio ? 'rgba(var(--accent-rgb),0.06)' : 'var(--surface-2)', border: `1px solid ${form.require_audio ? 'rgba(var(--accent-rgb),0.25)' : 'var(--border-subtle)'}` }}>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface text-accent flex-shrink-0" style={{ border: '1px solid var(--border-subtle)' }}>
                <Mic size={16} strokeWidth={1.8} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink">{t('require_audio_label')}</span>
                <span className="block text-xs text-ink-3">{form.require_audio ? t('must_record') : t('no_audio_req')}</span>
              </span>
              <Toggle on={form.require_audio} />
            </button>
          )}

          {form.type === 'haftara' && (
            <div>
              <label className="label" htmlFor="hw-haftara">{t('haftara_optional')}</label>
              <select id="hw-haftara" value={form.haftara_id} onChange={e => set({ haftara_id: e.target.value })} className="input">
                <option value="">{t('no_haftara_opt')}</option>
                <optgroup label={t('ui_weekly_haftarot')}>
                  {ALL_HAFTAROT.filter(h => h.parasha).map(h => <option key={h.id} value={h.id}>{h.name} · {h.heb}</option>)}
                </optgroup>
                {Object.entries(HAFTARA_CHAG_LABELS).map(([chag, label]) => {
                  const items = ALL_HAFTAROT.filter(h => h.chag === chag)
                  if (!items.length) return null
                  return (
                    <optgroup key={chag} label={label}>
                      {items.map(h => <option key={h.id} value={h.id}>{h.name} · {h.heb}</option>)}
                    </optgroup>
                  )
                })}
                {ALL_HAFTAROT.some(h => h.chag && !HAFTARA_CHAG_LABELS[h.chag]) && (
                  <optgroup label={t('ui_special')}>
                    {ALL_HAFTAROT.filter(h => h.chag && !HAFTARA_CHAG_LABELS[h.chag]).map(h => (
                      <option key={h.id} value={h.id}>{h.name} · {h.heb}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {form.type === 'tefila' ? (
              <div>
                <label className="label" htmlFor="hw-tefila">{t('section')}</label>
                <select id="hw-tefila" value={form.tefila_ref}
                  onChange={e => {
                    const ref = e.target.value
                    let name = ''
                    for (const g of tefilaGroups) {
                      const hit = g.items.find(i => i.ref === ref)
                      if (hit) { name = `${hit.label}${hit.heb ? ' · ' + hit.heb : ''}`; break }
                    }
                    set({ tefila_ref: ref, tefila_name: name })
                  }}
                  className="input">
                  <option value="">{t('general_option')}</option>
                  {tefilaGroups.map(g => (
                    <optgroup key={g.name} label={g.name}>
                      {g.items.map(it => <option key={it.ref} value={it.ref}>{it.label}{it.heb ? ` · ${it.heb}` : ''}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="hw-subject">{t('subject_label')}</label>
                <input id="hw-subject" value={form.subject} onChange={e => set({ subject: e.target.value })}
                  placeholder="Trop" className="input" />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-ink-2" htmlFor="hw-due">{t('due_label')}</label>
                <button type="button" onClick={toggleRepeat} aria-pressed={repeatMode}
                  className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 h-6 rounded-md transition-colors ${repeatMode ? 'text-accent' : 'text-ink-3 hover:text-ink'}`}
                  style={{ background: repeatMode ? 'rgba(var(--accent-rgb),0.08)' : 'transparent' }}>
                  <Repeat size={12} strokeWidth={2} />{t('ui_repeat')}
                </button>
              </div>
              {!repeatMode ? (
                <input id="hw-due" type="date" value={form.due} onChange={e => set({ due: e.target.value })} className="input" />
              ) : (
                <div className="input flex items-center text-ink-3">
                  {repeatDates.length === 0 ? t('ui_no_dates') : t('ui_n_dates').replace('{n}', repeatDates.length)}
                </div>
              )}
            </div>
          </div>

          {repeatMode && (
            <div className="rounded-xl p-3 bg-surface-2" style={{ border: '1px solid var(--border-subtle)' }}>
              {repeatDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {repeatDates.map(d => (
                    <span key={d} className="badge bg-surface capitalize" style={{ border: '1px solid var(--border)' }}>
                      {fmtDate(d)}
                      <button type="button" onClick={() => setRepeatDates(p => p.filter(x => x !== d))} aria-label="Remove" className="text-ink-4 hover:text-danger">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input h-9 flex-1" aria-label={t('due_label')} />
                <button type="button" onClick={addRepeatDate} disabled={!newDate || repeatDates.includes(newDate)} className="btn btn-secondary btn-sm h-9">
                  <CalendarPlus size={14} />{t('ui_add')}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {showRangePicker && selectedParasha && (
        <WordRangePicker
          aliyahRef={selectedParasha.aliyot[form.aliyah_idx]?.ref}
          onConfirm={(s, e) => { set({ word_start: s, word_end: e }); setShowRangePicker(false) }}
          onClose={() => setShowRangePicker(false)}
        />
      )}
    </>
  )
}

export function Toggle({ on }) {
  return (
    <span aria-hidden="true" className="relative inline-flex w-10 h-6 rounded-full flex-shrink-0 transition-colors"
      style={{ background: on ? 'rgb(var(--accent-rgb))' : 'var(--border-strong)' }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ insetInlineStart: on ? '18px' : '2px' }} />
    </span>
  )
}
