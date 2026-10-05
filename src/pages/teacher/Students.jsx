import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, BookMarked, BookOpen, CalendarDays, Calculator, Check, ChevronRight, ClipboardList,
  Clock, Copy, Headphones, ListFilter, Plus, Search, Send, Star, UserPlus, Users, X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { PARASHOT } from '../../data/parashot'
import { ALL_MOADIM, MOADIM_LIST } from '../../data/moadim'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { useLang } from '../../context/LangContext'
import {
  Avatar, EmptyState, IconTile, Modal, PageHeader, PageSpinner, Progress, SearchInput, Spinner,
} from '../../components/ui'
import HomeworkComposer from '../../components/homework/HomeworkComposer'
import HomeworkItem, { HomeworkEditModal, RowMenu, homeworkStatus } from '../../components/homework/HomeworkItem'
import { capitalize, daysUntil, displayParashaName, formatDuration, resolveParasha, studentParashot } from '../../utils/parasha'

/* ══════════════════════════════════════════════════════════════════════════
   Bar Mitzvah calculation (Hebcal) — logic unchanged
   ══════════════════════════════════════════════════════════════════════════ */
function detectSpecialBirthday(hm, hd) {
  if (!hm || !hd) return null
  // Rosh Chodesh: 1st of any month except Tishrei (= Rosh Hashana)
  if (hd === 1 && hm !== 'Tishrei') {
    return { type: 'rosh_jodesh', label: 'Rosh Jodesh', suggestedId: 'rosh-jodesh-semana' }
  }
  // Hol HaMoed Pesach (diaspora: Nisan 17-20)
  const pesajMap = { 17: 'pesaj-jol-1', 18: 'pesaj-jol-2', 19: 'pesaj-jol-3', 20: 'pesaj-jol-4' }
  if (hm === 'Nisan' && pesajMap[hd]) {
    return { type: 'hol_hamoed', label: 'Hol HaMoed Pesaj', suggestedId: pesajMap[hd] }
  }
  // Hol HaMoed Sukkot (diaspora: Tishrei 17-20, 21=Hoshana Raba)
  const sucotMap = { 17: 'sucot-jol-1', 18: 'sucot-jol-2', 19: 'sucot-jol-3', 21: 'sucot-hoshana-raba' }
  if (hm === 'Tishrei' && sucotMap[hd]) {
    return { type: 'hol_hamoed', label: 'Hol HaMoed Sucot', suggestedId: sucotMap[hd] }
  }
  return null
}

// Hebrew year is a leap year if ((7*year)+1) % 19 < 7
function isHebrewLeapYear(hy) {
  return ((7 * hy) + 1) % 19 < 7
}

// Handle Adar month transitions between regular and leap years
function adjustAdarMonth(hm, birthHY, bmHY) {
  const bmIsLeap = isHebrewLeapYear(bmHY)
  if (hm === 'Adar' && bmIsLeap) return 'Adar II'
  if ((hm === 'Adar I' || hm === 'Adar II') && !bmIsLeap) return 'Adar'
  return hm
}

