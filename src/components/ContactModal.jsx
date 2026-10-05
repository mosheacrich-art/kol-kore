import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { Modal } from './ui'

const EMAIL = 'contact.perashapp@gmail.com'
const WHATSAPP = '+34 625 676 901'

export default function ContactModal({ open = true, onClose }) {
  const { t } = useLang()

  const rows = [
    { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: MessageCircle, label: 'WhatsApp', value: WHATSAPP, href: `https://wa.me/${WHATSAPP.replace(/\D/g, '')}` },
  ]

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('contact_title')} subtitle={t('contact_reach_us')}
      footer={<button onClick={onClose} className="btn btn-secondary">{t('close') || 'Cerrar'}</button>}>
      <div className="flex flex-col gap-2">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer"
            className="group flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-2 transition-colors hover:bg-[color:var(--accent-tint)]"
            style={{ border: '1px solid var(--border-subtle)' }}>
            <span className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent flex-shrink-0"
              style={{ border: '1px solid var(--border-subtle)' }}>
              <Icon size={18} strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] text-ink-3">{label}</span>
              <span className="block text-sm font-medium text-ink truncate" dir="ltr">{value}</span>
            </span>
            <ArrowUpRight size={16} className="text-ink-4 group-hover:text-ink transition-colors rtl:-scale-x-100" />
          </a>
        ))}
      </div>
    </Modal>
  )
}
