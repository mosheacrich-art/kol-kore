import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PARASHOT, COMBINED_PARASHOT, ALL_PARASHOT } from '../../data/parashot'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { ALL_MOADIM, MOADIM_LIST } from '../../data/moadim'
import { useLang } from '../../context/LangContext'
import WordRangePicker from '../../components/WordRangePicker'

const statusStyle = {
  pending:   { bg: 'var(--bg-card)', color: 'var(--text-3)' },
  submitted: { bg: 'rgba(45,212,191,0.1)', color: '#0d9488' },
  late:      { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
}

const ALIYAH_LABELS = ['1ª Aliyá', '2ª Aliyá', '3ª Aliyá', '4ª Aliyá', '5ª Aliyá', '6ª Aliyá', '7ª Aliyá', 'Maftir']

const IMPRESCINDIBLES = [
  { id: 'hodu',       name: 'Hodu',       heb: 'הוֹדוּ' },
  { id: 'ashrei',     name: 'Ashrei',     heb: 'אַשְׁרֵי' },
  { id: 'halleluyah', name: 'Halleluyah', heb: 'הַלְלוּיָהּ' },
  { id: 'az-yashir',  name: 'Az Yashir',  heb: 'אָז יָשִׁיר' },
  { id: 'veahavta',   name: "Ve'ahavta",  heb: 'וְאָהַבְתָּ' },
  { id: 'vehaya',     name: 'Vehaya',     heb: 'וְהָיָה' },
  { id: 'vayomer',    name: 'Vayomer',    heb: 'וַיֹּאמֶר' },
]

const HAFTARA_CHAG_LABELS = {
  'rosh-hashana': 'Rosh Hashaná', 'yom-kipur': 'Yom Kipur',
  'sucot': 'Sucot', 'pesaj': 'Pesaj', 'shavuot': 'Shavuot',
}

function RepeatDatesPanel({ dates, onAdd, onRemove, isDark }) {
  const [newDate, setNewDate] = useState('')

  const handleAdd = () => {
    if (!newDate || dates.includes(newDate)) return
    onAdd(newDate)
    setNewDate('')
  }

  const fmtDate = (d) =>
    new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(108,51,230,0.25)' }}>
      <div className="flex items-center gap-2 px-3 py-2"
        style={{ background: 'rgba(108,51,230,0.1)', borderBottom: dates.length ? '1px solid rgba(108,51,230,0.15)' : 'none' }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1" y="2" width="9" height="8" rx="1.5" stroke="#8b5cf6" strokeWidth="1.1"/>
          <path d="M3.5 1v2M7.5 1v2" stroke="#8b5cf6" strokeWidth="1.1" strokeLinecap="round"/>
          <path d="M1 5h9" stroke="#8b5cf6" strokeWidth="1.1"/>
        </svg>
        <span className="text-xs font-medium" style={{ color: '#8b5cf6' }}>
          Fechas de entrega{dates.length > 0 ? ` (${dates.length})` : ''}
        </span>
      </div>

      {dates.length > 0 && (
        <div className="px-3 pt-2 pb-1 flex flex-col gap-1" style={{ background: 'rgba(108,51,230,0.04)' }}>
          {dates.map(d => (
            <div key={d} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(108,51,230,0.09)', border: '1px solid rgba(108,51,230,0.15)' }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#8b5cf6' }} />
                <span className="text-xs capitalize" style={{ color: 'var(--text-2)' }}>{fmtDate(d)}</span>
              </div>
              <button type="button" onClick={() => onRemove(d)}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 px-3 py-2.5" style={{ background: 'rgba(108,51,230,0.04)' }}>
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
          className="flex-1 px-2.5 py-2 rounded-lg text-xs outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', colorScheme: isDark ? 'dark' : 'light' }} />
        <button type="button" onClick={handleAdd}
          disabled={!newDate || dates.includes(newDate)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
          style={{
            background: newDate && !dates.includes(newDate) ? 'rgba(108,51,230,0.15)' : 'var(--bg-card)',
            color: newDate && !dates.includes(newDate) ? '#8b5cf6' : 'var(--text-muted)',
            border: `1px solid ${newDate && !dates.includes(newDate) ? 'rgba(108,51,230,0.3)' : 'var(--border)'}`,
          }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Añadir
        </button>
      </div>
    </div>
  )
}

export default function TeacherHomework() {
  const { isDark } = useTheme()
  const { profile } = useAuth()
  const { t } = useLang()
  const [composing, setComposing] = useState(false)
  const [sent, setSent] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({
    to: '', task: '', subject: '', due: '',
    type: 'parasha',
    parasha_id: '', aliyah_idx: 0, require_audio: false,
    haftara_id: '',
    word_start: null, word_end: null,
  })
  const [saving, setSaving] = useState(false)
  const [hoverItem, setHoverItem] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const [repeatMode, setRepeatMode] = useState(false)
  const [repeatDates, setRepeatDates] = useState([])

  const toggleRepeat = () => {
    setRepeatMode(v => {
      if (!v && form.due) setRepeatDates([form.due])
      else if (!v) setRepeatDates([])
      return !v
    })
  }
  const addRepeatDate = (d) => { if (d && !repeatDates.includes(d)) setRepeatDates(prev => [...prev, d].sort()) }
  const removeRepeatDate = (d) => setRepeatDates(prev => prev.filter(x => x !== d))

  useEffect(() => {
    if (!profile) return
    supabase
      .from('homework')
      .select('*, student:student_id(name)')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSent(data || []))

    supabase
      .from('profiles')
      .select('id, name')
      .eq('teacher_id', profile.id)
      .eq('role', 'student')
      .then(({ data }) => {
        setStudents(data || [])
        if (data?.length) setForm(f => ({ ...f, to: data[0].id }))
      })
  }, [profile])

  const selectedParasha = ALL_PARASHOT.find(p => p.id === form.parasha_id) || ALL_MOADIM.find(p => p.id === form.parasha_id)

  const sendHomework = async () => {
    if (!form.task) return
    if (repeatMode && repeatDates.length === 0) return
    setSaving(true)

    const base = {
      teacher_id: profile.id,
      student_id: form.to || null,
      task: form.task,
      subject: form.subject || null,
      type: form.type,
      parasha_id: form.type === 'parasha' ? (form.parasha_id || null) : null,
      aliyah_idx: form.type === 'parasha' && form.parasha_id ? form.aliyah_idx : null,
      require_audio: form.type === 'parasha' && form.parasha_id ? form.require_audio : false,
      haftara_id: form.type === 'haftara' ? (form.haftara_id || null) : null,
      word_start: form.type === 'parasha' && form.parasha_id && form.word_start != null ? form.word_start : null,
      word_end: form.type === 'parasha' && form.parasha_id && form.word_end != null ? form.word_end : null,
      status: 'pending',
    }

    if (repeatMode && repeatDates.length > 0) {
      const rows = repeatDates.map(d => ({ ...base, due: d }))
      const { data } = await supabase.from('homework').insert(rows).select('*, student:student_id(name)')
      if (data) setSent(prev => [...[...data].reverse(), ...prev])
      if (base.student_id) {
        const notifRows = repeatDates.map(() => ({
          student_id: base.student_id,
          teacher_id: profile.id,
          type: 'homework',
          message: base.task,
          parasha_id: base.parasha_id || null,
          aliyah_label: base.aliyah_idx != null ? `Aliyá ${base.aliyah_idx + 1}` : null,
          read: false,
        }))
        await supabase.from('notifications').insert(notifRows)
      }
    } else {
      const { data } = await supabase.from('homework').insert({ ...base, due: form.due || null }).select('*, student:student_id(name)').single()
      if (data) setSent(prev => [data, ...prev])
      if (base.student_id) {
        await supabase.from('notifications').insert({
          student_id: base.student_id,
          teacher_id: profile.id,
          type: 'homework',
          message: base.task,
          parasha_id: base.parasha_id || null,
          aliyah_label: base.aliyah_idx != null ? `Aliyá ${base.aliyah_idx + 1}` : null,
          read: false,
        })
      }
    }

    setComposing(false)
    setRepeatMode(false)
    setRepeatDates([])
    setForm(f => ({ ...f, task: '', subject: '', due: '', type: 'parasha', parasha_id: '', aliyah_idx: 0, require_audio: false, haftara_id: '', word_start: null, word_end: null }))
    setSaving(false)
  }

  const deleteHomework = async (id) => {
    setDeleting(id)
    await supabase.from('homework').delete().eq('id', id).eq('teacher_id', profile.id)
    setSent(prev => prev.filter(item => item.id !== id))
    setDeleting(null)
  }

  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          שִׁעוּרֵי בַּיִת · Deberes
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          {t('homework_title')}
        </h1>
      </div>

      <div className="flex items-center justify-between mb-6 fade-up-2">
        <div />
        <button onClick={() => setComposing(true)}
          className="btn-gold px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          {t('new_hw')}
        </button>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{t('send_hw_title')}</h2>
              <button onClick={() => setComposing(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Alumno */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('to_label')}</label>
                <select value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Tarea */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('task_label')}</label>
                <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
                  placeholder={t('task_placeholder')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>

              {/* Tipo de deberes */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('hw_type_label')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'parasha', label: t('nav_study'),   color: '#f59e0b' },
                    { key: 'haftara', label: t('nav_haftara'), color: '#10b981' },
                    { key: 'tefila',  label: t('nav_tefila'),  color: '#8b5cf6' },
                  ].map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setForm(f => ({ ...f, type: opt.key, parasha_id: '', aliyah_idx: 0, haftara_id: '', require_audio: false, word_start: null, word_end: null, subject: '' }))}
                      className="py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: form.type === opt.key ? `${opt.color}18` : 'var(--bg-card)',
                        border: `1px solid ${form.type === opt.key ? opt.color + '50' : 'var(--border)'}`,
                        color: form.type === opt.key ? opt.color : 'var(--text-3)',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perashá — solo si tipo es parasha */}
              {form.type === 'parasha' && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>
                    {t('parasha_optional')}
                  </label>
                  <select value={form.parasha_id}
                    onChange={e => setForm(f => ({ ...f, parasha_id: e.target.value, aliyah_idx: 0, word_start: null, word_end: null }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                    <option value="">{t('no_parasha_opt')}</option>
                    <optgroup label="── Parashot semanales ──">
                      {PARASHOT.map(p => (
                        <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>
                      ))}
                    </optgroup>
                    <optgroup label="── Parashot dobles ──">
                      {COMBINED_PARASHOT.map(p => (
                        <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>
                      ))}
                    </optgroup>
                    {MOADIM_LIST.map(m => {
                      const items = ALL_MOADIM.filter(p => p.chag === m.id)
                      if (!items.length) return null
                      return (
                        <optgroup key={m.id} label={`── ${m.name} · ${m.heb} ──`}>
                          {items.map(p => (
                            <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Aliyá — solo si tipo es parasha y hay perashá */}
              {form.type === 'parasha' && form.parasha_id && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('aliyah_label')}</label>
                  <select value={form.aliyah_idx}
                    onChange={e => setForm(f => ({ ...f, aliyah_idx: Number(e.target.value), word_start: null, word_end: null }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                    {(selectedParasha?.aliyot || []).map((a, i) => (
                      <option key={i} value={i}>{a.n === 8 ? 'Maftir' : `${a.n}ª Aliyá`} — {a.ref}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fragmento de aliyá */}
              {form.type === 'parasha' && form.parasha_id && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('fragment_label')}</label>
                  {form.word_start != null ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                      style={{ background: 'rgba(249,184,0,0.1)', border: '1px solid rgba(249,184,0,0.3)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="#d97706" strokeWidth="1.1"/>
                        <path d="M3.5 6h5M6 3.5v5" stroke="#d97706" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      <span style={{ color: '#d97706' }}>{t('words_range').replace('{s}', form.word_start + 1).replace('{e}', form.word_end + 1)}</span>
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, word_start: null, word_end: null }))}
                        className="ml-auto text-xs px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(249,184,0,0.15)', color: '#92400e' }}>
                        {t('full_aliyah_btn')}
                      </button>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={() => setShowRangePicker(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1.5" y="1.5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.1"/>
                        <path d="M4.5 6.5h4M6.5 4.5v4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      {t('select_fragment')}
                      <span className="ml-auto text-xs opacity-40">{t('full_aliyah_hint')}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Haftará — solo si tipo es haftara */}
              {form.type === 'haftara' && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('haftara_optional')}</label>
                  <select value={form.haftara_id}
                    onChange={e => setForm(f => ({ ...f, haftara_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                    <option value="">{t('no_haftara_opt')}</option>
                    <optgroup label="── Haftarot semanales ──">
                      {ALL_HAFTAROT.filter(h => h.parasha).map(h => (
                        <option key={h.id} value={h.id}>{h.name} · {h.heb}</option>
                      ))}
                    </optgroup>
                    {Object.entries(HAFTARA_CHAG_LABELS).map(([chag, label]) => {
                      const items = ALL_HAFTAROT.filter(h => h.chag === chag)
                      if (!items.length) return null
                      return (
                        <optgroup key={chag} label={`── ${label} ──`}>
                          {items.map(h => (
                            <option key={h.id} value={h.id}>{h.name} · {h.heb}</option>
                          ))}
                        </optgroup>
                      )
                    })}
                    {ALL_HAFTAROT.filter(h => h.chag && !HAFTARA_CHAG_LABELS[h.chag]).length > 0 && (
                      <optgroup label="── Especiales ──">
                        {ALL_HAFTAROT.filter(h => h.chag && !HAFTARA_CHAG_LABELS[h.chag]).map(h => (
                          <option key={h.id} value={h.id}>{h.name} · {h.heb}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {/* Requiere audio — solo si tipo es parasha y hay perashá */}
              {form.type === 'parasha' && form.parasha_id && (
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, require_audio: !f.require_audio }))}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                  style={{
                    background: form.require_audio ? 'rgba(108,51,230,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${form.require_audio ? 'rgba(108,51,230,0.3)' : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: form.require_audio ? 'rgba(108,51,230,0.2)' : 'var(--border-subtle)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="5" y="1" width="4" height="7" rx="2"
                        stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2"/>
                      <path d="M2 7c0 2.8 2.2 5 5 5s5-2.2 5-5"
                        stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M7 12v1" stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: form.require_audio ? '#6c33e6' : 'var(--text)' }}>
                      {t('require_audio_label')}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {form.require_audio ? t('must_record') : t('no_audio_req')}
                    </div>
                  </div>
                  <div className="ml-auto w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: form.require_audio ? '#6c33e6' : 'var(--border)', background: form.require_audio ? '#6c33e6' : 'transparent' }}>
                    {form.require_audio && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                {form.type === 'tefila' ? (
                  <div>
                    <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('section')}</label>
                    <select value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                      <option value="">{t('general_option')}</option>
                      {IMPRESCINDIBLES.map(tf => (
                        <option key={tf.id} value={`${tf.name} · ${tf.heb}`}>{tf.name} · {tf.heb}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('subject_label')}</label>
                    <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Ej: Trop"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs" style={{ color: 'var(--text-3)' }}>{t('due_label')}</label>
                    <button type="button" onClick={toggleRepeat}
                      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-all"
                      style={{
                        background: repeatMode ? 'rgba(108,51,230,0.12)' : 'transparent',
                        color: repeatMode ? '#8b5cf6' : 'var(--text-3)',
                        border: `1px solid ${repeatMode ? 'rgba(108,51,230,0.3)' : 'var(--border-subtle)'}`,
                      }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5C1.5 3 3 1.5 5 1.5c1.2 0 2.2.5 3 1.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                        <path d="M8.5 5C8.5 7 7 8.5 5 8.5c-1.2 0-2.2-.5-3-1.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                        <path d="M7.2 1L8.5 2.3 7.2 3.6M2.8 9L1.5 7.7 2.8 6.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Repetir
                    </button>
                  </div>
                  {!repeatMode ? (
                    <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }} />
                  ) : (
                    <div className="px-3 py-2.5 rounded-xl text-xs text-center"
                      style={{ background: 'rgba(108,51,230,0.08)', border: '1px solid rgba(108,51,230,0.2)', color: '#8b5cf6' }}>
                      {repeatDates.length === 0 ? 'Sin fechas' : `${repeatDates.length} ${repeatDates.length === 1 ? 'fecha' : 'fechas'}`}
                    </div>
                  )}
                </div>
              </div>

              {repeatMode && (
                <RepeatDatesPanel
                  dates={repeatDates}
                  onAdd={addRepeatDate}
                  onRemove={removeRepeatDate}
                  isDark={isDark}
                />
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setComposing(false); setRepeatMode(false); setRepeatDates([]) }}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                {t('cancel')}
              </button>
              <button onClick={sendHomework}
                disabled={saving || !form.task || (repeatMode && repeatDates.length === 0)}
                className="flex-1 btn-gold py-2.5 rounded-xl text-xs font-semibold"
                style={{ opacity: (saving || !form.task || (repeatMode && repeatDates.length === 0)) ? 0.6 : 1 }}>
                {saving ? t('sending') : repeatMode && repeatDates.length > 1 ? `Enviar ${repeatDates.length} deberes` : t('send_hw')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word range picker overlay */}
      {showRangePicker && selectedParasha && (
        <WordRangePicker
          aliyahRef={selectedParasha.aliyot[form.aliyah_idx]?.ref}
          onConfirm={(s, e) => { setForm(f => ({ ...f, word_start: s, word_end: e })); setShowRangePicker(false) }}
          onClose={() => setShowRangePicker(false)}
        />
      )}

      {/* List */}
      <div className="fade-up-3 flex flex-col gap-3">
        {sent.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('no_hw_sent')}
          </div>
        )}
        {sent.map(item => {
          const s = statusStyle[item.status] || statusStyle.pending
          const statusLabel = item.status === 'submitted' ? t('status_submitted') : item.status === 'late' ? t('status_late') : t('status_pending')
          const hwType = item.type || 'parasha'
          const parasha = item.parasha_id ? PARASHOT.find(p => p.id === item.parasha_id) : null
          const aliyahLabel = parasha && item.aliyah_idx != null
            ? (parasha.aliyot[item.aliyah_idx]?.n === 8 ? 'Maftir' : `${parasha.aliyot[item.aliyah_idx]?.n}ª Aliyá`)
            : null
          const haftara = item.haftara_id ? ALL_HAFTAROT.find(h => h.id === item.haftara_id) : null
          const tefilaSectionName = hwType === 'tefila' && item.subject ? item.subject : null
          const typeColors = { parasha: '#f59e0b', haftara: '#10b981', tefila: '#8b5cf6' }
          const typeLabels = { parasha: t('nav_study'), haftara: t('nav_haftara'), tefila: t('nav_tefila') }
          const typeColor = typeColors[hwType] || '#f59e0b'

          return (
            <div key={item.id}
              className="flex items-start gap-4 p-5 rounded-2xl relative group"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={() => setHoverItem(item.id)}
              onMouseLeave={() => setHoverItem(null)}>

              {/* Delete button — appears on hover */}
              <button
                onClick={() => deleteHomework(item.id)}
                disabled={deleting === item.id}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  opacity: hoverItem === item.id ? 1 : 0,
                  pointerEvents: hoverItem === item.id ? 'auto' : 'none',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#ef4444',
                }}>
                {deleting === item.id ? (
                  <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(239,68,68,0.3)', borderTopColor: '#ef4444' }} />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 3h8M3.5 3V2h4v1M4 5v3M7 5v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    <path d="M2.5 3l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(108,51,230,0.15)', color: '#6c33e6' }}>
                {item.student?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {item.student?.name || 'Todos'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.color }}>{statusLabel}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{item.task}</p>

                {/* Type + content badge */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                    style={{ background: `${typeColor}12`, color: typeColor, border: `1px solid ${typeColor}30` }}>
                    {typeLabels[hwType]}
                  </span>
                  {parasha && aliyahLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: `${typeColor}10`, color: typeColor, border: `1px solid ${typeColor}20` }}>
                      <span className="hebrew">{parasha.heb}</span>
                      <span>·</span>
                      <span>{aliyahLabel}</span>
                    </span>
                  )}
                  {item.word_start != null && (
                    <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: 'rgba(249,184,0,0.1)', color: '#d97706', border: '1px solid rgba(249,184,0,0.25)' }}>
                      Palabras {item.word_start + 1}–{item.word_end + 1}
                    </span>
                  )}
                  {haftara && (
                    <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: `${typeColor}10`, color: typeColor, border: `1px solid ${typeColor}20` }}>
                      <span className="hebrew">{haftara.heb}</span>
                    </span>
                  )}
                  {tefilaSectionName && (
                    <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: `${typeColor}10`, color: typeColor, border: `1px solid ${typeColor}20` }}>
                      {tefilaSectionName}
                    </span>
                  )}
                  {item.require_audio && (
                    <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <rect x="3" y="0.5" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                        <path d="M1 4.5c0 1.9 1.6 3.5 3.5 3.5S8 6.4 8 4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      </svg>
                      {t('audio_required_badge')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {item.subject && (
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
                      {item.subject}
                    </span>
                  )}
                  {item.due && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t('limit_label')} {new Date(item.due).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                {item.status === 'submitted' && item.recording_url && (
                  <div className="mt-2">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{t('student_recording')}</p>
                    <audio
                      controls
                      src={item.recording_url}
                      preload="none"
                      style={{ width: '100%', height: '28px', borderRadius: '6px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
