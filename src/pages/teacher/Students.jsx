import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { PARASHOT } from '../../data/parashot'
import { useLang } from '../../context/LangContext'

const COLORS = ['#6c33e6', '#f9b800', '#2dd4bf', '#f87171', '#a78bfa']

function formatTime(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function findParasha(parashaId) {
  if (!parashaId) return null
  const lower = parashaId.toLowerCase().replace(/[\s-]/g, '')
  return PARASHOT.find(p =>
    p.id.replace(/-/g, '') === lower ||
    p.name.toLowerCase().replace(/[\s-]/g, '') === lower ||
    parashaId.toLowerCase() === p.id
  ) || null
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

async function calcBarMitzvah(birthDateStr) {
  const [gy, gm, gd] = birthDateStr.split('-').map(Number)

  // Step 1: Gregorian birth date → Hebrew date
  const birthHeb = await fetch(
    `https://www.hebcal.com/converter?cfg=json&gy=${gy}&gm=${gm}&gd=${gd}&g2h=1`
  ).then(r => r.json())
  if (birthHeb.error) throw new Error(birthHeb.error)

  // Step 2: Add 13 Hebrew years, adjusting Adar for leap year transitions
  const bmHY = birthHeb.hy + 13
  const bmHM = adjustAdarMonth(birthHeb.hm, birthHeb.hy, bmHY)
  const bmHD = birthHeb.hd

  // Step 3: Hebrew BM date → Gregorian
  const bmGreg = await fetch(
    `https://www.hebcal.com/converter?cfg=json&hy=${bmHY}&hm=${encodeURIComponent(bmHM)}&hd=${bmHD}&h2g=1`
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
      `https://www.hebcal.com/shabbat?cfg=json&gy=${sgy}&gm=${sgm}&gd=${sgd}&M=on`
    ).then(r => r.json())
    parasha = shabbatInfo.items?.find(item => item.category === 'parashat')
    if (parasha) break
    finalShabbat.setUTCDate(finalShabbat.getUTCDate() + 7)
  }

  const fmt = (d) => d.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  const iso = (d) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

  return {
    birthHebrewScript: birthHeb.hebrew,
    birthHebrewLatin: `${birthHeb.hd} ${birthHeb.hm} ${birthHeb.hy}`,
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

  const calculate = async () => {
    if (!birthDate) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await calcBarMitzvah(birthDate)
      setResult(res)
    } catch {
      setError(t('bm_error'))
    }
    setLoading(false)
  }

  const assign = async () => {
    if (!result) return
    setSaving(true)
    await supabase.from('profiles').update({
      bar_mitzvah: result.bmGregISO,
      parasha_id: result.parashaName,
    }).eq('id', student.id)
    onAssign({ bar_mitzvah: result.bmGregISO, parasha_id: result.parashaName })
    setSaving(false)
    onClose()
  }

  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() - 10)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-gold)' }}>חֶשְׁבּוֹן · Calculadora</p>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Bar Mitzvá de {student.name?.split(' ')[0]}</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>✕</button>
        </div>

        {/* Date input */}
        <div className="mb-4">
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>
            {t('birth_date_greg')}
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={birthDate}
              onChange={e => { setBirthDate(e.target.value); setResult(null); setError(null) }}
              max={maxDate.toISOString().split('T')[0]}
              min="1980-01-01"
              onKeyDown={e => e.key === 'Enter' && calculate()}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button onClick={calculate} disabled={!birthDate || loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap"
              style={{
                background: birthDate && !loading ? 'rgba(249,184,0,0.18)' : 'var(--bg-card)',
                color: birthDate && !loading ? '#d97706' : 'var(--text-muted)',
                border: `1px solid ${birthDate && !loading ? 'rgba(249,184,0,0.35)' : 'var(--border)'}`,
              }}>
              {loading ? '…' : t('calc_label')}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl mb-4 text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(249,184,0,0.25)', borderTopColor: '#f9b800' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('heb_calendar_loading')}</p>
          </div>
        )}

        {result && (
          <div className="mb-5 flex flex-col gap-3">
            {/* Data rows */}
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {[
                { label: t('birth_heb'), value: result.birthHebrewScript, sub: result.birthHebrewLatin },
                { label: t('bm_heb'), value: result.bmHebrewLatin },
                { label: t('bm_greg'), value: result.bmGregDisplay },
                { label: t('reading_shabbat'), value: result.shabbatDisplay },
              ].map((row, i, arr) => (
                <div key={row.label}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <div className="text-right ml-4">
                    <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{row.value}</div>
                    {row.sub && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.sub}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Parasha highlight */}
            <div className="rounded-xl p-4 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(249,184,0,0.14) 0%, rgba(249,184,0,0.04) 100%)',
                border: '1px solid rgba(249,184,0,0.35)',
              }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-gold)' }}>פָּרָשַׁת הַשָּׁבוּעַ · Perashá asignada</p>
              <div className="text-2xl font-medium" style={{ color: '#d97706' }}>{result.parashaName}</div>
              {result.parashaHebrew && (
                <div className="text-lg hebrew mt-1" style={{ color: 'rgba(249,184,0,0.75)' }}>
                  {result.parashaHebrew}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {t('cancel')}
          </button>
          {result && (
            <button onClick={assign} disabled={saving}
              className="flex-1 btn-gold py-2.5 rounded-xl text-xs font-semibold"
              style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? t('saving') : t('assign_confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AssignParashaModal({ student, onAssign, onClose, t }) {
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const assign = async (parasha) => {
    setSaving(true)
    await supabase.from('profiles').update({ parasha_id: parasha.name }).eq('id', student.id)
    onAssign({ parasha_id: parasha.name })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', maxHeight: '80vh' }}>
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-gold)' }}>פָּרָשָׁה · Asignar</p>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Perashá de {student.name?.split(' ')[0]}</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>✕</button>
        </div>
        <div className="px-5 pb-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_parasha_placeholder')}
            autoFocus
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div className="overflow-y-auto flex-1 px-3 pb-4">
          {PARASHOT.filter(p =>
            !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.heb.includes(search)
          ).map(p => (
            <button key={p.id} onClick={() => assign(p)} disabled={saving}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 text-left transition-all"
              style={{ background: student.parasha_id === p.name ? 'rgba(249,184,0,0.12)' : 'transparent', border: student.parasha_id === p.name ? '1px solid rgba(249,184,0,0.3)' : '1px solid transparent' }}
              onMouseEnter={e => { if (student.parasha_id !== p.name) e.currentTarget.style.background = 'var(--bg-card)' }}
              onMouseLeave={e => { if (student.parasha_id !== p.name) e.currentTarget.style.background = 'transparent' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs w-5 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{p.num}</span>
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>{p.name}</span>
              </div>
              <span className="hebrew text-sm" style={{ color: student.parasha_id === p.name ? '#d97706' : 'var(--text-3)' }}>{p.heb}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TeacherStudents() {
  const { profile } = useAuth()
  const { t } = useLang()
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState(null)
  const [calcOpen, setCalcOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('profiles')
      .select('*')
      .eq('teacher_id', profile.id)
      .eq('role', 'student')
      .then(({ data }) => setStudents(data || []))
  }, [profile])

  const student = students.find(s => s.id === selected)

  // Per-student tracking data
  const [trackData, setTrackData] = useState(null)

  useEffect(() => {
    if (!selected) { setTrackData(null); return }
    setTrackData(null)
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('study_sessions').select('date, seconds').eq('student_id', selected),
      supabase.from('audio_listens').select('parasha_id, aliyah_idx, count, last_listened_at')
        .eq('student_id', selected).order('last_listened_at', { ascending: false }),
      supabase.from('aliyah_time').select('parasha_id, aliyah_idx, seconds')
        .eq('student_id', selected).order('seconds', { ascending: false }),
    ]).then(([sessions, listens, aliyahTimes]) => {
      const allSeconds = (sessions.data || []).reduce((s, r) => s + r.seconds, 0)
      const todaySeconds = (sessions.data || []).find(r => r.date === today)?.seconds || 0
      setTrackData({
        totalSeconds: allSeconds,
        todaySeconds,
        listens: listens.data || [],
        aliyahTimes: aliyahTimes.data || [],
      })
    })
  }, [selected])

  const handleAssign = (updates) => {
    setStudents(prev => prev.map(s => s.id === selected ? { ...s, ...updates } : s))
  }

  return (
    <div className="p-8">
      <div className="mb-10 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          תַּלְמִידִים · Alumnos
        </p>
        <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
          {t('students_title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          {students.length} · {students.filter(s => s.parasha_id).length} {t('with_parasha_assigned')}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Student list */}
        <div className={`${selected ? 'xl:col-span-2' : 'xl:col-span-5'} fade-up-2`}>
          <div className="grid grid-cols-1 gap-3"
            style={selected ? {} : { gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {students.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('no_students')}</p>
            )}
            {students.map((s, i) => {
              const color = COLORS[i % COLORS.length]
              const isSelected = selected === s.id
              return (
                <button key={s.id} onClick={() => setSelected(isSelected ? null : s.id)}
                  className="text-left p-5 rounded-2xl transition-all duration-300"
                  style={{
                    background: isSelected ? `${color}12` : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? color + '35' : 'var(--border)'}`,
                  }}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{ background: `${color}20`, color, border: `2px solid ${color}40` }}>
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{s.name}</span>
                        <span className="text-xs" style={{ color }}>{s.streak || 0}🔥</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {s.parasha_id || t('no_parasha')}
                        </span>
                        {!s.parasha_id && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(249,184,0,0.1)', color: '#d97706', border: '1px solid rgba(249,184,0,0.2)' }}>
                            {t('pending_label')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${s.progress || 0}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }} />
                        </div>
                        <span className="text-xs" style={{ color }}>{s.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Student detail */}
        {student && (
          <div className="xl:col-span-3 fade-up-3">
            {(() => {
              const i = students.findIndex(s => s.id === student.id)
              const color = COLORS[i % COLORS.length]
              return (
                <div className="rounded-2xl p-6 sticky top-6"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{ background: `${color}20`, color, border: `2px solid ${color}40` }}>
                        {student.name?.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-lg font-medium" style={{ color: 'var(--text)' }}>{student.name}</h2>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {student.parasha_id || t('no_parasha')}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--border)', color: 'var(--text-3)' }}>✕</button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: t('listens'), value: student.listens || 0, color },
                      { label: t('progress'), value: `${student.progress || 0}%`, color },
                      { label: t('streak'), value: `${student.streak || 0}d`, color: '#f9b800' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-xl p-3 text-center"
                        style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}>
                        <div className="text-xl font-light" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Info rows */}
                  <div className="mb-6">
                    {[
                      { label: t('bar_mitzvah'), value: student.bar_mitzvah ? new Date(student.bar_mitzvah).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                      { label: t('my_parasha'), value: student.parasha_id || '—' },
                      { label: t('next_class'), value: student.next_class || '—' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking stats */}
                  {trackData && (
                    <div className="mb-5 flex flex-col gap-3">
                      {/* Time */}
                      <div className="rounded-xl p-4"
                        style={{ background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.18)' }}>
                        <p className="text-xs mb-2" style={{ color: '#0d9488' }}>{t('app_time')}</p>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-2xl font-light" style={{ color: '#0d9488' }}>
                              {formatTime(trackData.totalSeconds)}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('total_acc')}</div>
                          </div>
                          <div className="w-px h-8 self-center" style={{ background: 'rgba(45,212,191,0.2)' }} />
                          <div>
                            <div className="text-lg font-light" style={{ color: '#2dd4bf' }}>
                              {formatTime(trackData.todaySeconds)}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('today_label')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Escuchas + tiempo por aliyá */}
                      {(() => {
                        // Combinar listen counts y aliyah_time por clave parasha+aliyah
                        const keys = new Set([
                          ...trackData.listens.map(l => `${l.parasha_id}|${l.aliyah_idx}`),
                          ...trackData.aliyahTimes.map(t => `${t.parasha_id}|${t.aliyah_idx}`),
                        ])
                        const rows = [...keys].map(k => {
                          const [pid, aidx] = k.split('|')
                          const listen = trackData.listens.find(l => l.parasha_id === pid && String(l.aliyah_idx) === aidx)
                          const time = trackData.aliyahTimes.find(t => t.parasha_id === pid && String(t.aliyah_idx) === aidx)
                          const p = PARASHOT.find(p => p.id === pid)
                          return {
                            key: k,
                            parashaLabel: p?.name || pid,
                            aliyahLabel: p?.aliyot[Number(aidx)]?.label || `Aliyá ${Number(aidx) + 1}`,
                            count: listen?.count || 0,
                            seconds: time?.seconds || 0,
                          }
                        }).sort((a, b) => b.seconds - a.seconds)

                        if (!rows.length) return (
                          <div className="rounded-xl p-4 text-center"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('no_activity')}</p>
                          </div>
                        )

                        return (
                          <div className="rounded-xl overflow-hidden"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="grid grid-cols-4 px-3 py-2 text-xs"
                              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--overlay)' }}>
                              <span className="col-span-2">{t('section')}</span>
                              <span className="text-center">{t('listens')}</span>
                              <span className="text-right">{t('time')}</span>
                            </div>
                            {rows.map(row => (
                              <div key={row.key}
                                className="grid grid-cols-4 px-3 py-2 text-xs items-center"
                                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <span className="col-span-2 truncate" style={{ color: 'var(--text-2)' }}>
                                  {row.parashaLabel} · {row.aliyahLabel}
                                </span>
                                <span className="text-center font-medium" style={{ color: '#6c33e6' }}>
                                  {row.count > 0 ? `${row.count}×` : '—'}
                                </span>
                                <span className="text-right font-medium" style={{ color: '#0d9488' }}>
                                  {row.seconds > 0 ? formatTime(row.seconds) : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Assign perasha actions */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button onClick={() => setAssignOpen(true)}
                      className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: 'linear-gradient(135deg, rgba(108,51,230,0.18), rgba(108,51,230,0.06))', border: '1px solid rgba(108,51,230,0.3)', color: '#8b5cf6' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {t('assign_parasha')}
                    </button>
                    <button onClick={() => setCalcOpen(true)}
                      className="py-2.5 rounded-xl text-xs font-medium"
                      style={{ background: 'rgba(249,184,0,0.1)', color: '#d97706', border: '1px solid rgba(249,184,0,0.2)' }}>
                      {t('bar_mitzvah_calc')}
                    </button>
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 rounded-xl text-xs font-medium"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                      {t('send_hw')}
                    </button>
                    <button className="py-2.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                      {t('view_history')}
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {calcOpen && student && (
        <BarMitzvahCalc
          student={student}
          onAssign={handleAssign}
          onClose={() => setCalcOpen(false)}
          t={t}
        />
      )}
      {assignOpen && student && (
        <AssignParashaModal
          student={student}
          onAssign={handleAssign}
          onClose={() => setAssignOpen(false)}
          t={t}
        />
      )}
    </div>
  )
}
