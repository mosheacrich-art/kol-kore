import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'

const CONTACT_EMAIL = 'contact.perashapp@gmail.com'

export default function ContactModal({ onClose }) {
  const { t } = useLang()
  const { profile } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return
    const subject = encodeURIComponent(`Contacto desde Parashá · ${name.trim() || 'Usuario'}`)
    const body = encodeURIComponent(message.trim())
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-gold)' }}>
              צרו קשר · {t('contact_us')}
            </p>
            <h2 className="text-xl font-light" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {t('contact_title')}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{t('contact_desc')}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg flex-shrink-0 transition-all"
            style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('contact_name')}</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-3)' }}>{t('contact_message')}</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder={t('contact_placeholder')} rows={5}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
            {t('cancel')}
          </button>
          <button onClick={handleSend}
            disabled={!message.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: !message.trim() ? 'var(--bg-card)' : 'rgba(108,51,230,0.15)',
              color: !message.trim() ? 'var(--text-muted)' : '#8b5cf6',
              border: `1px solid ${!message.trim() ? 'var(--border-subtle)' : 'rgba(108,51,230,0.3)'}`,
              cursor: !message.trim() ? 'not-allowed' : 'pointer',
            }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 6.5h10M7 2.5l4.5 4-4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('contact_send')}
          </button>
        </div>
      </div>
    </div>
  )
}
