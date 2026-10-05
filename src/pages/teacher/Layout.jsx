import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell, BookMarked, BookOpen, CalendarDays, CircleUser, ClipboardList,
  House, ScrollText, Sparkles, Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import AppShell from '../../components/shell/AppShell'

export default function TeacherLayout() {
  const location = useLocation()
  const { profile } = useAuth()
  const { t } = useLang()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('teacher_id', profile.id).eq('read', false).in('type', ['audio', 'listen'])
      .then(({ count }) => setUnreadCount(count || 0))
  }, [profile?.id, location.pathname])

  // Real-time badge update when a new notification arrives
  useEffect(() => {
    if (!profile?.id) return
    const refetch = () => {
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('teacher_id', profile.id).eq('read', false).in('type', ['audio', 'listen'])
        .then(({ count }) => setUnreadCount(count || 0))
    }
    const ch = supabase.channel(`teacher-badge-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `teacher_id=eq.${profile.id}`,
      }, ({ new: row }) => { if (['audio', 'listen'].includes(row.type)) refetch() })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `teacher_id=eq.${profile.id}`,
      }, refetch)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const sections = [
    {
      label: t('ui_section_main'),
      items: [
        { path: '/teacher/dashboard', label: t('nav_dashboard'), icon: House },
        { path: '/teacher/students',  label: t('nav_students'),  icon: Users },
        { path: '/teacher/homework',  label: t('nav_homework'),  icon: ClipboardList },
        { path: '/teacher/schedule',  label: t('nav_schedule'),  icon: CalendarDays },
      ],
    },
    {
      label: t('ui_section_study'),
      items: [
        { path: '/teacher/study',   label: t('nav_parashot'),      icon: BookOpen },
        { path: '/teacher/haftara', label: t('nav_haftara'),       icon: BookMarked },
        { path: '/teacher/tefila',  label: t('nav_tefila'),        icon: Sparkles },
        { path: '/teacher/tikun',   label: t('nav_tikun_teacher'), icon: ScrollText },
      ],
    },
    {
      label: t('ui_section_other'),
      items: [
        { path: '/teacher/notifications', label: t('nav_notifications'), icon: Bell, badge: unreadCount },
        { path: '/teacher/account',       label: t('nav_account'),       icon: CircleUser },
      ],
    },
  ]

  return (
    <AppShell sections={sections} roleLabel={t('role_teacher_label')}
      profilePath="/teacher/account" homePath="/teacher/dashboard" />
  )
}
