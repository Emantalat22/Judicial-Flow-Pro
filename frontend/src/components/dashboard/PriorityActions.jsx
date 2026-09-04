import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import { AlertIcon, ExternalLinkIcon, CheckCircleIcon, ClockIcon, BriefcaseIcon } from '../Icons'

const urgencyConfig = {
  URGENT: {
    bar:        '#B95353',
    badge:      { bg: 'rgba(185,83,83,0.15)', color: '#E08080', border: '#B95353' },
    iconBg:     'rgba(185,83,83,0.15)',
    iconColor:  '#E08080',
    titleColor: '#E08080',
    btnColor:   '#E08080',
    btnBorder:  '#B95353',
    btnHoverBg: 'rgba(185,83,83,0.2)',
  },
  HIGH: {
    bar:        '#C69A3A',
    badge:      { bg: 'rgba(198,154,58,0.15)', color: '#E0B55A', border: '#C69A3A' },
    iconBg:     'rgba(198,154,58,0.15)',
    iconColor:  '#E0B55A',
    titleColor: '#E0B55A',
    btnColor:   '#E0B55A',
    btnBorder:  '#C69A3A',
    btnHoverBg: 'rgba(198,154,58,0.2)',
  },
  MEDIUM: {
    bar:        '#C6A15B',
    badge:      { bg: 'rgba(198,161,91,0.12)', color: '#D8BB7A', border: '#8F713E' },
    iconBg:     'rgba(198,161,91,0.12)',
    iconColor:  '#D8BB7A',
    titleColor: '#D8BB7A',
    btnColor:   '#D8BB7A',
    btnBorder:  '#8F713E',
    btnHoverBg: 'rgba(198,161,91,0.2)',
  },
  LOW: {
    bar:        '#3FA37C',
    badge:      { bg: 'rgba(63,163,124,0.12)', color: '#5AC49A', border: '#3FA37C' },
    iconBg:     'rgba(63,163,124,0.12)',
    iconColor:  '#5AC49A',
    titleColor: '#5AC49A',
    btnColor:   '#5AC49A',
    btnBorder:  '#3FA37C',
    btnHoverBg: 'rgba(63,163,124,0.2)',
  },
}

