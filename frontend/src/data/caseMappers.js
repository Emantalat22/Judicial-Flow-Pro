export const STATUS_LABELS = {
  FILED: 'Filed',
  UNDER_REVIEW: 'In Review',
  ASSIGNED: 'Assigned',
  HEARING: 'Hearing',
  DECISION: 'Decision',
  CLOSED: 'Closed',
}

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const STATUS_OPTIONS = ['FILED', 'UNDER_REVIEW', 'ASSIGNED', 'HEARING', 'DECISION', 'CLOSED']
export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export const statusBadge = (s) =>
  ({ FILED: 'filed', UNDER_REVIEW: 'review', ASSIGNED: 'assigned', HEARING: 'hearing', DECISION: 'decision', CLOSED: 'closed' }[s] || 'pending')

export const priorityBadge = (p) => p?.toLowerCase() || 'medium'

export const formatHearingDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'