async function calcBarMitzvah(birthDateStr, dateLocale = 'es-ES') {
  const [gy, gm, gd] = birthDateStr.split('-').map(Number)

  // Step 1: Gregorian birth date → Hebrew date
  const birthHeb = await fetch(
    `/api/hebcal?endpoint=converter&cfg=json&gy=${gy}&gm=${gm}&gd=${gd}&g2h=1`
  ).then(r => r.json())
  if (birthHeb.error) throw new Error(birthHeb.error)

  // Step 2: Add 13 Hebrew years, adjusting Adar for leap year transitions
  const bmHY = birthHeb.hy + 13
  const bmHM = adjustAdarMonth(birthHeb.hm, birthHeb.hy, bmHY)
  const bmHD = birthHeb.hd

  // Step 3: Hebrew BM date → Gregorian
  const bmGreg = await fetch(
    `/api/hebcal?endpoint=converter&cfg=json&hy=${bmHY}&hm=${encodeURIComponent(bmHM)}&hd=${bmHD}&h2g=1`
  ).then(r => r.json())
  if (bmGreg.error) throw new Error(bmGreg.error)

  // Step 4: Find first Shabbat on or after the BM Gregorian date
  const bmDate = new Date(Date.UTC(bmGreg.gy, bmGreg.gm - 1, bmGreg.gd))
  const dow = bmDate.getUTCDay() // 0=Sun … 6=Sat
  const daysToShabbat = dow === 6 ? 0 : 6 - dow
  const shabbatDate = new Date(bmDate)
  shabbatDate.setUTCDate(shabbatDate.getUTCDate() + daysToShabbat)

  // Step 5: Get parasha for that Shabbat.
  // If Yom Tov falls on Shabbat the regular parasha is displaced — try up to 4 weeks.
  let parasha = null
  let finalShabbat = new Date(shabbatDate)
  for (let attempt = 0; attempt < 4; attempt++) {
    const sgy = finalShabbat.getUTCFullYear()
    const sgm = finalShabbat.getUTCMonth() + 1
    const sgd = finalShabbat.getUTCDate()
    const shabbatInfo = await fetch(
      `/api/hebcal?endpoint=shabbat&cfg=json&gy=${sgy}&gm=${sgm}&gd=${sgd}&M=on`
    ).then(r => r.json())
    parasha = shabbatInfo.items?.find(item => item.category === 'parashat')
    if (parasha) break
    finalShabbat.setUTCDate(finalShabbat.getUTCDate() + 7)
  }

  const fmt = (d) => d.toLocaleDateString(dateLocale, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  const iso = (d) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

  return {
    birthHebrewScript: birthHeb.hebrew,
    birthHebrewLatin: `${birthHeb.hd} ${birthHeb.hm} ${birthHeb.hy}`,
    birthHM: birthHeb.hm,
    birthHD: birthHeb.hd,
    bmHebrewLatin: `${bmHD} ${bmHM} ${bmHY}`,
    bmGregDisplay: fmt(new Date(Date.UTC(bmGreg.gy, bmGreg.gm - 1, bmGreg.gd))),
    bmGregISO: iso(new Date(Date.UTC(bmGreg.gy, bmGreg.gm - 1, bmGreg.gd))),
    shabbatDisplay: fmt(finalShabbat),
    shabbatISO: iso(finalShabbat),
    parashaName: parasha?.title?.replace(/^Parashat\s+/, '') || '—',
    parashaHebrew: parasha?.hebrew || '',
  }
}

function BarMitzvahCalc({ student, onAssign, onClose, t }) {
  const [birthDate, setBirthDate] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [specialDay, setSpecialDay] = useState(null)
  const [includeExtra, setIncludeExtra] = useState(false)

  const calculate = async () => {
    if (!birthDate) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSpecialDay(null)
    try {
      const res = await calcBarMitzvah(birthDate, t('date_locale'))
      setResult(res)
      const sp = detectSpecialBirthday(res.birthHM, res.birthHD)
      setSpecialDay(sp)
      setIncludeExtra(!!sp)
    } catch {
      setError(t('bm_error'))
    }
    setLoading(false)
  }

  const assign = async () => {
    if (!result) return
    setSaving(true)
    const extra = includeExtra && specialDay ? [specialDay.suggestedId] : []
    await supabase.from('profiles').update({
      bar_mitzvah: result.bmGregISO,
      parasha_id: result.parashaName,
      extra_parasha_ids: extra.length ? extra : null,
    }).eq('id', student.id)
    onAssign({ bar_mitzvah: result.bmGregISO, parasha_id: result.parashaName, extra_parasha_ids: extra.length ? extra : null })
    setSaving(false)
    onClose()
  }

  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() - 10)

  return (
    <Modal open onClose={onClose} size="sm"
      title={t('bar_mitzvah_of').replace('{name}', student.name?.split(' ')[0])}
      subtitle={t('bar_mitzvah_calc')}
      footer={<>
        <button onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
        {result && (
          <button onClick={assign} disabled={saving} className="btn btn-primary">
            {saving ? t('saving') : t('assign_confirm')}
          </button>
        )}
      </>}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="bm-birth">{t('birth_date_greg')}</label>
          <div className="flex gap-2">
            <input id="bm-birth" type="date" value={birthDate}
              onChange={e => { setBirthDate(e.target.value); setResult(null); setError(null) }}
              max={maxDate.toISOString().split('T')[0]} min="1980-01-01"
              onKeyDown={e => e.key === 'Enter' && calculate()}
              className="input flex-1" />
            <button onClick={calculate} disabled={!birthDate || loading} className="btn btn-gold">
              {loading ? <Spinner size={16} /> : t('calc_label')}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(var(--danger-rgb),0.07)', color: 'rgb(var(--danger-rgb))' }}>{error}</p>
        )}

        {loading && (
          <div className="flex flex-col items-center py-6 gap-3">
            <Spinner />
            <p className="text-xs text-ink-3">{t('heb_calendar_loading')}</p>
          </div>
        )}

        {result && (
          <>
            <dl className="rounded-xl overflow-hidden bg-surface-2" style={{ border: '1px solid var(--border-subtle)' }}>
              {[
                { label: t('birth_heb'), value: result.birthHebrewScript, sub: result.birthHebrewLatin, heb: true },
                { label: t('bm_heb'), value: result.bmHebrewLatin },
                { label: t('bm_greg'), value: result.bmGregDisplay },
                { label: t('reading_shabbat'), value: result.shabbatDisplay },
              ].map((row, i) => (
                <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3"
                  style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                  <dt className="text-[13px] text-ink-3">{row.label}</dt>
                  <dd className="text-end">
                    <span className={`block text-[13px] font-medium text-ink ${row.heb ? 'hebrew-ui text-[15px]' : ''}`}>{row.value}</span>
                    {row.sub && <span className="block text-[12px] text-ink-3">{row.sub}</span>}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="rounded-2xl p-5 text-center"
              style={{ background: 'linear-gradient(180deg, rgba(var(--gold-rgb),0.1), rgba(var(--gold-rgb),0.04))', border: '1px solid rgba(var(--gold-rgb),0.28)' }}>
              <p className="eyebrow mb-2">{t('ui_assigned_parasha')}</p>
              <p className="font-serif text-[26px] font-semibold text-ink">{result.parashaName}</p>
              {result.parashaHebrew && <p className="hebrew text-[22px] mt-1 text-gold-ink" style={{ fontWeight: 400 }}>{result.parashaHebrew}</p>}
            </div>

            {specialDay && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(var(--warning-rgb),0.07)', border: '1px solid rgba(var(--warning-rgb),0.25)' }}>
                <p className="text-[13px] font-semibold" style={{ color: 'rgb(var(--warning-rgb))' }}>
                  {t('ui_born_on').replace('{day}', specialDay.label)}
                </p>
                <p className="text-[13px] text-ink-3 mt-1 mb-3">{t('ui_special_reading_hint')}</p>
                <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-ink-2">
                  <input type="checkbox" checked={includeExtra} onChange={() => setIncludeExtra(v => !v)}
                    className="w-4 h-4 rounded accent-[rgb(var(--accent-rgb))]" />
                  {t('ui_include_also')} {resolveParasha(specialDay.suggestedId)?.name || specialDay.label}
                </label>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

/* ── Assign parashiot (multi-select) ───────────────────────────────────── */
function AssignParashaModal({ student, onAssign, onClose, t }) {
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const currentIds = studentParashot(student).map(v => resolveParasha(v)?.id || v)
  const [selectedIds, setSelectedIds] = useState(new Set(currentIds))

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const assign = async () => {
    setSaving(true)
    const ids = [...selectedIds]
    const [first, ...rest] = ids
    await supabase.from('profiles').update({
      parasha_id: first || null,
      extra_parasha_ids: rest.length ? rest : null,
    }).eq('id', student.id)
    onAssign({ parasha_id: first || null, extra_parasha_ids: rest.length ? rest : null })
    setSaving(false)
    onClose()
  }

  const s = search.toLowerCase()
  const filteredParashot = s ? PARASHOT.filter(p => p.name.toLowerCase().includes(s) || p.heb.includes(search)) : PARASHOT
  const filteredMoadim = s ? ALL_MOADIM.filter(m => m.name.toLowerCase().includes(s) || m.heb.includes(search)) : ALL_MOADIM
  const moadimByChag = MOADIM_LIST.reduce((acc, chag) => {
    const items = filteredMoadim.filter(m => m.chag === chag.id)
    if (items.length) acc.push({ chag, items })
    return acc
  }, [])

  const Row = ({ id, name, heb, num }) => {
    const sel = selectedIds.has(id)
    return (
      <button type="button" onClick={() => toggle(id)} disabled={saving} aria-pressed={sel}
        className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-start transition-colors hover:bg-surface-2"
        style={sel ? { background: 'rgba(var(--accent-rgb),0.06)' } : undefined}>
        <span className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: sel ? 'rgb(var(--accent-rgb))' : 'transparent', border: `1.5px solid ${sel ? 'rgb(var(--accent-rgb))' : 'var(--border-strong)'}`, color: 'var(--surface)' }}>
          {sel && <Check size={12} strokeWidth={3} />}
        </span>
        {num != null && <span className="text-[12px] w-5 text-end text-ink-4 tabular-nums">{num}</span>}
        <span className="text-[14px] flex-1 text-ink-2">{name}</span>
        <span className="hebrew-ui text-[15px] text-ink-3">{heb}</span>
      </button>
    )
  }

  return (
    <Modal open onClose={onClose} size="md"
      title={t('parashot_of').replace('{name}', student.name?.split(' ')[0])}
      footer={
        <div className="w-full flex flex-col gap-3">
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...selectedIds].map(id => (
                <span key={id} className="badge badge-accent">
                  {displayParashaName(id)}
                  <button type="button" onClick={() => toggle(id)} aria-label="Remove" className="opacity-60 hover:opacity-100"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2.5">
            <button onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
            <button onClick={assign} disabled={saving} className="btn btn-primary">
              {saving ? t('saving')
                : selectedIds.size > 1 ? t('ui_assign_n').replace('{n}', selectedIds.size)
                : selectedIds.size === 1 ? t('assign_parasha')
                : t('ui_remove_assignment')}
            </button>
          </div>
        </div>
      }>
      <SearchInput value={search} onChange={setSearch} placeholder={t('ui_search_parasha_special')} className="mb-3" autoFocus />
      <div className="max-h-[46vh] overflow-y-auto -mx-2 px-2">
        {filteredParashot.length > 0 && (
          <>
            <p className="eyebrow px-3 pt-2 pb-1.5">{t('torah_label')}</p>
            {filteredParashot.map(p => <Row key={p.id} id={p.id} name={p.name} heb={p.heb} num={p.num} />)}
          </>
        )}
        {moadimByChag.length > 0 && (
          <>
            <p className="eyebrow px-3 pt-4 pb-1.5">{t('special_readings')}</p>
            {moadimByChag.map(({ chag, items }) => (
              <div key={chag.id} className="mb-2">
                <p className="px-3 py-1 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: chag.color }} />{chag.name}
                </p>
                {items.map(m => <Row key={m.id} id={m.id} name={m.name} heb={m.heb} />)}
              </div>
            ))}
          </>
        )}
        {filteredParashot.length === 0 && filteredMoadim.length === 0 && (
          <p className="text-center text-sm text-ink-3 py-8">{t('no_results')}</p>
        )}
      </div>
    </Modal>
  )
}

/* ── Add student (students link themselves with the teacher code) ──────── */
function AddStudentModal({ code, onClose, t }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code) } catch { /* unavailable */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  return (
    <Modal open onClose={onClose} size="sm" title={t('ui_add_student')} subtitle={t('ui_add_student_desc')}
      footer={<button onClick={onClose} className="btn btn-secondary">{t('close')}</button>}>
      <ol className="flex flex-col gap-3 mb-5 text-[14px] text-ink-2">
        {[t('ui_add_step1'), t('ui_add_step2'), t('ui_add_step3')].map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 bg-surface-2 text-ink-2">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
      <div className="flex items-stretch gap-2.5">
        <div className="flex-1 flex items-center justify-center h-14 rounded-xl bg-surface-2 font-mono text-[24px] font-semibold text-ink tracking-[0.32em] ps-[0.32em] select-all"
          style={{ border: '1px solid var(--border)' }} dir="ltr">{code || '—'}</div>
        <button onClick={copy} className="btn btn-gold h-14 w-14 p-0 rounded-xl" aria-label={t('ui_copy_code')}>
          {copied ? <Check size={20} /> : <Copy size={19} />}
        </button>
      </div>
    </Modal>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════════════ */
export default function TeacherStudents() {
  const { profile } = useAuth()
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const selected = params.get('s')
  const [students, setStudents] = useState([])
  const [homework, setHomework] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('profiles').select('*').eq('teacher_id', profile.id).eq('role', 'student'),
      supabase.from('homework').select('*, student:student_id(name)').eq('teacher_id', profile.id).order('created_at', { ascending: false }),
    ]).then(([st, hw]) => {
      setStudents(st.data || [])
      setHomework(hw.data || [])
      setLoading(false)
    })
  }, [profile])

  const select = (id) => {
    const next = new URLSearchParams(params)
    if (id) next.set('s', id); else next.delete('s')
    setParams(next)
    document.getElementById('main')?.scrollTo({ top: 0 })
  }

  const student = students.find(s => s.id === selected)
  const updateStudent = (id, updates) => setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))

  if (loading) return <div className="page"><PageSpinner /></div>

  if (student) {
    return (
      <StudentDetail
        student={student} teacher={profile} t={t}
        homework={homework.filter(h => h.student_id === student.id)}
        setHomework={setHomework}
        onBack={() => select(null)}
        onUpdate={(u) => updateStudent(student.id, u)}
      />
    )
  }

  return <StudentList students={students} homework={homework} teacher={profile} t={t} onSelect={select} onUpdate={updateStudent} setHomework={setHomework} />
}

/* ── List ──────────────────────────────────────────────────────────────── */
function StudentList({ students, homework, teacher, t, onSelect, onUpdate, setHomework }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortAsc, setSortAsc] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [modal, setModal] = useState(null) // { kind, student }

  const hwByStudent = useMemo(() => {
    const m = {}
    homework.forEach(h => {
      const s = homeworkStatus(h)
      const e = (m[h.student_id] ||= { pending: 0, overdue: 0, total: 0 })
      e.total++
      if (s === 'pending') e.pending++
      if (s === 'overdue' || s === 'late') e.overdue++
    })
    return m
  }, [homework])

  const visible = students
    .filter(s => {
      if (query && !s.name?.toLowerCase().includes(query.toLowerCase())) return false
      if (filter === 'with' && !s.parasha_id) return false
      if (filter === 'without' && s.parasha_id) return false
      if (filter === 'pending' && !((hwByStudent[s.id]?.pending || 0) + (hwByStudent[s.id]?.overdue || 0))) return false
      return true
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '') * (sortAsc ? 1 : -1))

  const withParasha = students.filter(s => s.parasha_id).length

  const menuFor = (s) => [
    { icon: Users, label: t('ui_view_profile'), onClick: () => onSelect(s.id) },
    { icon: BookOpen, label: t('assign_parasha'), onClick: () => setModal({ kind: 'assign', student: s }) },
    { icon: Send, label: t('send_hw'), onClick: () => setModal({ kind: 'hw', student: s }) },
    { icon: Calculator, label: t('bar_mitzvah_calc'), onClick: () => setModal({ kind: 'bm', student: s }) },
  ]

  return (
    <div className="page">
      <PageHeader
        hebrew="תַּלְמִידִים"
        eyebrow={t('nav_students')}
        title={t('students_title')}
        subtitle={`${students.length} · ${withParasha} ${t('with_parasha_assigned')}`}
        actions={
          <button onClick={() => setAddOpen(true)} className="btn btn-primary btn-lg">
            <UserPlus size={18} strokeWidth={1.9} />{t('ui_add_student')}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5 fade-up-1">
        <SearchInput value={query} onChange={setQuery} placeholder={t('ui_search_student')} className="sm:max-w-md flex-1" />
        <label className="relative sm:ms-auto">
          <span className="sr-only">{t('ui_filter')}</span>
          <ListFilter size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input ps-10 min-w-[220px]">
            <option value="all">{t('ui_all_students')}</option>
            <option value="with">{t('ui_with_parasha')}</option>
            <option value="without">{t('ui_without_parasha')}</option>
            <option value="pending">{t('ui_with_pending_hw')}</option>
          </select>
        </label>
      </div>

      <section className="card fade-up-2">
        {students.length === 0 ? (
          <EmptyState icon={Users} title={t('no_students')} description={t('share_code')}
            action={<button onClick={() => setAddOpen(true)} className="btn btn-secondary"><UserPlus size={16} />{t('ui_add_student')}</button>} />
        ) : visible.length === 0 ? (
          <EmptyState icon={Search} title={t('no_results')} />
        ) : (
          <div role="table" aria-label={t('students_title')}>
            <div role="row" className="hidden md:grid table-head px-6 py-3.5 gap-4"
              style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,0.9fr) 40px', borderBottom: '1px solid var(--border-subtle)' }}>
              <button role="columnheader" onClick={() => setSortAsc(v => !v)} className="text-start inline-flex items-center gap-1 hover:text-ink" aria-sort={sortAsc ? 'ascending' : 'descending'}>
                {t('ui_student')}<span aria-hidden="true" className="text-ink-4">{sortAsc ? '↑' : '↓'}</span>
              </button>
              <span role="columnheader">{t('ui_parasha')}</span>
              <span role="columnheader">{t('progress')}</span>
              <span role="columnheader">{t('nav_homework')}</span>
              <span role="columnheader" className="sr-only">{t('ui_actions')}</span>
            </div>
            <ul>
              {visible.map((s, i) => {
                const hw = hwByStudent[s.id] || { pending: 0, overdue: 0 }
                const parashot = studentParashot(s)
                return (
                  <li key={s.id} role="row" style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                    <div className="row-hover grid items-center gap-4 px-4 sm:px-6 py-4 cursor-pointer grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_40px]"
                      onClick={() => onSelect(s.id)} onKeyDown={e => e.key === 'Enter' && onSelect(s.id)} tabIndex={0}>
                      <div role="cell" className="flex items-center gap-3.5 min-w-0">
                        <Avatar name={s.name} size={42} single />
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium text-ink truncate">{s.name}</p>
                          <p className="md:hidden text-[13px] text-ink-3 truncate">
                            {parashot.length ? parashot.map(displayParashaName).join(' + ') : t('no_parasha')}
                          </p>
                          {s.bar_mitzvah && (
                            <p className="hidden md:block text-[12px] text-ink-3">
                              {t('bar_mitzvah')} · {new Date(s.bar_mitzvah).toLocaleDateString(t('date_locale') || undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div role="cell" className="hidden md:block min-w-0 text-[14px] truncate">
                        {parashot.length
                          ? <span className="text-ink">{parashot.map(displayParashaName).join(' + ')}</span>
                          : <span className="text-ink-3">{t('no_parasha')}</span>}
                      </div>
                      <div role="cell" className="hidden md:flex items-center gap-3 min-w-0">
                        <Progress value={s.progress || 0} className="flex-1 max-w-[220px]" label={t('progress')} />
                        <span className="text-[13px] text-ink-3 tabular-nums w-9">{s.progress || 0}%</span>
                      </div>
                      <div role="cell" className="flex items-center gap-2 justify-end md:justify-start">
                        <HomeworkPill hw={hw} t={t} />
                      </div>
                      <div role="cell" className="hidden md:flex justify-end">
                        <RowMenu items={menuFor(s)} label={t('ui_actions')} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      {addOpen && <AddStudentModal code={teacher?.teacher_code} onClose={() => setAddOpen(false)} t={t} />}
      {modal?.kind === 'assign' && <AssignParashaModal student={modal.student} t={t} onClose={() => setModal(null)} onAssign={u => onUpdate(modal.student.id, u)} />}
      {modal?.kind === 'bm' && <BarMitzvahCalc student={modal.student} t={t} onClose={() => setModal(null)} onAssign={u => onUpdate(modal.student.id, u)} />}
      {modal?.kind === 'hw' && (
        <HomeworkComposer teacherId={teacher.id} fixedStudent={modal.student} students={students}
          onClose={() => setModal(null)} onCreated={rows => setHomework(prev => [...rows, ...prev])} />
      )}
    </div>
  )
}

function HomeworkPill({ hw, t }) {
  if (hw.overdue > 0) return <span className="badge badge-dot badge-danger">{hw.overdue} {t('ui_overdue').toLowerCase()}</span>
  if (hw.pending > 0) return <span className="badge badge-dot badge-warning">{hw.pending} {t('status_pending').toLowerCase()}</span>
  return <span className="badge badge-dot badge-success">{t('ui_up_to_date')}</span>
}

/* ── Detail ────────────────────────────────────────────────────────────── */
function StudentDetail({ student, teacher, homework, setHomework, onBack, onUpdate, t }) {
  const navigate = useNavigate()
  const locale = t('date_locale') || undefined
  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [hwFilter, setHwFilter] = useState('all')
  const [trackData, setTrackData] = useState(null)
  const [classes, setClasses] = useState(null)

  useEffect(() => {
    setTrackData(null)
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('study_sessions').select('date, seconds').eq('student_id', student.id),
      supabase.from('audio_listens').select('parasha_id, aliyah_idx, count, last_listened_at')
        .eq('student_id', student.id).order('last_listened_at', { ascending: false }),
      supabase.from('aliyah_time').select('parasha_id, aliyah_idx, seconds')
        .eq('student_id', student.id).order('seconds', { ascending: false }),
    ]).then(([sessions, listens, aliyahTimes]) => {
      const allSeconds = (sessions.data || []).reduce((s, r) => s + r.seconds, 0)
      const todaySeconds = (sessions.data || []).find(r => r.date === today)?.seconds || 0
      setTrackData({ totalSeconds: allSeconds, todaySeconds, listens: listens.data || [], aliyahTimes: aliyahTimes.data || [] })
    })
    supabase.from('classes').select('*').eq('teacher_id', teacher.id).eq('student_id', student.id)
      .order('scheduled_at', { ascending: true })
      .then(({ data }) => setClasses(data || []))
  }, [student.id, teacher.id])

  const parashot = studentParashot(student)
  const mainParasha = resolveParasha(student.parasha_id)
  const haftara = mainParasha ? ALL_HAFTAROT.find(h => h.parasha === mainParasha.id) : null
  const days = daysUntil(student.bar_mitzvah)
  const upcoming = (classes || []).filter(c => new Date(c.scheduled_at) >= new Date())
  const past = (classes || []).filter(c => new Date(c.scheduled_at) < new Date()).reverse()

  const hwCounts = { all: homework.length, pending: 0, overdue: 0, submitted: 0 }
  homework.forEach(h => {
    const s = homeworkStatus(h)
    if (s === 'submitted') hwCounts.submitted++
    else if (s === 'overdue' || s === 'late') hwCounts.overdue++
    else hwCounts.pending++
  })
  const visibleHw = homework.filter(h => {
    const s = homeworkStatus(h)
    if (hwFilter === 'pending') return s === 'pending'
    if (hwFilter === 'overdue') return s === 'overdue' || s === 'late'
    if (hwFilter === 'submitted') return s === 'submitted'
    return true
  })

  const activityRows = useMemo(() => {
    if (!trackData) return []
    const keys = new Set([
      ...trackData.listens.map(l => `${l.parasha_id}|${l.aliyah_idx}`),
      ...trackData.aliyahTimes.map(x => `${x.parasha_id}|${x.aliyah_idx}`),
    ])
    return [...keys].map(k => {
      const [pid, aidx] = k.split('|')
      const listen = trackData.listens.find(l => l.parasha_id === pid && String(l.aliyah_idx) === aidx)
      const time = trackData.aliyahTimes.find(x => x.parasha_id === pid && String(x.aliyah_idx) === aidx)
      const p = PARASHOT.find(p => p.id === pid)
      return {
        key: k,
        parashaLabel: p?.name || pid,
        aliyahLabel: p?.aliyot[Number(aidx)]?.label || `Aliyá ${Number(aidx) + 1}`,
        count: listen?.count || 0,
        seconds: time?.seconds || 0,
      }
    }).sort((a, b) => b.seconds - a.seconds)
  }, [trackData])

  const fmtClass = (c) => {
    const d = new Date(c.scheduled_at)
    return {
      day: d.toLocaleDateString(locale, { day: '2-digit' }),
      month: d.toLocaleDateString(locale, { month: 'short' }).replace('.', ''),
      time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
      weekday: capitalize(d.toLocaleDateString(locale, { weekday: 'long' })),
    }
  }

  const tabs = [
    { key: 'overview', label: t('ui_overview') },
    { key: 'homework', label: t('nav_homework'), count: hwCounts.pending + hwCounts.overdue },
    { key: 'classes', label: t('nav_schedule'), count: upcoming.length },
    { key: 'activity', label: t('ui_activity') },
  ]

  return (
    <div className="page">
      <button onClick={onBack} className="btn btn-ghost btn-sm -ms-3 mb-5 text-ink-3">
        <ArrowLeft size={16} className="rtl:rotate-180" />{t('students_title')}
      </button>

      {/* Header */}
      <section className="card p-5 sm:p-7 mb-6 fade-up-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
            <Avatar name={student.name} size={68} />
            <div className="min-w-0">
              <p className="eyebrow mb-1.5">{t('role_student_label')}</p>
              <h1 className="font-serif text-[30px] sm:text-[34px] font-semibold text-ink tracking-[-0.02em] leading-tight truncate">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {parashot.length ? parashot.map(id => (
                  <span key={id} className="badge badge-accent"><BookOpen size={12} />{displayParashaName(id)}</span>
                )) : <span className="badge badge-warning badge-dot">{t('no_parasha')}</span>}
                {student.bar_mitzvah && (
                  <span className="badge badge-gold"><Star size={12} />{t('bar_mitzvah')} · {new Date(student.bar_mitzvah).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => setModal('hw')} className="btn btn-primary"><Send size={16} />{t('send_hw')}</button>
            <button onClick={() => setModal('assign')} className="btn btn-secondary"><BookOpen size={16} />{t('assign_parasha')}</button>
            <button onClick={() => setModal('bm')} className="btn btn-secondary"><Calculator size={16} />{t('bar_mitzvah_calc')}</button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs mb-6" role="tablist">
        {tabs.map(tb => (
          <button key={tb.key} role="tab" aria-selected={tab === tb.key} onClick={() => setTab(tb.key)}>
            {tb.label}
            {tb.count > 0 && <span className="ms-2 badge h-5 px-1.5 text-[11px]">{tb.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 fade-up-1">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Headphones, label: t('listens'), value: student.listens || 0 },
                { icon: BookOpen, label: t('progress'), value: `${student.progress || 0}%` },
                { icon: Star, label: t('streak'), value: `${student.streak || 0}d` },
                { icon: Clock, label: t('app_time'), value: trackData ? formatDuration(trackData.totalSeconds) : '—' },
              ].map(s => (
                <div key={s.label} className="card-flat p-4">
                  <s.icon size={17} strokeWidth={1.7} className="text-ink-3" />
                  <p className="text-[24px] font-semibold text-ink mt-3 leading-none tabular-nums">{s.value}</p>
                  <p className="text-[12px] text-ink-3 mt-1.5">{s.label}</p>
                </div>
              ))}
            </div>

            <section className="card p-5 sm:p-6">
              <h2 className="section-title mb-4">{t('ui_study_plan')}</h2>
              <dl>
                {[
                  { label: t('my_parasha'), value: parashot.map(displayParashaName).join(' + ') || '—',
                    action: mainParasha && { label: t('ui_open'), onClick: () => navigate(`/teacher/study/${mainParasha.id}`) } },
                  { label: t('nav_haftara'), value: haftara ? `${haftara.name}${haftara.aliyot?.[0]?.ref ? ' · ' + haftara.aliyot[0].ref : ''}` : '—',
                    action: haftara && { label: t('ui_open'), onClick: () => navigate(`/teacher/haftara/${haftara.id}`) } },
                  { label: t('bar_mitzvah'), value: student.bar_mitzvah ? new Date(student.bar_mitzvah).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—',
                    sub: days != null && days >= 0 ? t('ui_in_days').replace('{n}', days) : null },
                  { label: t('next_class'), value: upcoming[0] ? `${fmtClass(upcoming[0]).weekday} ${fmtClass(upcoming[0]).day} ${fmtClass(upcoming[0]).month} · ${fmtClass(upcoming[0]).time}` : '—' },
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3.5" style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                    <dt className="text-[14px] text-ink-3">{row.label}</dt>
                    <dd className="flex items-center gap-3 text-end min-w-0">
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium text-ink truncate">{row.value}</span>
                        {row.sub && <span className="block text-[12px] text-gold-ink">{row.sub}</span>}
                      </span>
                      {row.action && (
                        <button onClick={row.action.onClick} className="btn btn-ghost btn-sm text-accent">
                          {row.action.label}<ChevronRight size={14} className="rtl:rotate-180" />
                        </button>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="card p-5 sm:p-6 self-start">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">{t('nav_homework')}</h2>
              <button onClick={() => setTab('homework')} className="btn btn-ghost btn-sm text-ink-3">{t('ui_view_all')}</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: t('ui_pending_plural'), value: hwCounts.pending, color: 'var(--text)' },
                { label: t('ui_overdue_plural'), value: hwCounts.overdue, color: 'rgb(var(--danger-rgb))' },
                { label: t('ui_submitted_plural'), value: hwCounts.submitted, color: 'rgb(var(--success-rgb))' },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-surface-2 p-3 text-center">
                  <p className="text-[20px] font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {homework.filter(h => homeworkStatus(h) !== 'submitted').slice(0, 3).map(h => (
              <button key={h.id} onClick={() => setTab('homework')} className="w-full flex items-center gap-3 py-2.5 text-start group"
                style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <ClipboardList size={16} className="text-ink-4 flex-shrink-0" />
                <span className="flex-1 min-w-0 text-[14px] text-ink-2 truncate group-hover:text-ink">{h.task}</span>
                {homeworkStatus(h) !== 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-danger" />}
              </button>
            ))}
            <button onClick={() => setModal('hw')} className="btn btn-secondary w-full mt-3"><Plus size={16} />{t('new_hw')}</button>
          </section>
        </div>
      )}

      {tab === 'homework' && (
        <div className="fade-up-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="segmented" role="tablist">
              {[['all', t('ui_all')], ['pending', t('ui_pending_plural')], ['overdue', t('ui_overdue_plural')], ['submitted', t('ui_submitted_plural')]].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={hwFilter === k} onClick={() => setHwFilter(k)}>
                  {l}<span className="ms-1.5 text-ink-4 tabular-nums">{hwCounts[k]}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setModal('hw')} className="btn btn-primary sm:ms-auto"><Plus size={16} />{t('new_hw')}</button>
          </div>
          <section className="card">
            {visibleHw.length === 0 ? (
              <EmptyState icon={ClipboardList} title={t('no_hw_sent')} />
            ) : (
              <ul>
                {visibleHw.map((h, i) => (
                  <li key={h.id} style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                    <HomeworkItem item={h} showStudent={false} teacherId={teacher.id}
                      onChange={next => setHomework(prev => prev.map(x => x.id === next.id ? next : x))}
                      onDelete={id => setHomework(prev => prev.filter(x => x.id !== id))}
                      onEdit={setEditing} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-up-1">
          {[{ title: t('ui_upcoming_classes'), list: upcoming }, { title: t('ui_past_classes'), list: past }].map(group => (
            <section key={group.title} className="card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="section-title">{group.title}</h2>
                {group.list === upcoming && (
                  <button onClick={() => navigate(`/teacher/schedule?new=1&student=${student.id}`)} className="btn btn-secondary btn-sm"><Plus size={14} />{t('new_class')}</button>
                )}
              </div>
              {classes === null ? <div className="py-8 flex justify-center"><Spinner /></div>
                : group.list.length === 0 ? <EmptyState icon={CalendarDays} title={t('no_classes')} className="py-8" />
                : group.list.map(c => {
                  const f = fmtClass(c)
                  return (
                    <div key={c.id} className="flex items-center gap-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <div className="w-12 h-12 rounded-xl bg-surface-2 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[16px] font-semibold text-ink leading-none">{f.day}</span>
                        <span className="text-[10px] uppercase text-ink-3 mt-0.5">{f.month}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-ink">{c.type} · {f.time}</p>
                        <p className="text-[13px] text-ink-3 truncate">{f.weekday} · {c.duration_min} min{c.notes ? ` · ${c.notes}` : ''}</p>
                      </div>
                    </div>
                  )
                })}
            </section>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="flex flex-col gap-6 fade-up-1">
          <div className="grid grid-cols-2 gap-3 max-w-xl">
            <div className="card-flat p-5">
              <IconTile icon={Clock} tone="accent" size={38} />
              <p className="text-[26px] font-semibold text-ink mt-3 tabular-nums">{trackData ? formatDuration(trackData.totalSeconds) : '—'}</p>
              <p className="text-[13px] text-ink-3">{t('total_acc')}</p>
            </div>
            <div className="card-flat p-5">
              <IconTile icon={CalendarDays} tone="gold" size={38} />
              <p className="text-[26px] font-semibold text-ink mt-3 tabular-nums">{trackData ? formatDuration(trackData.todaySeconds) : '—'}</p>
              <p className="text-[13px] text-ink-3">{t('today_label')}</p>
            </div>
          </div>
          <section className="card overflow-hidden">
            {!trackData ? <PageSpinner /> : activityRows.length === 0 ? (
              <EmptyState icon={Headphones} title={t('no_activity')} />
            ) : (
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="table-head text-start" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="text-start font-medium px-5 sm:px-6 py-3">{t('section')}</th>
                    <th className="text-center font-medium px-3 py-3">{t('listens')}</th>
                    <th className="text-end font-medium px-5 sm:px-6 py-3">{t('time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activityRows.map(row => (
                    <tr key={row.key} className="row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td className="px-5 sm:px-6 py-3 text-ink-2">{row.parashaLabel} · {row.aliyahLabel}</td>
                      <td className="px-3 py-3 text-center font-medium text-ink tabular-nums">{row.count > 0 ? `${row.count}×` : '—'}</td>
                      <td className="px-5 sm:px-6 py-3 text-end font-medium text-ink tabular-nums">{row.seconds > 0 ? formatDuration(row.seconds) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {modal === 'bm' && <BarMitzvahCalc student={student} onAssign={onUpdate} onClose={() => setModal(null)} t={t} />}
      {modal === 'assign' && <AssignParashaModal student={student} onAssign={onUpdate} onClose={() => setModal(null)} t={t} />}
      {modal === 'hw' && (
        <HomeworkComposer teacherId={teacher.id} fixedStudent={student} onClose={() => setModal(null)}
          onCreated={rows => setHomework(prev => [...rows, ...prev])} />
      )}
      {editing && (
        <HomeworkEditModal item={editing} teacherId={teacher.id} onClose={() => setEditing(null)}
          onSaved={next => setHomework(prev => prev.map(x => x.id === next.id ? next : x))} />
      )}
    </div>
  )
}
