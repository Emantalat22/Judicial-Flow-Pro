import { useState, useEffect } from 'react'
import StatCard from '../ui/StatCard'
import apiClient from '../../api/client'

export default function StatsRow({ onMetricsLoaded }) {
  const [metrics, setMetrics] = useState({
    activeCases: 0,
    pendingTasks: 0,
    todayHearings: 0,
    resolvedCases: 0,
    loading: true,
  })

  useEffect(() => {
    let isMounted = true

    async function fetchDashboardMetrics() {
      try {
        const [casesRes, hearingsRes, tasksRes] = await Promise.allSettled([
          apiClient.get('/cases'),
          apiClient.get('/hearings'),
          apiClient.get('/tasks'),
        ])

        const cases = casesRes.status === 'fulfilled' ? casesRes.value.data || [] : []
        const hearings = hearingsRes.status === 'fulfilled' ? hearingsRes.value.data || [] : []
        const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data || [] : []

        // Active cases (status not CLOSED)
        const activeCasesCount = cases.filter((c) => (c.status || '').toUpperCase() !== 'CLOSED').length
        const resolvedCasesCount = cases.filter((c) => (c.status || '').toUpperCase() === 'CLOSED').length

        // Pending & In Progress Tasks
        const pendingTasksCount = tasks.filter(
          (t) => (t.status || '').toUpperCase() === 'PENDING' || (t.status || '').toUpperCase() === 'IN_PROGRESS'
        ).length

        // Urgent/High Tasks
        const urgentTasksCount = tasks.filter(
          (t) =>
            ((t.priority || '').toUpperCase() === 'URGENT' || (t.priority || '').toUpperCase() === 'HIGH') &&
            (t.status || '').toUpperCase() !== 'COMPLETED'
        ).length

        // Today's Hearings
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1

        const todayHearingsCount = hearings.filter((h) => {
          if (!h.scheduled_at) return false
          const hTime = new Date(h.scheduled_at).getTime()
          return hTime >= startOfDay && hTime <= endOfDay && (h.status || '').toUpperCase() !== 'CANCELLED'
        }).length

        const loadedMetrics = {
          activeCases: activeCasesCount,
          pendingTasks: pendingTasksCount,
          todayHearings: todayHearingsCount,
          resolvedCases: resolvedCasesCount,
          urgentTasks: urgentTasksCount,
          loading: false,
        }

        if (isMounted) {
          setMetrics(loadedMetrics)
          if (onMetricsLoaded) {
            onMetricsLoaded(loadedMetrics)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err)
        if (isMounted) {
          setMetrics((prev) => ({ ...prev, loading: false }))
        }
      }
    }

    fetchDashboardMetrics()

    return () => {
      isMounted = false
    }
  }, [onMetricsLoaded])

  const cards = [
    {
      id: 1,
      label: 'Active Cases',
      value: metrics.loading ? '—' : metrics.activeCases,
      delta: 'Active in Court',
      deltaType: 'up',
      iconKey: 'briefcase',
      accent: 'navy',
      to: '/cases',
      spark: [metrics.activeCases, metrics.activeCases + 1, metrics.activeCases],
    },
    {
      id: 2,
      label: 'Pending Actions',
      value: metrics.loading ? '—' : metrics.pendingTasks,
      delta: metrics.pendingTasks > 0 ? `${metrics.pendingTasks} action${metrics.pendingTasks === 1 ? '' : 's'} pending` : 'All caught up',
      deltaType: metrics.pendingTasks > 0 ? 'down' : 'up',
      iconKey: 'clock',
      accent: 'gold',
      to: '/tasks',
      spark: [metrics.pendingTasks + 2, metrics.pendingTasks + 1, metrics.pendingTasks],
    },
    {
      id: 3,
      label: "Today's Hearings",
      value: metrics.loading ? '—' : metrics.todayHearings,
      delta: `${metrics.todayHearings} scheduled today`,
      deltaType: 'neutral',
      iconKey: 'calendar',
      accent: 'royal',
      to: '/hearings',
      spark: [metrics.todayHearings, metrics.todayHearings + 1, metrics.todayHearings],
    },
    {
      id: 4,
      label: 'Cases Resolved',
      value: metrics.loading ? '—' : metrics.resolvedCases,
      delta: 'Archived & Closed',
      deltaType: 'up',
      iconKey: 'check',
      accent: 'green',
      to: '/cases',
      spark: [metrics.resolvedCases, metrics.resolvedCases + 1, metrics.resolvedCases],
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.id} {...card} />
      ))}
    </div>
  )
}
