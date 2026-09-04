import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  XIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
} from '../components/Icons'

const initialForm = {
  title: '',
  description: '',
  case_id: '',
  assigned_to: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  due_date: '',
}

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgent', bg: 'rgba(240,68,56,0.15)', text: '#F87171', border: 'rgba(240,68,56,0.3)' },
  HIGH:   { label: 'High',   bg: 'rgba(247,144,9,0.15)', text: '#FBBF24', border: 'rgba(247,144,9,0.3)' },
  MEDIUM: { label: 'Medium', bg: 'rgba(198,161,91,0.15)', text: '#D8BB7A', border: 'rgba(198,161,91,0.3)' },
  LOW:    { label: 'Low',    bg: 'rgba(18,183,106,0.15)', text: '#34D399', border: 'rgba(18,183,106,0.3)' },
}

const STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     bg: 'rgba(247,144,9,0.15)', text: '#FBBF24', border: 'rgba(247,144,9,0.3)' },
  IN_PROGRESS: { label: 'In Progress', bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', border: 'rgba(59,130,246,0.3)' },
  COMPLETED:   { label: 'Completed',   bg: 'rgba(18,183,106,0.15)', text: '#34D399', border: 'rgba(18,183,106,0.3)' },
  CANCELLED:   { label: 'Cancelled',   bg: 'rgba(142,149,165,0.15)', text: '#8E95A5', border: 'rgba(142,149,165,0.3)' },
}