const formatDueDate = (isoStr) => {
  if (!isoStr) return null
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PriorityActions({ onTaskCompleted }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)
  const [completionToast, setCompletionToast] = useState(null)

  const fetchPriorityTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get('/tasks')
      // Filter out completed/cancelled tasks and sort by priority & due date
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      const activeTasks = (data || [])
        .filter((t) => (t.status || '').toUpperCase() !== 'COMPLETED' && (t.status || '').toUpperCase() !== 'CANCELLED')
        .sort((a, b) => {
          const pA = priorityOrder[(a.priority || 'MEDIUM').toUpperCase()] ?? 2
          const pB = priorityOrder[(b.priority || 'MEDIUM').toUpperCase()] ?? 2
          if (pA !== pB) return pA - pB
          if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date)
          if (a.due_date) return -1
          if (b.due_date) return 1
          return new Date(b.created_at) - new Date(a.created_at)
        })
        .slice(0, 5)

      setTasks(activeTasks)
    } catch (err) {
      console.error('Failed to load priority actions:', err)
      setError('Unable to load priority actions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPriorityTasks()
  }, [fetchPriorityTasks])

  const handleCompleteTask = async (task) => {
    setCompletingId(task.id)
    try {
      await apiClient.put(`/tasks/${task.id}`, { status: 'COMPLETED' })
      setCompletionToast(`Completed "${task.title}"`)
      setTimeout(() => setCompletionToast(null), 3000)
      // Remove from local list immediately
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      if (onTaskCompleted) {
        onTaskCompleted()
      }
    } catch (err) {
      console.error('Failed to complete task:', err)
    } finally {
      setCompletingId(null)
    }
  }

  const urgentCount = tasks.filter(
    (t) => (t.priority || '').toUpperCase() === 'URGENT' || (t.priority || '').toUpperCase() === 'HIGH'
  ).length

  return (
    <div
      className="card-3d-chassis card-3d-tilt rounded-2xl overflow-hidden shadow-lg relative"
    >
      {/* Top Corner Metallic Gold Inlay Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

      {/* Header */}
      <div
        className="px-6 py-4.5 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
      >
        <div>
          <h3 className="text-sm font-bold text-[#F4F1E8]">Priority Actions</h3>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            {loading ? 'Checking pending items…' : `${tasks.length} item${tasks.length === 1 ? '' : 's'} requiring attention`}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
            urgentCount > 0
              ? 'bg-red-500/15 text-[#E08080] border border-red-500/30'
              : 'bg-emerald-500/15 text-[#5AC49A] border border-emerald-500/30'
          }`}
        >
          {urgentCount > 0 ? (
            <>
              <AlertIcon className="w-3.5 h-3.5 text-[#E08080]" />
              {urgentCount} urgent
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-3.5 h-3.5 text-[#5AC49A]" />
              All clear
            </>
          )}
        </span>
      </div>

      {/* Completion feedback banner */}
      {completionToast && (
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-[#5AC49A] text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircleIcon className="w-3.5 h-3.5 text-[#5AC49A] shrink-0" />
          <span className="truncate">{completionToast}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-6 h-6 mx-auto border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8E95A5]">Loading actionable tasks...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-2">
          <p className="text-xs text-[#B95353]">{error}</p>
          <button
            onClick={fetchPriorityTasks}
            className="text-xs text-[#C6A15B] hover:underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <CheckCircleIcon className="w-8 h-8 text-[#5AC49A] mx-auto opacity-80" />
          <p className="text-sm font-bold text-[#F4F1E8]">All caught up!</p>
          <p className="text-xs text-[#8E95A5]">No urgent pending tasks assigned to your chambers.</p>
        </div>
      ) : (
        <div className="p-3.5">
          <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)] divide-y divide-[#1D212B]">
          {tasks.map((task) => {
            const u = urgencyConfig[(task.priority || 'MEDIUM').toUpperCase()] || urgencyConfig.MEDIUM
            const formattedDate = formatDueDate(task.due_date)
            const isOverdue = task.due_date && new Date(task.due_date) < new Date()
            const isCompleting = completingId === task.id

            return (
              <div
                key={task.id}
                className="flex items-start gap-3.5 px-5 py-4 transition-all duration-150 hover:bg-[#1E2228]/70 hover:translate-x-0.5 group"
              >
                {/* Left urgency bar */}
                <div
                  className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: u.bar }}
                />

                {/* Quick Checkmark Button */}
                <button
                  onClick={() => handleCompleteTask(task)}
                  disabled={isCompleting}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                    isCompleting
                      ? 'border-[#C6A15B] bg-[#C6A15B]/10'
                      : 'border-[#383D4B] hover:border-[#5AC49A] hover:bg-emerald-500/10 text-[#777B80] hover:text-[#5AC49A]'
                  }`}
                  title="Mark as Completed"
                >
                  {isCompleting ? (
                    <div className="w-3 h-3 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-[#F4F1E8] truncate">
                      {task.title}
                    </p>
                    <span
                      className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: u.badge.bg,
                        color: u.badge.color,
                        border: `1px solid ${u.badge.border}`,
                      }}
                    >
                      {task.priority || 'MEDIUM'}
                    </span>
                  </div>

                  {/* Linked Case Chip */}
                  {task.case_id && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Link
                        to={`/cases/${task.case_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#D8BB7A] hover:underline"
                      >
                        <BriefcaseIcon className="w-3 h-3 text-[#C6A15B]" />
                        {task.case_number || `Case #${task.case_id}`}
                        {task.case_title && (
                          <span className="font-normal text-[#8E95A5] truncate max-w-[160px]">
                            — {task.case_title}
                          </span>
                        )}
                      </Link>
                    </div>
                  )}

                  {/* Task description */}
                  {task.description && (
                    <p className="text-xs text-[#8E95A5] line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                  )}

                  {/* Due date */}
                  {formattedDate && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <ClockIcon className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E08080]' : 'text-[#8E95A5]'}`} />
                      <span className={`text-xs ${isOverdue ? 'text-[#E08080] font-bold' : 'text-[#8E95A5]'}`}>
                        {isOverdue ? `Overdue (${formattedDate})` : `Due ${formattedDate}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Open Action Button */}
                <Link
                  to={task.case_id ? `/cases/${task.case_id}` : '/tasks'}
                  className="shrink-0 text-xs font-bold rounded-lg px-2.5 py-1 transition-all flex items-center gap-1 opacity-90 group-hover:opacity-100 cursor-pointer shadow-xs"
                  style={{
                    color: u.btnColor,
                    border: `1px solid ${u.btnBorder}`,
                    backgroundColor: u.badge.bg,
                  }}
                  title={task.case_id ? 'Open Case' : 'View Task'}
                >
                  <span>{task.case_id ? 'Case' : 'Task'}</span>
                  <ExternalLinkIcon className="w-2.5 h-2.5" />
                </Link>
              </div>
            )
          })}
          </div>
        </div>
      )}
    </div>
  )
}
