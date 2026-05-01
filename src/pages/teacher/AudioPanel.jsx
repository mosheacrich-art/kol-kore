import { useState, useRef } from 'react'
import { ALL_PARASHOT, BOOK_COLORS, SEFARIM_LIST } from '../../data/parashot'
import { useAudio } from '../../context/AudioContext'
import AudioPlayer from '../../components/AudioPlayer'

export default function TeacherAudioPanel() {
  const [selectedParasha, setSelectedParasha] = useState(ALL_PARASHOT[0])
  const [selectedAliyah, setSelectedAliyah] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [bookFilter, setBookFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { upload, remove, get, audios, generateSync, syncingKeys } = useAudio()

  const currentAudio = get(selectedParasha.id, selectedAliyah)
  const color = BOOK_COLORS[selectedParasha.book] || '#6c33e6'
  const currentKey = `${selectedParasha.id}-${selectedAliyah}`
  const isSyncing = syncingKeys.has(currentKey)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert('Solo se aceptan archivos de audio (mp3, wav, m4a, mp4…)')
      return
    }
    setUploading(true)
    await upload(selectedParasha.id, selectedAliyah, file)
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const filteredParashot = bookFilter === 'all'
    ? ALL_PARASHOT
    : ALL_PARASHOT.filter(p => p.book === bookFilter)

  const totalAudios = Object.keys(audios).length
  const parashaAudios = Object.keys(audios).filter(k => k.startsWith(`${selectedParasha.id}-`))

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
              Panel de Audios
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              Sube audios por aliyá · Tus alumnos los escuchan al estudiar
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

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Left: Parasha selector */}
        <div className="xl:col-span-2 fade-up-2">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
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
                Todas
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
          </div>
        </div>

        {/* Right: Upload area */}
        <div className="xl:col-span-3 fade-up-3">
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

            {/* Selected parasha */}
            <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                style={{ background: `${color}20`, color, border: `1px solid ${color}30`, fontSize: selectedParasha.combined ? '10px' : undefined }}>
                {selectedParasha.combined ? '✦✦' : selectedParasha.num}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="hebrew text-lg" style={{ color }}>{selectedParasha.heb}</span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{selectedParasha.name}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedParasha.ref}</p>
              </div>
            </div>

            {/* Aliyah selector */}
            <div className="mb-5">
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>Selecciona la aliyá</p>
              <div className="flex gap-2 flex-wrap">
                {selectedParasha.aliyot.map((a, i) => {
                  const hasAudio = !!get(selectedParasha.id, i)
                  const key = `${selectedParasha.id}-${i}`
                  const syncing = syncingKeys.has(key)
                  return (
                    <button key={i} onClick={() => setSelectedAliyah(i)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: selectedAliyah === i ? color : 'var(--bg-card)',
                        color: selectedAliyah === i ? '#fff' : 'var(--text-3)',
                        border: `1px solid ${selectedAliyah === i ? 'transparent' : 'var(--border)'}`,
                      }}>
                      {a.n === 8 ? 'Maftir' : `${a.n}ª`}
                      {syncing && (
                        <span className="inline-block w-2 h-2 rounded-full border border-t-transparent animate-spin"
                          style={{ borderColor: selectedAliyah === i ? 'rgba(255,255,255,0.4)' : `${color}40`, borderTopColor: selectedAliyah === i ? '#fff' : color }} />
                      )}
                      {!syncing && hasAudio && (
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: selectedAliyah === i ? 'rgba(255,255,255,0.7)' : '#2dd4bf' }} />
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {selectedParasha.aliyot[selectedAliyah].ref}
              </p>
            </div>

            {/* Current audio preview */}
            {currentAudio && (
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>Audio actual</p>
                <AudioPlayer audio={currentAudio} label={selectedParasha.aliyot[selectedAliyah].label} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Subido: {currentAudio.uploadedAt}
                  </span>
                  <button onClick={() => remove(selectedParasha.id, selectedAliyah)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            )}

            {/* Status banner: uploading or syncing */}
            {(uploading || isSyncing) && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}>
                <span className="inline-block w-3 h-3 rounded-full border border-t-transparent animate-spin flex-shrink-0"
                  style={{ borderColor: `${color}40`, borderTopColor: color }} />
                {uploading ? 'Subiendo audio…' : 'Sincronizando con IA…'}
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
                  {currentAudio ? 'Reemplazar audio' : 'Subir audio'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Arrastra aquí o haz clic · MP3, WAV, M4A
                </p>
                <p className="text-xs mt-1 hebrew" style={{ color: 'var(--text-gold)' }}>
                  {selectedParasha.heb} · {selectedParasha.aliyot[selectedAliyah].label}
                </p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="audio/*,video/mp4,.mp4" className="hidden"
              onChange={e => handleFile(e.target.files?.[0])} />
          </div>

          {/* Summary of all audios for this parasha */}
          {parashaAudios.length > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                Audios de <span className="hebrew" style={{ color }}>{selectedParasha.heb}</span>
              </p>
              <div className="flex flex-col gap-2">
                {selectedParasha.aliyot.map((a, i) => {
                  const audio = get(selectedParasha.id, i)
                  if (!audio) return null
                  const key = `${selectedParasha.id}-${i}`
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
                                sincronizando…
                              </span>
                            )
                            : (
                              <button
                                onClick={async () => { await generateSync(selectedParasha.id, i) }}
                                className="text-xs px-1.5 py-0.5 rounded-full transition-all"
                                style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                ⚡ Reintentar sync
                              </button>
                            )
                        }
                      </div>
                      <button onClick={() => remove(selectedParasha.id, i)}
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
          )}
        </div>
      </div>
    </div>
  )
}