const formatDateTimeForInput = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const formatDisplayDate = (isoStr) => {
  if (!isoStr) return 'No due date'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return 'Invalid date'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [cases, setCases] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Filter States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [caseFilter, setCaseFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete Confirmation Modal
  const [deletingTask, setDeletingTask] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Fetch Tasks from API
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (caseFilter) params.case_id = parseInt(caseFilter, 10)
      if (assigneeFilter) params.assigned_to = parseInt(assigneeFilter, 10)

      const { data } = await apiClient.get('/tasks', { params })
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError(err.response?.data?.detail || 'Failed to load tasks. Please verify your connection.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, priorityFilter, caseFilter, assigneeFilter])

  // Fetch Cases and Users for Dropdowns
  useEffect(() => {
    async function loadSelectOptions() {
      try {
        const [casesRes, usersRes] = await Promise.all([
          apiClient.get('/cases'),
          apiClient.get('/users/list').catch(() => ({ data: [] })),
        ])
        setCases(casesRes.data || [])
        setUsers(usersRes.data || [])
      } catch (err) {
        console.error('Failed to load form options:', err)
      }
    }
    loadSelectOptions()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchTasks])

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setPriorityFilter('')
    setCaseFilter('')
    setAssigneeFilter('')
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData(initialForm)
    setFormError(null)
    setShowModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (task) => {
    setEditingId(task.id)
    setFormData({
      title: task.title || '',
      description: task.description || '',
      case_id: task.case_id ? String(task.case_id) : '',
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'PENDING',
      due_date: formatDateTimeForInput(task.due_date),
    })
    setFormError(null)
    setShowModal(true)
  }

  // Save Task Form (Create / Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        case_id: formData.case_id ? parseInt(formData.case_id, 10) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      }

      if (editingId) {
        await apiClient.put(`/tasks/${editingId}`, payload)
        setSuccessMessage('Task updated successfully.')
      } else {
        await apiClient.post('/tasks', payload)
        setSuccessMessage('Task created successfully.')
      }

      setShowModal(false)
      fetchTasks()
      setTimeout(() => setSuccessMessage(''), 3500)
    } catch (err) {
      console.error('Task submission error:', err)
      setFormError(err.response?.data?.detail || 'Failed to save task. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Quick Status Toggle
  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    try {
      await apiClient.put(`/tasks/${task.id}`, { status: nextStatus })
      fetchTasks()
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  // Delete Task
  const handleConfirmDelete = async () => {
    if (!deletingTask) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiClient.delete(`/tasks/${deletingTask.id}`)
      setDeletingTask(null)
      setSuccessMessage('Task removed from judicial records.')
      fetchTasks()
      setTimeout(() => setSuccessMessage(''), 3500)
    } catch (err) {
      console.error('Failed to delete task:', err)
      setDeleteError(err.response?.data?.detail || 'Failed to delete task.')
    } finally {
      setDeleting(false)
    }
  }

  // Summary Metrics
  const totalCount = tasks.length
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length
  const urgentCount = tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length

  const hasActiveFilters = Boolean(search || statusFilter || priorityFilter || caseFilter || assigneeFilter)

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* ── 3D Command Header ── */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/30">
                Judicial Workflow & Action Checklist
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
              Tasks & Action Items
            </h1>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
              Assign, prioritize, and track chamber proceedings, orders, and judicial deadlines.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn-3d-gold flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 text-[#0E1015]" />
            <span>Create Action Item</span>
          </button>
        </div>
      </div>

      {/* ── Success Toast ─────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl text-xs font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 animate-in slide-in-from-top duration-200 shadow-sm">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── 3D KPI Telemetry Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Total Tasks', value: totalCount, icon: ClockIcon, color: '#D8BB7A', bg: 'rgba(198,161,91,0.12)' },
          { label: 'In Progress', value: inProgressCount, icon: ClockIcon, color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Pending Review', value: pendingCount, icon: AlertCircleIcon, color: '#FBBF24', bg: 'rgba(247,144,9,0.12)' },
          { label: 'Urgent / High', value: urgentCount, icon: AlertTriangleIcon, color: '#F87171', bg: 'rgba(240,68,56,0.12)' },
          { label: 'Completed', value: completedCount, icon: CheckCircleIcon, color: '#34D399', bg: 'rgba(18,183,106,0.12)' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="card-3d-lift rounded-2xl p-3.5 flex items-center gap-3 shadow-md group cursor-default"
          >
            <div
              className="pedestal-3d w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ color: stat.color }}
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

      {/* ── Filters & Search Toolbar ──────────────────────── */}
      <div
        className="card-3d-chassis rounded-2xl p-4.5 space-y-3 shadow-md relative"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A5]" />
            <input
              type="text"
              placeholder="Search title, context, case, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Case Filter */}
          <div>
            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Cases</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title?.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters bar */}
        {hasActiveFilters && (
          <div
            className="flex items-center justify-between pt-2 border-t text-xs"
            style={{ borderColor: '#202327' }}
          >
            <span className="text-[#8E95A5]">
              Showing filtered results ({tasks.length} matching)
            </span>
            <button
              onClick={handleClearFilters}
              className="text-[#D8BB7A] hover:underline font-semibold cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content Area ─────────────────────────────── */}
      {loading ? (
        <div
          className="p-12 text-center rounded-2xl space-y-3 shadow-sm"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
        >
          <div className="w-8 h-8 mx-auto border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8E95A5]">Loading action items from judicial database...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-2xl bg-rose-950/40 border border-rose-800/40 space-y-3">
          <AlertTriangleIcon className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs font-semibold text-rose-300">{error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
          >
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl space-y-3 shadow-sm"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
        >
          <CheckCircleIcon className="w-10 h-10 text-[#8E95A5] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[#F4F1E8]">No Tasks Found</h3>
          <p className="text-xs text-[#8E95A5] max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No tasks match the selected filter criteria. Try clearing filters or searching for different terms.'
              : 'There are currently no active judicial tasks logged in the system.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E95A5] hover:text-[#F4F1E8] transition cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition shadow-md cursor-pointer font-extrabold"
            >
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div
          className="card-3d-chassis rounded-2xl overflow-hidden shadow-lg relative"
        >
          {/* Top Corner Metallic Gold Inlay Brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

          <div className="p-3.5">
            <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ backgroundColor: 'rgba(17, 19, 26, 0.95)', borderColor: 'rgba(46, 52, 66, 0.85)', color: '#8E95A5' }}
                    >
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider w-12 text-center text-[11px]">Status</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Task & Details</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Linked Case</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Assignee</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Priority</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-[11px]">Due Date</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#202327' }}>
                {tasks.map((task) => {
                  const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
                  const statusMeta = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING
                  const isCompleted = task.status === 'COMPLETED'
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-[#1A1E28] transition-colors group"
                    >
                      {/* Checkbox toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-[#383D4B] hover:border-emerald-500 text-transparent'
                          }`}
                          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4 min-w-[200px]">
                        <p className={`font-bold text-xs ${isCompleted ? 'line-through text-[#777B80]' : 'text-[#F4F1E8]'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-[#8E95A5] line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Linked Case */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {task.case_id ? (
                          <Link
                            to={`/cases/${task.case_id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors"
                            style={{
                              backgroundColor: '#1E2228',
                              border: '1px solid rgba(198,161,91,0.3)',
                              color: '#D8BB7A',
                            }}
                          >
                            <BriefcaseIcon className="w-3 h-3 text-[#D8BB7A]" />
                            <span>{task.case_number || `Case #${task.case_id}`}</span>
                          </Link>
                        ) : (
                          <span className="text-[#777B80] italic text-[11px]">Unlinked</span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {task.assignee_name ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]"
                              style={{
                                backgroundColor: 'rgba(198,161,91,0.15)',
                                color: '#D8BB7A',
                                border: '1px solid rgba(198,161,91,0.25)',
                              }}
                            >
                              {task.assignee_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#F4F1E8] truncate">{task.assignee_name}</p>
                              {task.assignee_role && (
                                <p className="text-[10px] text-[#8E95A5]">{task.assignee_role}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#777B80] italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Priority Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border uppercase tracking-wider"
                          style={{
                            backgroundColor: priorityMeta.bg,
                            color: priorityMeta.text,
                            borderColor: priorityMeta.border,
                          }}
                        >
                          {priorityMeta.label}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-400' : 'text-[#8E95A5]'}`} />
                          <span className={`text-[11px] font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-[#8E95A5]'}`}>
                            {formatDisplayDate(task.due_date)}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-400 block mt-0.5">
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#D8BB7A] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            title="Edit Task"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTask(task)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-rose-400 hover:border-rose-700/50 hover:bg-rose-950/30 transition cursor-pointer"
                            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            title="Delete Task"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="modal-3d-panel w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative"
          >
            {/* Top Corner Metallic Gold Inlay Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

            {/* Modal Header */}
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
            >
              <h2 className="text-base font-bold text-[#F4F1E8]">
                {editingId ? 'Edit Task' : 'Create Judicial Task'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8E95A5] hover:text-[#F4F1E8] p-1 rounded-lg transition"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-800/40 text-rose-300">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                  Task Title <span className="text-[#E08080]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review plaintiff's motion for summary judgment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={3}
                  placeholder="Add specific instructions, reference points, or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              {/* Linked Case & Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                    Linked Case
                  </label>
                  <select
                    value={formData.case_id}
                    onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  >
                    <option value="">-- Unlinked / General --</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_number} — {c.title?.slice(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                    Assigned Personnel
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority, Status, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-3 pt-3 border-t"
                style={{ borderColor: '#202327' }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition disabled:opacity-50 shadow-md cursor-pointer font-extrabold"
                >
                  {submitting ? 'Saving…' : editingId ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-950/40 text-rose-400 shrink-0 border border-rose-800/40">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F4F1E8]">
                  Delete Task?
                </h3>
                <p className="text-xs text-[#8E95A5]">
                  This action cannot be undone. The task record will be permanently deleted.
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl text-xs"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <p className="font-bold text-[#F4F1E8]">{deletingTask.title}</p>
              {deletingTask.case_number && (
                <p className="text-[#D8BB7A] font-mono mt-1">Case: {deletingTask.case_number}</p>
              )}
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-700 hover:bg-rose-600 transition disabled:opacity-50 cursor-pointer shadow-sm font-bold"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
