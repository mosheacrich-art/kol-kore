import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { PARASHOT, ALL_PARASHOT, COMBINED_PARASHOT } from '../../data/parashot'
import { ALL_MOADIM, MOADIM_LIST } from '../../data/moadim'
import { useLang } from '../../context/LangContext'
import WordRangePicker from '../../components/WordRangePicker'

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

function resolveParasha(idOrName) {
  if (!idOrName) return null
  const lower = idOrName.toLowerCase().replace(/[\s-]/g, '')
  return PARASHOT.find(p =>
    p.id === idOrName ||
    p.name.toLowerCase() === idOrName.toLowerCase() ||
    p.id.replace(/-/g, '') === lower
  ) || ALL_MOADIM.find(m => m.id === idOrName || m.name === idOrName) || null
}

function displayParashaName(idOrName) {
  return resolveParasha(idOrName)?.name || idOrName || ''
}

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

            {/* Special birthday banner */}
            {specialDay && (
              <div className="rounded-xl p-3.5"
                style={{ background: 'rgba(249,184,0,0.06)', border: '1px solid rgba(249,184,0,0.28)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#d97706' }}>
                  ⚠️ Nació en {specialDay.label}
                </p>
                <p className="text-xs mb-2.5" style={{ color: 'var(--text-3)' }}>
                  Se recomienda estudiar también la lectura especial de ese día.
                </p>
                <button type="button" onClick={() => setIncludeExtra(v => !v)}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg"
                  style={{ background: includeExtra ? 'rgba(249,184,0,0.1)' : 'var(--bg-card)', border: `1px solid ${includeExtra ? 'rgba(249,184,0,0.3)' : 'var(--border)'}` }}>
                  <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: includeExtra ? '#d97706' : 'var(--border)', background: includeExtra ? '#d97706' : 'transparent' }}>
                    {includeExtra && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l2 2L6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: includeExtra ? '#d97706' : 'var(--text-2)' }}>
                    Incluir también: {resolveParasha(specialDay.suggestedId)?.name || specialDay.label}
                  </span>
                </button>
              </div>
            )}
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

  const currentIds = [student.parasha_id, ...(student.extra_parasha_ids || [])]
    .filter(Boolean)
    .map(v => resolveParasha(v)?.id || v)
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
  const filteredParashot = s
    ? PARASHOT.filter(p => p.name.toLowerCase().includes(s) || p.heb.includes(search))
    : PARASHOT
  const filteredMoadim = s
    ? ALL_MOADIM.filter(m => m.name.toLowerCase().includes(s) || m.heb.includes(search))
    : ALL_MOADIM

  const moadimByChag = MOADIM_LIST.reduce((acc, chag) => {
    const items = filteredMoadim.filter(m => m.chag === chag.id)
    if (items.length) acc.push({ chag, items })
    return acc
  }, [])

  const checkIcon = (color = 'white') => (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <path d="M1.5 4l2 2L6.5 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-gold)' }}>פָּרָשִׁיּוֹת · Asignar</p>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Perashiot de {student.name?.split(' ')[0]}</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>✕</button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar perashá o lectura especial…"
            autoFocus
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 pb-2">

          {/* Parashot */}
          {filteredParashot.length > 0 && (
            <>
              <div className="px-2 py-1.5 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Torá</span>
              </div>
              {filteredParashot.map(p => {
                const sel = selectedIds.has(p.id)
                return (
                  <button key={p.id} onClick={() => toggle(p.id)} disabled={saving}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all"
                    style={{ background: sel ? 'rgba(249,184,0,0.1)' : 'transparent', border: `1px solid ${sel ? 'rgba(249,184,0,0.3)' : 'transparent'}` }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-card)' }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                    <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: sel ? '#d97706' : 'var(--border-subtle)', background: sel ? '#d97706' : 'transparent' }}>
                      {sel && checkIcon()}
                    </div>
                    <span className="text-xs w-5 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{p.num}</span>
                    <span className="text-sm flex-1" style={{ color: 'var(--text-2)' }}>{p.name}</span>
                    <span className="hebrew text-sm" style={{ color: sel ? '#d97706' : 'var(--text-3)' }}>{p.heb}</span>
                  </button>
                )
              })}
            </>
          )}

          {/* Moadim */}
          {moadimByChag.length > 0 && (
            <>
              <div className="px-2 py-1.5 mt-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lecturas especiales</span>
              </div>
              {moadimByChag.map(({ chag, items }) => (
                <div key={chag.id} className="mb-2">
                  <div className="px-3 py-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chag.color }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{chag.name}</span>
                  </div>
                  {items.map(m => {
                    const sel = selectedIds.has(m.id)
                    return (
                      <button key={m.id} onClick={() => toggle(m.id)} disabled={saving}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all"
                        style={{ background: sel ? `${chag.color}18` : 'transparent', border: `1px solid ${sel ? chag.color + '40' : 'transparent'}` }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-card)' }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                        <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: sel ? chag.color : 'var(--border-subtle)', background: sel ? chag.color : 'transparent' }}>
                          {sel && checkIcon()}
                        </div>
                        <span className="text-sm flex-1" style={{ color: 'var(--text-2)' }}>{m.name}</span>
                        <span className="hebrew text-sm" style={{ color: sel ? chag.color : 'var(--text-3)' }}>{m.heb}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </>
          )}

          {filteredParashot.length === 0 && filteredMoadim.length === 0 && (
            <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>Sin resultados</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[...selectedIds].map(id => (
                <span key={id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(249,184,0,0.1)', color: '#d97706', border: '1px solid rgba(249,184,0,0.25)' }}>
                  {displayParashaName(id)}
                  <button type="button" onClick={() => toggle(id)}
                    className="opacity-60 hover:opacity-100 ml-0.5">✕</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium"
              style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              Cancelar
            </button>
            <button onClick={assign} disabled={saving}
              className="flex-1 btn-gold py-2.5 rounded-xl text-xs font-semibold"
              style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando…'
                : selectedIds.size > 1 ? `Asignar ${selectedIds.size} perashiot`
                : selectedIds.size === 1 ? 'Asignar perashá'
                : 'Quitar asignación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SendHomeworkModal({ student, teacherId, onClose, t }) {
  const { isDark } = useTheme()
  const [form, setForm] = useState({ task: '', subject: '', due: '', parasha_id: '', aliyah_idx: 0, require_audio: false, word_start: null, word_end: null })
  const [saving, setSaving] = useState(false)
  const [showRangePicker, setShowRangePicker] = useState(false)
  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }
  const selectedParasha = ALL_PARASHOT.find(p => p.id === form.parasha_id) || ALL_MOADIM.find(p => p.id === form.parasha_id)

  const send = async () => {
    if (!form.task) return
    setSaving(true)
    await supabase.from('homework').insert({
      teacher_id: teacherId,
      student_id: student.id,
      task: form.task,
      subject: form.subject || null,
      due: form.due || null,
      parasha_id: form.parasha_id || null,
      aliyah_idx: form.parasha_id ? form.aliyah_idx : null,
      require_audio: form.parasha_id ? form.require_audio : false,
      word_start: form.parasha_id && form.word_start != null ? form.word_start : null,
      word_end: form.parasha_id && form.word_end != null ? form.word_end : null,
      status: 'pending',
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-gold)' }}>שִׁעוּרֵי בַּיִת · Deber</p>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              Enviar deber a {student.name?.split(' ')[0]}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}>✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('task_label')}</label>
            <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
              placeholder={t('task_placeholder')} autoFocus
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('parasha_optional')}</label>
            <select value={form.parasha_id}
              onChange={e => setForm(f => ({ ...f, parasha_id: e.target.value, aliyah_idx: 0, word_start: null, word_end: null }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
              <option value="">{t('no_parasha_opt')}</option>
              <optgroup label="── Parashot semanales ──">
                {PARASHOT.map(p => <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>)}
              </optgroup>
              <optgroup label="── Parashot dobles ──">
                {COMBINED_PARASHOT.map(p => <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>)}
              </optgroup>
              {MOADIM_LIST.map(m => {
                const items = ALL_MOADIM.filter(p => p.chag === m.id)
                if (!items.length) return null
                return (
                  <optgroup key={m.id} label={`── ${m.name} · ${m.heb} ──`}>
                    {items.map(p => <option key={p.id} value={p.id}>{p.name} · {p.heb}</option>)}
                  </optgroup>
                )
              })}
            </select>
          </div>

          {form.parasha_id && (
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

          {form.parasha_id && (
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>Fragmento</label>
              {form.word_start != null ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(249,184,0,0.1)', border: '1px solid rgba(249,184,0,0.3)' }}>
                  <span style={{ color: '#d97706' }}>Palabras {form.word_start + 1}–{form.word_end + 1}</span>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, word_start: null, word_end: null }))}
                    className="ml-auto text-xs px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(249,184,0,0.15)', color: '#92400e' }}>
                    Aliyá completa
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
                  Seleccionar fragmento
                  <span className="ml-auto text-xs opacity-40">Aliyá completa por defecto</span>
                </button>
              )}
            </div>
          )}

          {form.parasha_id && (
            <button type="button" onClick={() => setForm(f => ({ ...f, require_audio: !f.require_audio }))}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
              style={{
                background: form.require_audio ? 'rgba(108,51,230,0.1)' : 'var(--bg-card)',
                border: `1px solid ${form.require_audio ? 'rgba(108,51,230,0.3)' : 'var(--border)'}`,
              }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: form.require_audio ? 'rgba(108,51,230,0.2)' : 'var(--border-subtle)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="5" y="1" width="4" height="7" rx="2"
                    stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2"/>
                  <path d="M2 7c0 2.8 2.2 5 5 5s5-2.2 5-5"
                    stroke={form.require_audio ? '#6c33e6' : 'var(--text-3)'} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: form.require_audio ? '#6c33e6' : 'var(--text)' }}>
                  {t('require_audio_label')}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {form.require_audio ? t('must_record') : t('no_audio_req')}
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
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
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('subject_label')}</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Ej: Trop"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('due_label')}</label>
              <input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {t('cancel')}
          </button>
          <button onClick={send} disabled={saving || !form.task}
            className="flex-1 btn-gold py-2.5 rounded-xl text-xs font-semibold"
            style={{ opacity: saving || !form.task ? 0.6 : 1 }}>
            {saving ? t('sending') : t('send_hw')}
          </button>
        </div>
      </div>

      {showRangePicker && selectedParasha && (
        <WordRangePicker
          aliyahRef={selectedParasha.aliyot[form.aliyah_idx]?.ref}
          onConfirm={(s, e) => { setForm(f => ({ ...f, word_start: s, word_end: e })); setShowRangePicker(false) }}
          onClose={() => setShowRangePicker(false)}
        />
      )}
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
  const [hwOpen, setHwOpen] = useState(false)

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
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {(() => {
                          const all = [s.parasha_id, ...(s.extra_parasha_ids || [])].filter(Boolean)
                          if (!all.length) return <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t('no_parasha')}</span>
                          return all.map((id, idx) => (
                            <span key={id} className="text-xs" style={{ color: idx === 0 ? 'var(--text-3)' : 'var(--text-muted)' }}>
                              {idx > 0 && <span style={{ color: 'var(--border)' }}> + </span>}
                              {displayParashaName(id)}
                            </span>
                          ))
                        })()}
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
                          {[student.parasha_id, ...(student.extra_parasha_ids || [])].filter(Boolean).map(displayParashaName).join(' · ') || t('no_parasha')}
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
                      { label: t('my_parasha'), value: [student.parasha_id, ...(student.extra_parasha_ids || [])].filter(Boolean).map(displayParashaName).join(' + ') || '—' },
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
                    <button onClick={() => setHwOpen(true)}
                      className="py-2.5 rounded-xl text-xs font-medium"
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
      {hwOpen && student && (
        <SendHomeworkModal
          student={student}
          teacherId={profile.id}
          onClose={() => setHwOpen(false)}
          t={t}
        />
      )}
    </div>
  )
}
