import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import {
  BellIcon,
  CheckCircleIcon,
  CalendarIcon,
  BriefcaseIcon,
  FileIcon,
  AlertTriangleIcon,
  TrashIcon,
  ExternalLinkIcon,
  SearchIcon,
  FilterIcon,
  XIcon,
  ClockIcon,
  PlusIcon,
} from '../components/Icons'

const TYPE_CONFIG = {
  HEARING_SCHEDULED: { label: 'Hearing', icon: CalendarIcon, color: '#D8BB7A', bg: 'rgba(198,161,91,0.12)', border: 'rgba(198,161,91,0.3)' },
  TASK_ASSIGNED:     { label: 'Task',    icon: CheckCircleIcon, color: '#34D399', bg: 'rgba(18,183,106,0.12)', border: 'rgba(18,183,106,0.3)' },
  CASE_ALERT:        { label: 'Case',    icon: BriefcaseIcon, color: '#60A5FA', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  DOCUMENT_UPLOADED: { label: 'Document',icon: FileIcon, color: '#C6A15B', bg: 'rgba(198,161,91,0.12)', border: 'rgba(198,161,91,0.3)' },
  DEADLINE_URGENT:   { label: 'Deadline',icon: AlertTriangleIcon, color: '#F87171', bg: 'rgba(240,68,56,0.12)', border: 'rgba(240,68,56,0.3)' },
  SYSTEM:            { label: 'System',  icon: BellIcon, color: '#8E95A5', bg: 'rgba(142,149,165,0.12)', border: 'rgba(142,149,165,0.3)' },
}

const PRIORITY_CONFIG = {
  URGENT:  { label: 'Urgent',  color: '#F87171', bg: 'rgba(240,68,56,0.15)', border: 'rgba(240,68,56,0.3)' },
  WARNING: { label: 'Warning', color: '#FBBF24', bg: 'rgba(247,144,9,0.15)', border: 'rgba(247,144,9,0.3)' },
  INFO:    { label: 'Info',    color: '#60A5FA', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  SUCCESS: { label: 'Success', color: '#34D399', bg: 'rgba(18,183,106,0.15)', border: 'rgba(18,183,106,0.3)' },
}

const formatTimestamp = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CreateNotificationModal({ isOpen, onClose, onCreated, cases, hearings }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('SYSTEM')
  const [priority, setPriority] = useState('INFO')
  const [relatedCaseId, setRelatedCaseId] = useState('')
  const [relatedHearingId, setRelatedHearingId] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  // Filter hearings dynamically if a case is selected
  const availableHearings = relatedCaseId
    ? hearings.filter((h) => String(h.case_id) === String(relatedCaseId))
    : hearings

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a notification title.')
      return
    }
    if (!message.trim()) {
      setError('Please enter a notification message.')
      return
    }

    setSubmitting(true)
    setError('')

    let reminderAt = null
    if (reminderDate) {
      const timePart = reminderTime || '09:00'
      const dt = new Date(`${reminderDate}T${timePart}:00`)
      if (!isNaN(dt.getTime())) {
        reminderAt = dt.toISOString()
      }
    }

    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        related_case_id: relatedCaseId ? parseInt(relatedCaseId, 10) : null,
        related_hearing_id: relatedHearingId ? parseInt(relatedHearingId, 10) : null,
        reminder_at: reminderAt,
      }
      const res = await apiClient.post('/notifications', payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      console.error('Failed to create notification:', err)
      setError(err.response?.data?.detail || 'Failed to create notification reminder.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="modal-3d-panel w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative"
      >
        {/* Top Corner Metallic Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="pedestal-3d w-8 h-8 rounded-xl flex items-center justify-center border border-[#C6A15B]/30"
              style={{
                color: '#D8BB7A',
              }}
            >
              <BellIcon className="w-4 h-4 text-[#D8BB7A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F1E8]">Create Notification & Reminder</h3>
              <p className="text-[11px] text-[#8E95A5]">Add a manual judicial notice, case reminder, or docket alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <AlertTriangleIcon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#D8BB7A] mb-1">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Case CF-2026-015"
              className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D8BB7A] mb-1">
              Message / Instructions <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Review the case documents and previous judgments before the upcoming hearing."
              className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1">Notification Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition cursor-pointer"
              >
                <option value="SYSTEM">General (System)</option>
                <option value="CASE_ALERT">Case Alert</option>
                <option value="HEARING_SCHEDULED">Hearing</option>
                <option value="TASK_ASSIGNED">Task</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition cursor-pointer"
              >
                <option value="INFO">Normal</option>
                <option value="WARNING">Important</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1">Related Case (Optional)</label>
              <select
                value={relatedCaseId}
                onChange={(e) => {
                  const newCaseId = e.target.value
                  setRelatedCaseId(newCaseId)
                  if (relatedHearingId) {
                    const h = hearings.find((item) => String(item.id) === String(relatedHearingId))
                    if (h && String(h.case_id) !== String(newCaseId)) {
                      setRelatedHearingId('')
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition cursor-pointer text-ellipsis overflow-hidden"
              >
                <option value="">None</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1">Related Hearing (Optional)</label>
              <select
                value={relatedHearingId}
                onChange={(e) => setRelatedHearingId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition cursor-pointer text-ellipsis overflow-hidden"
              >
                <option value="">None</option>
                {availableHearings.map((h) => {
                  const dateStr = h.scheduled_at
                    ? new Date(h.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''
                  return (
                    <option key={h.id} value={h.id}>
                      {h.case_number || 'Case'} — {h.hearing_type || 'Hearing'} {dateStr ? `(${dateStr})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1">Reminder Date (Optional)</label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1">Reminder Time (Optional)</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[#F4F1E8] bg-[#1E2228] border border-[#383D4B] focus:outline-none focus:border-[#C6A15B] transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202327]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 text-[#0E1015]" />
              <span>{submitting ? 'Creating...' : 'Create Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Modal & Auxiliary Data States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [cases, setCases] = useState([])
  const [hearings, setHearings] = useState([])

  // Filter States
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL', 'UNREAD', 'URGENT', 'HEARING', 'TASK', 'CASE'
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '', 'unread', 'read'

  // Action Loading States
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [actioningId, setActioningId] = useState(null)

  // Load Cases & Hearings for Create Modal
  const loadCasesAndHearings = useCallback(async () => {
    try {
      const [casesRes, hearingsRes] = await Promise.all([
        apiClient.get('/cases?limit=100'),
        apiClient.get('/hearings?limit=100'),
      ])
      setCases(casesRes.data || [])
      setHearings(hearingsRes.data || [])
    } catch (e) {
      console.warn('Could not preload cases/hearings:', e)
    }
  }, [])

  useEffect(() => {
    loadCasesAndHearings()
  }, [loadCasesAndHearings])

  const handleNotificationCreated = (newNotif) => {
    setNotifications((prev) => [newNotif, ...prev])
    setUnreadCount((prev) => prev + 1)
    showToast('Notification reminder created successfully.')
  }

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (statusFilter === 'unread') params.is_read = false
      if (statusFilter === 'read') params.is_read = true
      if (priorityFilter) params.priority = priorityFilter

      if (activeTab === 'UNREAD') params.is_read = false
      if (activeTab === 'URGENT') params.priority = 'URGENT'
      if (activeTab === 'HEARING') params.type = 'HEARING_SCHEDULED'
      if (activeTab === 'TASK') params.type = 'TASK_ASSIGNED'
      if (activeTab === 'CASE') params.type = 'CASE_ALERT'

      const [notifsRes, countRes] = await Promise.all([
        apiClient.get('/notifications', { params }),
        apiClient.get('/notifications/unread-count'),
      ])

      setNotifications(notifsRes.data || [])
      setUnreadCount(countRes.data?.unread_count || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Unable to load notification feed.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, statusFilter, priorityFilter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingAllRead(true)
    try {
      await apiClient.put('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      showToast('All notifications marked as read.')
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      showToast('Failed to update notifications.')
    } finally {
      setMarkingAllRead(false)
    }
  }

  // Mark single as read
  const handleMarkAsRead = async (item) => {
    if (item.is_read) return
    try {
      await apiClient.put(`/notifications/${item.id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  // Delete notification
  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation()
    setActioningId(id)
    try {
      await apiClient.delete(`/notifications/${id}`)
      const deletedItem = notifications.find((n) => n.id === id)
      if (deletedItem && !deletedItem.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      showToast('Notification dismissed.')
    } catch (err) {
      console.error('Failed to delete notification:', err)
      showToast('Failed to dismiss notification.')
    } finally {
      setActioningId(null)
    }
  }

  // Filter notifications by search term
  const filteredNotifications = notifications.filter((item) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      (item.title || '').toLowerCase().includes(term) ||
      (item.message || '').toLowerCase().includes(term)
    )
  })

  // Summary counts
  const totalCount = notifications.length
  const urgentCount = notifications.filter((n) => (n.priority || '').toUpperCase() === 'URGENT').length
  const hearingCount = notifications.filter((n) => (n.type || '').toUpperCase() === 'HEARING_SCHEDULED').length
  const taskCount = notifications.filter((n) => (n.type || '').toUpperCase() === 'TASK_ASSIGNED').length

  const hasActiveFilters = Boolean(search || priorityFilter || statusFilter || activeTab !== 'ALL')

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* ── 3D Command Header ── */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/30">
                  Judicial Intelligence & Alert Feed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
                Notifications & Chamber Alerts
              </h1>
              {unreadCount > 0 && (
                <span
                  className="pill-3d px-2.5 py-0.5 rounded-full text-xs font-bold text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/40"
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
              Real-time docket notifications, hearing milestones, and high-priority action alerts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (cases.length === 0) loadCasesAndHearings()
                setIsCreateModalOpen(true)
              }}
              className="btn-3d-gold flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 text-[#0E1015]" />
              <span>Create Notification</span>
            </button>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAllRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <CheckCircleIcon className="w-4 h-4 text-[#D8BB7A]" />
              {markingAllRead ? 'Marking All Read...' : 'Mark All as Read'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast Feedback ────────────────────────────────── */}
      {toastMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 animate-in slide-in-from-top duration-200 shadow-sm">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── KPI Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Total In View', value: totalCount, icon: BellIcon, color: '#D8BB7A', bg: 'rgba(198,161,91,0.12)' },
          { label: 'Unread Alerts', value: unreadCount, icon: ClockIcon, color: '#FBBF24', bg: 'rgba(247,144,9,0.12)' },
          { label: 'Urgent Priority', value: urgentCount, icon: AlertTriangleIcon, color: '#F87171', bg: 'rgba(240,68,56,0.12)' },
          { label: 'Hearings', value: hearingCount, icon: CalendarIcon, color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Tasks & Actions', value: taskCount, icon: CheckCircleIcon, color: '#34D399', bg: 'rgba(18,183,106,0.12)' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl flex items-center gap-3 shadow-sm"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#8E95A5]">{stat.label}</p>
              <p className="text-lg font-bold text-[#F4F1E8]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Tabs & Filter Toolbar ────────────────── */}
      <div
        className="p-4 rounded-2xl space-y-3.5 shadow-sm"
        style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
      >
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'URGENT', label: 'Urgent' },
            { id: 'HEARING', label: 'Hearings' },
            { id: 'TASK', label: 'Tasks' },
            { id: 'CASE', label: 'Cases' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C6A15B] text-[#0E1015] font-extrabold shadow-sm'
                    : 'text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5'
                }`}
                style={!isActive ? { backgroundColor: '#1E2228', border: '1px solid #383D4B' } : {}}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search & Filters */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t"
          style={{ borderColor: '#202327' }}
        >
          {/* Text Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A5]" />
            <input
              type="text"
              placeholder="Search notifications by title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            />
          </div>

          {/* Priority Dropdown */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
              <option value="SUCCESS">Success</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Statuses</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[#8E95A5]">
              Showing {filteredNotifications.length} notification{filteredNotifications.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => {
                setActiveTab('ALL')
                setSearch('')
                setPriorityFilter('')
                setStatusFilter('')
              }}
              className="text-[#D8BB7A] hover:underline font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Notification Feed Area ────────────────────────── */}
      {loading ? (
        <div
          className="p-12 text-center rounded-2xl space-y-3 shadow-sm"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
        >
          <div className="w-8 h-8 mx-auto border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8E95A5]">Loading notification feed...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-2xl bg-rose-950/40 border border-rose-800/40 space-y-3">
          <AlertTriangleIcon className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs font-semibold text-rose-300">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
          >
            Retry
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl space-y-3 shadow-sm"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
        >
          <BellIcon className="w-10 h-10 text-[#8E95A5] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[#F4F1E8]">No Notifications Found</h3>
          <p className="text-xs text-[#8E95A5] max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No notifications match your current filter criteria. Try resetting filters.'
              : 'You have no notifications in this category. All judicial alerts are up to date.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setActiveTab('ALL')
                setSearch('')
                setPriorityFilter('')
                setStatusFilter('')
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E95A5] hover:text-[#F4F1E8] transition cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((item) => {
            const typeMeta = TYPE_CONFIG[(item.type || 'SYSTEM').toUpperCase()] || TYPE_CONFIG.SYSTEM
            const priorityMeta = PRIORITY_CONFIG[(item.priority || 'INFO').toUpperCase()] || PRIORITY_CONFIG.INFO
            const TypeIcon = typeMeta.icon
            const isUnread = !item.is_read
            const isActioning = actioningId === item.id

            return (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item)}
                className={`card-3d-chassis card-3d-tilt relative rounded-2xl p-4.5 transition-all duration-200 group cursor-pointer shadow-md hover:translate-x-1 ${
                  isUnread ? 'border border-[#C6A15B]/50' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {/* Unread Left Indicator Bar */}
                {isUnread && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#C6A15B] shadow-[0_0_8px_rgba(198,161,91,0.6)]" />
                )}

                <div className="flex items-start gap-3.5">
                  {/* Category Type Icon */}
                  <div
                    className="pedestal-3d w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      color: typeMeta.color,
                    }}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </div>

                  {/* Notification Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-xs font-bold ${isUnread ? 'text-[#F4F1E8]' : 'text-[#8E95A5]'}`}>
                        {item.title}
                      </h4>

                      {/* Type Badge */}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          backgroundColor: typeMeta.bg,
                          color: typeMeta.color,
                          border: `1px solid ${typeMeta.border}`,
                        }}
                      >
                        {typeMeta.label}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: priorityMeta.bg,
                          color: priorityMeta.color,
                          border: `1px solid ${priorityMeta.border}`,
                        }}
                      >
                        {priorityMeta.label}
                      </span>

                      {/* Unread Pip */}
                      {isUnread && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'rgba(198,161,91,0.2)',
                            color: '#D8BB7A',
                            border: '1px solid rgba(198,161,91,0.35)',
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>

                    {/* Message content */}
                    <p className="text-xs leading-relaxed mt-1 text-[#8E95A5]">
                      {item.message}
                    </p>

                    {/* Related Metadata Badges: Case, Hearing, Reminder, Origin */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.case_number && (
                        <Link
                          to="/cases"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md transition hover:underline"
                          style={{
                            backgroundColor: 'rgba(96,165,250,0.12)',
                            color: '#93C5FD',
                            border: '1px solid rgba(96,165,250,0.25)',
                          }}
                        >
                          <BriefcaseIcon className="w-3 h-3 text-[#60A5FA]" />
                          <span>Case {item.case_number}</span>
                        </Link>
                      )}

                      {item.related_hearing_id && (
                        <Link
                          to="/hearings"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md transition hover:underline"
                          style={{
                            backgroundColor: 'rgba(198,161,91,0.12)',
                            color: '#D8BB7A',
                            border: '1px solid rgba(198,161,91,0.25)',
                          }}
                        >
                          <CalendarIcon className="w-3 h-3 text-[#C6A15B]" />
                          <span>Hearing #{item.related_hearing_id}</span>
                        </Link>
                      )}

                      {item.reminder_at && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: 'rgba(247,144,9,0.12)',
                            color: '#FBBF24',
                            border: '1px solid rgba(247,144,9,0.25)',
                          }}
                        >
                          <ClockIcon className="w-3 h-3 text-[#FBBF24]" />
                          <span>
                            Reminder:{' '}
                            {new Date(item.reminder_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      )}

                      {/* Origin Badge */}
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: item.reminder_at ? 'rgba(198,161,91,0.08)' : 'rgba(142,149,165,0.08)',
                          color: item.reminder_at ? '#D8BB7A' : '#777B80',
                          border: `1px solid ${item.reminder_at ? 'rgba(198,161,91,0.2)' : 'rgba(142,149,165,0.2)'}`,
                        }}
                      >
                        {item.reminder_at ? 'Manual Reminder' : 'System Alert'}
                      </span>
                    </div>

                    {/* Footer Row: Timestamp & Link Action */}
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t"
                      style={{ borderColor: '#202327' }}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8E95A5]">
                        <ClockIcon className="w-3.5 h-3.5 text-[#777B80]" />
                        <span>{formatTimestamp(item.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Direct Navigation Link if present */}
                        {item.link && (
                          <Link
                            to={item.link}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                            style={{
                              backgroundColor: '#1E2228',
                              border: '1px solid rgba(198,161,91,0.3)',
                              color: '#D8BB7A',
                            }}
                          >
                            <span>Open Item</span>
                            <ExternalLinkIcon className="w-3 h-3 text-[#D8BB7A]" />
                          </Link>
                        )}

                        {/* Mark as read toggle */}
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(item)
                            }}
                            className="text-[11px] font-semibold text-[#C6A15B] hover:text-[#D8BB7A] px-2 py-1 transition cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}

                        {/* Delete / Dismiss */}
                        <button
                          onClick={(e) => handleDeleteNotification(item.id, e)}
                          disabled={isActioning}
                          className="p-1.5 rounded-lg text-[#8E95A5] hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                          title="Dismiss notification"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Manual Notification Creation Modal */}
      <CreateNotificationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleNotificationCreated}
        cases={cases}
        hearings={hearings}
      />
    </div>
  )
}
