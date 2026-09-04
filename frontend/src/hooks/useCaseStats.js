import { useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'

// Backend case statuses, in workflow order
export const CASE_STAGES = [
  { key: 'FILED',        label: 'Filed',    description: 'Case registered & logged' },
  { key: 'UNDER_REVIEW', label: 'Review',   description: 'Documentation under review' },
  { key: 'ASSIGNED',     label: 'Assigned', description: 'Judge & clerk assigned' },
  { key: 'HEARING',      label: 'Hearing',  description: 'Hearings scheduled' },
  { key: 'DECISION',     label: 'Decision', description: 'Awaiting formal ruling' },
  { key: 'CLOSED',       label: 'Closed',   description: 'Case archived & resolved' },
]

export default function useCaseStats() {
  const [reloadKey, setReloadKey] = useState(0)
  const [stats, setStats] = useState({ stages: [], cases: [], total: 0, loading: true, error: null })

  const refetch = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchCaseStats() {
      try {
        const { data } = await apiClient.get('/cases')
        const cases = data || []
        const stages = CASE_STAGES.map((stage) => ({
          ...stage,
          count: cases.filter((c) => (c.status || '').toUpperCase() === stage.key).length,
        }))
        if (isMounted) {
          setStats({ stages, cases, total: cases.length, loading: false, error: null })
        }
      } catch (err) {
        console.error('Failed to load case stats:', err)
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false, error: 'Unable to load case statistics.' }))
        }
      }
    }

    fetchCaseStats()

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  return { ...stats, refetch }
}
