import { useState, useRef } from 'react'
import { ALL_PARASHOT, BOOK_COLORS, SEFARIM_LIST } from '../../data/parashot'
import { ALL_HAFTAROT } from '../../data/haftarot'
import { useSiddurIndex, useSiddurShabbatIndex } from '../../hooks/useSefaria'
import { useAudio } from '../../context/AudioContext'
import AudioPlayer from '../../components/AudioPlayer'
import { useLang } from '../../context/LangContext'

export default function TeacherAudioPanel() {
  // ── Section type ──────────────────────────────────────────────────────────
  const [sectionType, setSectionType] = useState('parasha')

  // ── Parasha state ─────────────────────────────────────────────────────────
  const [selectedParasha, setSelectedParasha] = useState(ALL_PARASHOT[0])
  const [selectedAliyah, setSelectedAliyah] = useState(0)
  const [bookFilter, setBookFilter] = useState('all')

  // ── Haftara state ─────────────────────────────────────────────────────────
  const [selectedHaftara, setSelectedHaftara] = useState(ALL_HAFTAROT[0])

  // ── Tefila state ──────────────────────────────────────────────────────────
  const [tefilaNusach, setTefilaNusach] = useState('ashkenaz')
  const [tefilaTab, setTefilaTab] = useState('weekday')
  const [expandedService, setExpandedService] = useState(null)
  const [selectedTefila, setSelectedTefila] = useState(null)
  const { services: weekdayServices, loading: wdLoading } = useSiddurIndex(tefilaNusach)
  const { services: shabbatServices, loading: sbLoading } = useSiddurShabbatIndex(tefilaNusach)

  // ── Shared ────────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { upload, remove, get, audios, generateSync, syncingKeys, syncErrors } = useAudio()
  const { t } = useLang()

  // ── Entity abstraction ────────────────────────────────────────────────────
  function getEntity() {
    if (sectionType === 'parasha') {
      return {
        id: selectedParasha.id,
        aliyahIdx: selectedAliyah,
        ref: selectedParasha.aliyot[selectedAliyah]?.ref,
        color: BOOK_COLORS[selectedParasha.book] || '#6c33e6',
        aliyot: selectedParasha.aliyot,
        heb: selectedParasha.heb,
        name: selectedParasha.name,
      }
    }
    if (sectionType === 'haftara') {
      return {
        id: selectedHaftara.id,
        aliyahIdx: 0,
        ref: selectedHaftara.aliyot[0]?.ref,
        color: BOOK_COLORS[selectedHaftara.book] || '#8b5cf6',
        aliyot: [selectedHaftara.aliyot[0]],
        heb: selectedHaftara.heb,
        name: selectedHaftara.name,
      }
    }
    // tefila
    if (!selectedTefila) return null
    return {
      id: selectedTefila.id,
      aliyahIdx: 0,
      ref: selectedTefila.aliyot[0]?.ref ?? null,
      color: selectedTefila.color || '#10b981',
      aliyot: [{ ...selectedTefila.aliyot[0], ref: selectedTefila.aliyot[0]?.ref ?? null }],
      heb: selectedTefila.heb,
      name: selectedTefila.name,
    }
  }

  const entity = getEntity()
  const currentAudio = entity ? get(entity.id, entity.aliyahIdx) : null
  const color = entity?.color || '#6c33e6'
  const currentKey = entity ? `${entity.id}-${entity.aliyahIdx}` : ''
  const isSyncing = currentKey ? syncingKeys.has(currentKey) : false

  const handleFile = async (file) => {
    if (!file || !entity) return
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert(t('audio_file_error'))
      return
    }
    setUploading(true)
    await upload(entity.id, entity.aliyahIdx, file, entity.ref)
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredParashot = bookFilter === 'all'
    ? ALL_PARASHOT
    : ALL_PARASHOT.filter(p => p.book === bookFilter)

  const totalAudios = Object.keys(audios).length

  const tefilaServices = tefilaTab === 'weekday'
    ? (weekdayServices || [])
    : (shabbatServices || [])
  const tefilaLoading = tefilaTab === 'weekday' ? wdLoading : sbLoading

  // ── Section tab labels ────────────────────────────────────────────────────
  const SECTION_TABS = [
    { id: 'parasha', label: 'Torá', heb: 'תּוֹרָה' },
    { id: 'haftara', label: 'Haftará', heb: 'הַפְטָרָה' },
    { id: 'tefila', label: 'Tefila', heb: 'תְּפִלָּה' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 fade-up-1">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-gold)' }}>
          הֶקְלָטוֹת · Audios
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light" style={{ color: 'var(--text)', letterSpacing: '-1px' }}>
              {t('audio_panel_title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              {t('audio_panel_sub')}
            </p>
          </div>
          {totalAudios > 0 && (
            <div className="px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(249,184,0,0.1)', border: '1px solid rgba(249,184,0,0.2)', color: '#b8860b' }}>
              {totalAudios} audio{totalAudios > 1 ? 's' : ''} subido{totalAudios > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Section type tabs */}
      <div className="mb-6 flex gap-2 fade-up-2">
        {SECTION_TABS.map(tab => (
          <button key={tab.id} onClick={() => setSectionType(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all"
            style={{
              background: sectionType === tab.id ? 'var(--border)' : 'transparent',
              color: sectionType === tab.id ? 'var(--text)' : 'var(--text-3)',
              border: '1px solid var(--border)',
              fontWeight: sectionType === tab.id ? 500 : 400,
            }}>
            <span className="hebrew text-xs" style={{ opacity: 0.7 }}>{tab.heb}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* LEFT PANEL */}
        <div className="xl:col-span-2 fade-up-2">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>

            {/* PARASHA left panel */}
            {sectionType === 'parasha' && (
              <>
                {/* Book filter */}
                <div className="p-3 flex gap-1.5 flex-wrap"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <button onClick={() => setBookFilter('all')}
                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: bookFilter === 'all' ? 'var(--border)' : 'transparent',
                      color: bookFilter === 'all' ? 'var(--text)' : 'var(--text-3)',
                      border: '1px solid var(--border)',
                    }}>
                    {t('all_filter')}
                  </button>
                  {SEFARIM_LIST.map(s => {
                    const c = BOOK_COLORS[s.id]
                    return (
                      <button key={s.id} onClick={() => setBookFilter(s.id)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: bookFilter === s.id ? `${c}20` : 'transparent',
                          color: bookFilter === s.id ? c : 'var(--text-3)',
                          border: `1px solid ${bookFilter === s.id ? c + '30' : 'var(--border)'}`,
                        }}>
                        {s.name}
                      </button>
                    )
                  })}
                </div>
                {/* Parasha list */}
                <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                  {filteredParashot.map(p => {
                    const c = BOOK_COLORS[p.book]
                    const isSelected = selectedParasha.id === p.id
                    const pAudios = Object.keys(audios).filter(k => k.startsWith(`${p.id}-`)).length
                    return (
                      <button key={p.id} onClick={() => { setSelectedParasha(p); setSelectedAliyah(0) }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all"
                        style={{
                          background: isSelected ? `${c}15` : 'transparent',
                          borderLeft: `2px solid ${isSelected ? c : 'transparent'}`,
                        }}>
                        <div className="flex items-center gap-2.5">
                          {p.combined
                            ? <span className="text-xs w-6 text-right flex-shrink-0 font-medium" style={{ color: c, fontSize: '8px' }}>✦✦</span>
                            : <span className="text-xs w-6 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{p.num}</span>
                          }
                          <div>
                            <span className="text-sm" style={{ color: isSelected ? 'var(--text)' : 'var(--text-2)' }}>{p.name}</span>
                            <span className="hebrew text-xs ml-1.5" style={{ color: c + '80' }}>{p.heb}</span>
                            {p.combined && <span className="text-xs ml-1" style={{ color: c, fontSize: '9px', opacity: 0.7 }}>· doble</span>}
                          </div>
                        </div>
                        {pAudios > 0 && (
                          <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: `${pAudios > 0 ? BOOK_COLORS[p.book] : color}25`, color: BOOK_COLORS[p.book], fontSize: '10px' }}>
                            {pAudios}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* HAFTARA left panel */}
            {sectionType === 'haftara' && (
              <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {ALL_HAFTAROT.map(h => {
                  const c = BOOK_COLORS[h.book] || '#8b5cf6'
                  const isSelected = selectedHaftara.id === h.id
                  const hAudios = Object.keys(audios).filter(k => k.startsWith(`${h.id}-`)).length
                  return (
                    <button key={h.id} onClick={() => { setSelectedHaftara(h); setSelectedHaftaraAliyah(0) }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all"
                      style={{
                        background: isSelected ? `${c}15` : 'transparent',
                        borderLeft: `2px solid ${isSelected ? c : 'transparent'}`,
                      }}>
                      <div>
                        <span className="text-sm" style={{ color: isSelected ? 'var(--text)' : 'var(--text-2)' }}>{h.name}</span>
                        <span className="hebrew text-xs ml-1.5" style={{ color: c + '80' }}>{h.heb}</span>
                      </div>
                      {hAudios > 0 && (
                        <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${c}25`, color: c, fontSize: '10px' }}>
                          {hAudios}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* TEFILA left panel */}
            {sectionType === 'tefila' && (
              <>
                {/* Nusach + weekday/shabbat controls */}
                <div className="p-3 flex gap-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['ashkenaz', 'sefard'].map(n => (
                    <button key={n} onClick={() => setTefilaNusach(n)}
                      className="text-xs px-2.5 py-1 rounded-full transition-all capitalize"
                      style={{
                        background: tefilaNusach === n ? 'var(--border)' : 'transparent',
                        color: tefilaNusach === n ? 'var(--text)' : 'var(--text-3)',
                        border: '1px solid var(--border)',
                      }}>
                      {n}
                    </button>
                  ))}
                  <div className="flex gap-1 ml-auto">
                    {[{ id: 'weekday', label: 'Semana' }, { id: 'shabbat', label: 'Shabat' }].map(tab => (
                      <button key={tab.id} onClick={() => setTefilaTab(tab.id)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all"
                        style={{
                          background: tefilaTab === tab.id ? '#10b98120' : 'transparent',
                          color: tefilaTab === tab.id ? '#10b981' : 'var(--text-3)',
                          border: `1px solid ${tefilaTab === tab.id ? '#10b98130' : 'var(--border)'}`,
                        }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Service list accordion */}
                <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                  {tefilaLoading && (
                    <div className="flex items-center justify-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="inline-block w-4 h-4 rounded-full border border-t-transparent animate-spin mr-2"
                        style={{ borderColor: 'var(--border)', borderTopColor: '#10b981' }} />
                      Cargando...
                    </div>
                  )}
                  {!tefilaLoading && tefilaServices.map(service => {
                    const isExpanded = expandedService === service.id
                    return (
                      <div key={service.id}>
                        <button
                          onClick={() => setExpandedService(isExpanded ? null : service.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                          style={{
                            background: isExpanded ? `${service.color}15` : 'transparent',
                            borderLeft: `2px solid ${isExpanded ? service.color : 'transparent'}`,
                          }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: service.color }} />
                            <span className="text-sm font-medium" style={{ color: isExpanded ? 'var(--text)' : 'var(--text-2)' }}>
                              {service.name}
                            </span>
                            <span className="hebrew text-xs" style={{ color: service.color + '80' }}>{service.heb}</span>
                          </div>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                            style={{ color: 'var(--text-3)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div style={{ background: `${service.color}08` }}>
                            {service.subsections.map((sub, si) => (
                              <div key={si}>
                                {sub.name && (
                                  <div className="px-5 py-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                    {sub.name}
                                  </div>
                                )}
                                {sub.items.map((item, ii) => {
                                  const isSel = selectedTefila?.id === item.ref
                                  const iAudios = Object.keys(audios).filter(k => k.startsWith(`${item.ref}-`)).length
                                  return (
                                    <button key={ii}
                                      onClick={() => setSelectedTefila({ id: item.ref, name: item.title, heb: item.heTitle, color: service.color })}
                                      className="w-full flex items-center justify-between px-6 py-2 text-left transition-all"
                                      style={{
                                        background: isSel ? `${service.color}20` : 'transparent',
                                        borderLeft: `2px solid ${isSel ? service.color : 'transparent'}`,
                                      }}>
                                      <div>
                                        <span className="text-xs" style={{ color: isSel ? 'var(--text)' : 'var(--text-2)' }}>{item.title}</span>
                                        {item.heTitle && (
                                          <span className="hebrew text-xs ml-1.5" style={{ color: service.color + '70' }}>{item.heTitle}</span>
                                        )}
                                      </div>
                                      {iAudios > 0 && (
                                        <span className="text-xs w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                          style={{ background: `${service.color}25`, color: service.color, fontSize: '9px' }}>
                                          {iAudios}
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-3 fade-up-3">
          {/* No tefila selected */}
          {sectionType === 'tefila' && !selectedTefila ? (
            <div className="rounded-2xl p-10 flex flex-col items-center justify-center text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: '200px' }}>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Selecciona una tefila del panel izquierdo</p>
            </div>
          ) : entity && (
            <>
              <div className="rounded-2xl p-5 mb-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                {/* Selected entity header */}
                <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                    {sectionType === 'parasha' && !selectedParasha.combined && <span>{selectedParasha.num}</span>}
                    {sectionType === 'parasha' && selectedParasha.combined && <span style={{ fontSize: '10px' }}>✦✦</span>}
                    {sectionType === 'haftara' && <span style={{ fontSize: '10px' }}>♩</span>}
                    {sectionType === 'tefila' && <span style={{ fontSize: '10px' }}>✡</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="hebrew text-lg" style={{ color }}>{entity.heb}</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{entity.name}</span>
                    </div>
                    {entity.ref && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entity.ref}</p>}
                  </div>
                </div>

                {/* Aliyah selector (parasha only) */}
                {sectionType === 'parasha' && (
                  <div className="mb-5">
                    <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t('select_aliyah')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {entity.aliyot.map((a, i) => {
                        const hasAudio = !!get(entity.id, i)
                        const key = `${entity.id}-${i}`
                        const syncing = syncingKeys.has(key)
                        const setAliyah = sectionType === 'parasha' ? setSelectedAliyah : setSelectedHaftaraAliyah
                        const currentIdx = selectedAliyah
                        return (
                          <button key={i} onClick={() => setAliyah(i)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: currentIdx === i ? color : 'var(--bg-card)',
                              color: currentIdx === i ? '#fff' : 'var(--text-3)',
                              border: `1px solid ${currentIdx === i ? 'transparent' : 'var(--border)'}`,
                            }}>
                            {a.n === 8 ? 'Maftir' : `${a.n}ª`}
                            {syncing && (
                              <span className="inline-block w-2 h-2 rounded-full border border-t-transparent animate-spin"
                                style={{ borderColor: currentIdx === i ? 'rgba(255,255,255,0.4)' : `${color}40`, borderTopColor: currentIdx === i ? '#fff' : color }} />
                            )}
                            {!syncing && hasAudio && (
                              <span className="w-1.5 h-1.5 rounded-full"
                                style={{ background: currentIdx === i ? 'rgba(255,255,255,0.7)' : '#2dd4bf' }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {entity.aliyot[entity.aliyahIdx]?.ref}
                    </p>
                  </div>
                )}

                {/* Current audio preview */}
                {currentAudio && (
                  <div className="mb-4">
                    <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{t('current_audio')}</p>
                    <AudioPlayer audio={currentAudio} label={entity.aliyot[entity.aliyahIdx]?.label || entity.name} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {t('uploaded_label')} {currentAudio.uploadedAt}
                      </span>
                      <button onClick={() => remove(entity.id, entity.aliyahIdx)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Status banner */}
                {(uploading || isSyncing) && (
                  <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
                    <span className="inline-block w-3 h-3 rounded-full border border-t-transparent animate-spin flex-shrink-0"
                      style={{ borderColor: `${color}40`, borderTopColor: color }} />
                    {uploading ? t('uploading_audio') : t('syncing_ai')}
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 py-8"
                  style={{
                    border: `2px dashed ${dragging ? color : 'var(--border)'}`,
                    background: dragging ? `${color}0d` : 'transparent',
                    opacity: uploading ? 0.6 : 1,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: dragging ? `${color}20` : 'var(--bg-card)',
                      border: `1px solid ${dragging ? color + '40' : 'var(--border)'}`,
                    }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ color: dragging ? color : 'var(--text-3)' }}>
                      <path d="M11 3v12M7 9l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: dragging ? color : 'var(--text-2)' }}>
                      {currentAudio ? t('replace_audio') : t('upload_audio')}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {t('drag_hint')}
                    </p>
                    <p className="text-xs mt-1 hebrew" style={{ color: 'var(--text-gold)' }}>
                      {entity.heb} · {entity.aliyot[entity.aliyahIdx]?.label || entity.name}
                    </p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="audio/*,video/mp4,.mp4" className="hidden"
                  onChange={e => handleFile(e.target.files?.[0])} />
              </div>

              {/* Summary of audios (parasha only) */}
              {sectionType === 'parasha' && (() => {
                const entityAudios = Object.keys(audios).filter(k => k.startsWith(`${entity.id}-`))
                if (!entityAudios.length) return null
                return (
                  <div className="rounded-2xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                      {t('audios_of')} <span className="hebrew" style={{ color }}>{entity.heb}</span>
                    </p>
                    <div className="flex flex-col gap-2">
                      {entity.aliyot.map((a, i) => {
                        const audio = get(entity.id, i)
                        if (!audio) return null
                        const key = `${entity.id}-${i}`
                        const syncing = syncingKeys.has(key)
                        return (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                            style={{ background: `${color}0a`, border: `1px solid ${color}18` }}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: `${color}25`, color }}>
                                {a.n === 8 ? 'M' : a.n}
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-2)' }}>{a.label}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{audio.name.slice(0, 20)}{audio.name.length > 20 ? '…' : ''}</span>
                              {audio.wordTimestamps
                                ? <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}>sync ✓</span>
                                : syncing
                                  ? (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                      <span className="inline-block w-2.5 h-2.5 rounded-full border border-t-transparent animate-spin"
                                        style={{ borderColor: `${color}50`, borderTopColor: color }} />
                                      {t('syncing_label')}
                                    </span>
                                  )
                                  : (
                                    <div className="flex flex-col gap-1 items-start">
                                      <button
                                        onClick={async () => { await generateSync(entity.id, i, entity.aliyot[i].ref) }}
                                        className="text-xs px-1.5 py-0.5 rounded-full transition-all"
                                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                        {t('retry_sync')}
                                      </button>
                                      {syncErrors[key] && (
                                        <span className="text-xs max-w-xs" style={{ color: '#ef4444' }} title={syncErrors[key]}>
                                          {t('error_prefix')} {syncErrors[key].length > 60 ? syncErrors[key].slice(0, 60) + '…' : syncErrors[key]}
                                        </span>
                                      )}
                                    </div>
                                  )
                              }
                            </div>
                            <button onClick={() => remove(entity.id, i)}
                              className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
