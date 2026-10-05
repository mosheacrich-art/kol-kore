import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell, BookMarked, BookOpen, CircleUser, CreditCard, House, ScrollText, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useStudyTimer } from '../../hooks/useStudyTimer'
import { supabase } from '../../lib/supabase'
import AppShell from '../../components/shell/AppShell'

export default function StudentLayout() {
  const location = useLocation()
  const { profile } = useAuth()
  const { t } = useLang()
  const [unreadEvals, setUnreadEvals] = useState(0)
  useStudyTimer(profile?.id)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', profile.id)
      .eq('read', false)
      .in('type', ['evaluation', 'homework'])
      .then(({ count }) => setUnreadEvals(count ?? 0))
  }, [profile?.id, location.pathname])

  // Real-time badge update when teacher sends a correction
  useEffect(() => {
    if (!profile?.id) return
    const refetchCount = () => {
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('student_id', profile.id).eq('read', false)
        .in('type', ['evaluation', 'homework'])
        .then(({ count }) => setUnreadEvals(count ?? 0))
    }
    const ch = supabase.channel(`student-badge-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `student_id=eq.${profile.id}`,
      }, () => refetchCount())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `student_id=eq.${profile.id}`,
      }, () => refetchCount())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const sections = [
    {
      label: t('ui_section_main'),
      items: [
        { path: '/student/profile', label: t('ui_home'), icon: House },
      ],
    },
    {
      label: t('ui_section_study'),
      items: [
        { path: '/student/study',   label: t('nav_parashot') || t('nav_study'), icon: BookOpen },
        { path: '/student/haftara', label: t('nav_haftara'), icon: BookMarked },
        { path: '/student/tefila',  label: t('nav_tefila'),  icon: Sparkles },
        { path: '/student/tikun',   label: t('nav_tikun'),   icon: ScrollText },
      ],
    },
    {
      label: t('ui_section_other'),
      items: [
        { path: '/student/notifications', label: t('nav_notifications'), icon: Bell, badge: unreadEvals },
        { path: '/student/subscription',  label: t('nav_subscription'),  icon: CreditCard },
        { path: '/student/account',       label: t('nav_account'),       icon: CircleUser },
      ],
    },
  ]

  return (
    <AppShell sections={sections} roleLabel={t('role_student_label')}
      profilePath="/student/profile" homePath="/student/profile" />
  )
}
