import { useLang } from '../context/LangContext'
import { dateBucket } from '../utils/parasha'

const ORDER = ['today', 'yesterday', 'week', 'older']

/** Renders items grouped chronologically (Today / Yesterday / This week / Earlier). */
export default function NotificationGroups({ items, renderItem }) {
  const { t } = useLang()
  const labels = { today: t('today'), yesterday: t('ui_yesterday'), week: t('ui_this_week'), older: t('ui_earlier') }
  const groups = ORDER.map(key => ({ key, items: items.filter(n => dateBucket(n.created_at) === key) })).filter(g => g.items.length)

  return (
    <div className="flex flex-col gap-6">
      {groups.map(g => (
        <section key={g.key} aria-label={labels[g.key]}>
          <h2 className="eyebrow px-1 mb-2.5">{labels[g.key]}</h2>
          <ul className="card overflow-hidden">
            {g.items.map((n, i) => (
              <li key={n.id} style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                {renderItem(n)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
