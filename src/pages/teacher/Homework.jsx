import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { EmptyState, PageHeader, PageSpinner, SearchInput } from '../../components/ui'
import HomeworkComposer from '../../components/homework/HomeworkComposer'
import HomeworkItem, { HomeworkEditModal, homeworkStatus } from '../../components/homework/HomeworkItem'

export default function TeacherHomework() {
  const { profile } = useAuth()
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [composing, setComposing] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [studentFilter, setStudentFilter] = useState(params.get('student') || 'all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('homework').select('*, student:student_id(name)')
        .eq('teacher_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name').eq('teacher_id', profile.id).eq('role', 'student'),
    ]).then(([hw, st]) => {
      setItems(hw.data || [])
      setStudents(st.data || [])
      setLoading(false)
    })
  }, [profile])

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, overdue: 0, submitted: 0 }
    items.forEach(i => {
      const s = homeworkStatus(i)
      if (s === 'submitted') c.submitted++
      else if (s === 'overdue' || s === 'late') c.overdue++
      else c.pending++
    })
    return c
  }, [items])

  const visible = items.filter(i => {
    const s = homeworkStatus(i)
    if (statusFilter === 'pending' && s !== 'pending') return false
    if (statusFilter === 'overdue' && s !== 'overdue' && s !== 'late') return false
    if (statusFilter === 'submitted' && s !== 'submitted') return false
    if (studentFilter !== 'all' && i.student_id !== studentFilter) return false
    if (query) {
      const q = query.toLowerCase()
      if (!`${i.task} ${i.subject || ''} ${i.student?.name || ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const closeComposer = () => {
    setComposing(false)
    if (params.get('new')) { params.delete('new'); setParams(params, { replace: true }) }
  }

  const filters = [
    { key: 'all', label: t('ui_all') },
    { key: 'pending', label: t('ui_pending_plural') },
    { key: 'overdue', label: t('ui_overdue_plural') },
    { key: 'submitted', label: t('ui_submitted_plural') },
  ]

  return (
    <div className="page">
      <PageHeader
        hebrew="שִׁעוּרֵי בַּיִת"
        eyebrow={t('nav_homework')}
        title={t('homework_title')}
        subtitle={t('ui_hw_subtitle').replace('{p}', counts.pending).replace('{o}', counts.overdue)}
        actions={
          <button onClick={() => setComposing(true)} className="btn btn-primary btn-lg" disabled={!students.length}>
            <Plus size={18} strokeWidth={2} />{t('new_hw')}
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-up-1">
        {[
          { key: 'all', value: counts.all, label: t('ui_total') },
          { key: 'pending', value: counts.pending, label: t('ui_pending_plural'), color: 'rgb(var(--warning-rgb))' },
          { key: 'overdue', value: counts.overdue, label: t('ui_overdue_plural'), color: 'rgb(var(--danger-rgb))' },
          { key: 'submitted', value: counts.submitted, label: t('ui_submitted_plural'), color: 'rgb(var(--success-rgb))' },
        ].map(s => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className="card-flat px-5 py-4 text-start transition-colors hover:border-[color:var(--border-strong)]"
            style={statusFilter === s.key ? { borderColor: 'rgba(var(--accent-rgb),0.35)', boxShadow: '0 0 0 3px rgba(var(--accent-rgb),0.06)' } : undefined}
            aria-pressed={statusFilter === s.key}>
            <span className="flex items-center gap-2 text-[13px] text-ink-3">
              {s.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
              {s.label}
            </span>
            <span className="block text-[26px] font-semibold text-ink tabular-nums mt-1 leading-none">{s.value}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4 fade-up-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('ui_search_hw')} className="lg:max-w-sm flex-1" />
        <div className="flex gap-3 flex-wrap lg:ms-auto">
          <div className="segmented" role="tablist" aria-label={t('ui_filter_status')}>
            {filters.map(f => (
              <button key={f.key} role="tab" aria-selected={statusFilter === f.key} onClick={() => setStatusFilter(f.key)}>
                {f.label}
                <span className="ms-1.5 text-ink-4 tabular-nums">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)} className="input w-auto min-w-[180px]" aria-label={t('ui_filter_student')}>
            <option value="all">{t('ui_all_students')}</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      <section className="card fade-up-3">
        {loading ? <PageSpinner /> : visible.length === 0 ? (
          <EmptyState icon={ClipboardList}
            title={items.length ? t('no_results') : t('no_hw_sent')}
            description={items.length ? undefined : t('ui_hw_empty_desc')}
            action={!items.length && students.length > 0 && (
              <button onClick={() => setComposing(true)} className="btn btn-secondary"><Plus size={16} />{t('new_hw')}</button>
            )} />
        ) : (
          <ul>
            {visible.map((item, i) => (
              <li key={item.id} style={i ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                <HomeworkItem item={item} teacherId={profile.id}
                  onChange={next => setItems(prev => prev.map(x => x.id === next.id ? next : x))}
                  onDelete={id => setItems(prev => prev.filter(x => x.id !== id))}
                  onEdit={setEditing} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {composing && (
        <HomeworkComposer teacherId={profile.id} students={students}
          fixedStudent={studentFilter !== 'all' ? students.find(s => s.id === studentFilter) : null}
          onClose={closeComposer}
          onCreated={rows => setItems(prev => [...rows, ...prev])} />
      )}
      {editing && (
        <HomeworkEditModal item={editing} teacherId={profile.id} onClose={() => setEditing(null)}
          onSaved={next => setItems(prev => prev.map(x => x.id === next.id ? next : x))} />
      )}
    </div>
  )
}
