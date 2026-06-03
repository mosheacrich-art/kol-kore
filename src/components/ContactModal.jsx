import { useLang } from '../context/LangContext'

export default function ContactModal({ onClose }) {
  const { t } = useLang()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
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
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ color: 'var(--text-3)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          {t('contact_reach_us')}
        </p>

        {/* Email */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(108,51,230,0.12)', border: '1px solid rgba(108,51,230,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#8b5cf6" strokeWidth="1.2"/>
              <path d="M1 5l6 4 6-4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Email</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>contact.perashapp@gmail.com</p>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.306A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>WhatsApp</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>+34 625 676 901</p>
          </div>
        </div>

        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
          {t('close') || 'Cerrar'}
        </button>
      </div>
    </div>
  )
}
