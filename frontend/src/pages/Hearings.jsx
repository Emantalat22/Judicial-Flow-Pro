import { useEffect, useState } from "react"
import apiClient from "../api/client"
import Badge from "../components/ui/Badge"
import {
  PlusIcon,
  XIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from "../components/Icons"

const initialFormState = {
  case_id: "",
  hearing_type: "Preliminary Hearing",
  scheduled_at: "",
  judge: "",
  location: "",
  status: "SCHEDULED",
  notes: "",
  outcome: "",
}

const formatForDateTimeInput = (isoStr) => {
  if (!isoStr) return ""
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function Hearings() {
  const [hearings, setHearings] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // View Toggle: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState("list")

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [timeFilter, setTimeFilter] = useState("All Hearings")

  // Schedule / Edit Modal & Form State
  const [showModal, setShowModal] = useState(false)
  const [editingHearingId, setEditingHearingId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Delete Confirmation Modal State
  const [deletingHearing, setDeletingHearing] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const fetchHearings = async () => {
    try {
      setLoading(true)
      setError("")

      const { data } = await apiClient.get("/hearings")
      setHearings(data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || "Unable to load hearings. Please make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const fetchCases = async () => {
    try {
      const { data } = await apiClient.get("/cases")
      setCases(data)
    } catch (err) {
      console.error("Failed to load cases for selector:", err)
    }
  }

  useEffect(() => {
    fetchHearings()
    fetchCases()
  }, [])

  const openCreateModal = (defaultDate = null) => {
    setEditingHearingId(null)
    if (defaultDate) {
      const d = new Date(defaultDate)
      d.setHours(9, 30, 0, 0)
      setFormData({
        ...initialFormState,
        scheduled_at: formatForDateTimeInput(d.toISOString()),
      })
    } else {
      setFormData(initialFormState)
    }
    setFormError("")
    setShowModal(true)
  }

  const openEditModal = (hearing) => {
    setEditingHearingId(hearing.id)
    setFormData({
      case_id: hearing.case_id ? String(hearing.case_id) : "",
      hearing_type: hearing.hearing_type || "Preliminary Hearing",
      scheduled_at: formatForDateTimeInput(hearing.scheduled_at),
      judge: hearing.judge || "",
      location: hearing.location || "",
      status: hearing.status || "SCHEDULED",
      notes: hearing.notes || "",
      outcome: hearing.outcome || "",
    })
    setFormError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingHearingId(null)
    setFormData(initialFormState)
    setFormError("")
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitHearing = async (e) => {
    e.preventDefault()
    setFormError("")

    if (!formData.case_id) {
      setFormError("Please select an associated case.")
      return
    }
    if (!formData.scheduled_at) {
      setFormError("Please enter a valid scheduled date & time.")
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        case_id: parseInt(formData.case_id, 10),
        hearing_type: formData.hearing_type,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        judge: formData.judge || null,
        location: formData.location || null,
        status: formData.status,
        notes: formData.notes || null,
        outcome: formData.outcome || null,
      }

      if (editingHearingId) {
        await apiClient.put(`/hearings/${editingHearingId}`, payload)
        setSuccessMessage("Hearing updated successfully.")
      } else {
        await apiClient.post("/hearings", payload)
        setSuccessMessage("Hearing scheduled successfully.")
      }

      closeModal()
      await fetchHearings()

      setTimeout(() => {
        setSuccessMessage("")
      }, 4000)
    } catch (err) {
      console.error("Hearing submission error:", err)
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setFormError(detail.map((d) => d.msg || d.message).join(", "))
      } else {
        setFormError(detail || "Failed to save hearing. Please check the inputs.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const promptDeleteHearing = (hearing) => {
    setDeletingHearing(hearing)
    setDeleteError("")
  }

  const closeDeleteModal = () => {
    setDeletingHearing(null)
    setDeleteError("")
  }

  const confirmDeleteHearing = async () => {
    if (!deletingHearing) return

    try {
      setDeleting(true)
      setDeleteError("")

      await apiClient.delete(`/hearings/${deletingHearing.id}`)

      setSuccessMessage("Hearing deleted successfully.")
      closeDeleteModal()
      await fetchHearings()

      setTimeout(() => {
        setSuccessMessage("")
      }, 4000)
    } catch (err) {
      console.error("Failed to delete hearing:", err)
      setDeleteError(err.response?.data?.detail || "Could not delete hearing. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  // Generate Calendar Days (Monday - Sunday Grid)
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({ date: d, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i)
      days.push({ date: d, isCurrentMonth: true })
    }

    // Trailing days from next month to complete standard grid
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i)
        days.push({ date: d, isCurrentMonth: false })
      }
    }

    return days
  }

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase()
    switch (s) {
      case "SCHEDULED":
      case "CONFIRMED":
        return <Badge variant="confirmed" />
      case "COMPLETED":
      case "CLOSED":
        return <Badge variant="closed" />
      case "CANCELLED":
        return <Badge variant="cancelled" />
      case "PENDING":
        return <Badge variant="pending" />
      default:
        return <Badge variant="pending" />
    }
  }

  const formatDate = (date) => {
    if (!date) return "—"
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  // Filtered hearings
  const filteredHearings = hearings.filter((h) => {
    if (search.trim()) {
      const term = search.toLowerCase()
      const matchNumber = (h.case_number || "").toLowerCase().includes(term)
      const matchTitle = (h.case_title || "").toLowerCase().includes(term)
      const matchJudge = (h.judge || "").toLowerCase().includes(term)
      const matchLocation = (h.location || "").toLowerCase().includes(term)
      const matchType = (h.hearing_type || "").toLowerCase().includes(term)
      const matchNotes = (h.notes || "").toLowerCase().includes(term)
      const matchOutcome = (h.outcome || "").toLowerCase().includes(term)
      if (!matchNumber && !matchTitle && !matchJudge && !matchLocation && !matchType && !matchNotes && !matchOutcome) {
        return false
      }
    }

    if (statusFilter !== "All Statuses") {
      if ((h.status || "").toUpperCase() !== statusFilter.toUpperCase()) {
        return false
      }
    }

    if (timeFilter !== "All Hearings" && h.scheduled_at) {
      const hDate = new Date(h.scheduled_at)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      if (timeFilter === "Today") {
        if (hDate < todayStart || hDate > todayEnd) return false
      } else if (timeFilter === "Upcoming") {
        if (hDate < todayStart) return false
      } else if (timeFilter === "Past") {
        if (hDate >= todayStart) return false
      }
    }

    return true
  })

  // Get hearings for a specific calendar cell
  const getHearingsForDate = (date) => {
    const y = date.getFullYear()
    const m = date.getMonth()
    const d = date.getDate()

    return filteredHearings
      .filter((h) => {
        if (!h.scheduled_at) return false
        const hDate = new Date(h.scheduled_at)
        return (
          hDate.getFullYear() === y &&
          hDate.getMonth() === m &&
          hDate.getDate() === d
        )
      })
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  }

  const calendarDays = getCalendarDays()
  const todayDateStr = new Date().toDateString()

  // Hearings belonging to the currently selected calendar month
  const currentMonthHearings = filteredHearings.filter((h) => {
    if (!h.scheduled_at) return false
    const hDate = new Date(h.scheduled_at)
    return (
      hDate.getFullYear() === currentMonth.getFullYear() &&
      hDate.getMonth() === currentMonth.getMonth()
    )
  })

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
                Judicial Docket Calendar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
              Hearings & Courtroom Schedule
            </h1>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
              Synchronized docket appearances, chambers proceedings, and evidentiary hearings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div
              className="recessed-well p-1 rounded-xl flex items-center gap-1 shadow-inner"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-[#C6A15B] text-[#0E1015] shadow-xs"
                    : "text-[#8E95A5] hover:text-[#F4F1E8]"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-[#C6A15B] text-[#0E1015] shadow-xs"
                    : "text-[#8E95A5] hover:text-[#F4F1E8]"
                }`}
              >
                Calendar
              </button>
            </div>

            {/* Schedule Hearing Button */}
            <button
              onClick={() => openCreateModal()}
              className="btn-3d-gold flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 text-[#0E1015]" />
              <span>Schedule Hearing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 animate-in slide-in-from-top duration-200 shadow-sm">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div
        className="card-3d-chassis rounded-2xl p-4.5 shadow-md relative"
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search hearings by case, judge, courtroom, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-3d flex-1 min-w-[240px] px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-3d px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8]"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="PENDING">PENDING</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="input-3d px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8]"
          >
            <option value="All Hearings">All Hearings</option>
            <option value="Today">Today</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Past">Past</option>
          </select>

          {(search || statusFilter !== "All Statuses" || timeFilter !== "All Hearings") && (
            <button
              onClick={() => {
                setSearch("")
                setStatusFilter("All Statuses")
                setTimeFilter("All Hearings")
              }}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl text-[#8E95A5] hover:text-[#F4F1E8] transition cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* VIEW: LIST (3D Table Console) */}
      {viewMode === "list" && (
        <div
          className="card-3d-chassis rounded-2xl overflow-hidden shadow-lg relative"
        >
          {/* Top Corner Metallic Gold Inlay Brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

          <div className="p-3.5">
            <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ backgroundColor: 'rgba(17, 19, 26, 0.95)', borderColor: 'rgba(46, 52, 66, 0.85)' }}
                    >
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Date & Time
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Case
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Hearing Type
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Judge
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Courtroom
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: '#202327' }}>
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-xs text-[#8E95A5]">
                      Loading hearings...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-xs text-rose-300">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && filteredHearings.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-xs text-[#8E95A5]">
                      {hearings.length === 0
                        ? 'No hearings scheduled yet. Click "Schedule Hearing" to add one.'
                        : "No hearings matched the selected filters."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  filteredHearings.map((hearing) => (
                    <tr
                      key={hearing.id}
                      className="transition-all duration-150 hover:bg-[#1A1E28] hover:translate-x-0.5 group"
                    >
                      <td className="px-5 py-4 text-xs font-semibold text-[#F4F1E8] whitespace-nowrap">
                        {formatDate(hearing.scheduled_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-[#D8BB7A]">
                          {hearing.case_number || "—"}
                        </div>
                        <div className="text-xs text-[#8E95A5] mt-0.5 max-w-xs truncate">
                          {hearing.case_title || "Untitled Case"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-[#F4F1E8]">
                        {hearing.hearing_type || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#8E95A5]">
                        {hearing.judge || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#8E95A5]">
                        {hearing.location || "—"}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        {getStatusBadge(hearing.status)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(hearing)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#D8BB7A] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            title="Edit Hearing"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => promptDeleteHearing(hearing)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-rose-400 hover:border-rose-700/50 hover:bg-rose-950/30 transition cursor-pointer"
                            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            title="Delete Hearing"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CALENDAR */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          {/* Calendar Month Navigation Header */}
          <div
            className="card-3d-chassis rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md relative"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-[#F4F1E8]">
                {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
              </h3>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: 'rgba(198,161,91,0.12)',
                  color: '#C6A15B',
                  border: '1px solid rgba(198,161,91,0.3)',
                }}
              >
                {currentMonthHearings.length} {currentMonthHearings.length === 1 ? "Hearing" : "Hearings"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                title="Previous Month"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                title="Next Month"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div
            className="card-3d-chassis rounded-2xl overflow-hidden shadow-lg relative"
          >
            {/* Top Corner Metallic Gold Inlay Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {/* Weekday Column Headers */}
                <div
                  className="grid grid-cols-7 text-center font-bold text-[11px] uppercase tracking-wider py-3 border-b"
                  style={{ backgroundColor: '#111316', borderColor: '#202327', color: '#8E95A5' }}
                >
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Cells Grid */}
                <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: '#202327' }}>
                  {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                    const dayHearings = getHearingsForDate(date)
                    const isToday = date.toDateString() === todayDateStr

                    return (
                      <div
                        key={idx}
                        onClick={() => openCreateModal(date)}
                        className={`min-h-[115px] p-2 flex flex-col transition-all duration-200 group cursor-pointer ${
                          isCurrentMonth
                            ? isToday
                              ? "bg-[rgba(198,161,91,0.09)] ring-1 ring-inset ring-[#C6A15B]/60 shadow-[0_0_12px_rgba(198,161,91,0.12)]"
                              : "bg-[#161922] hover:bg-white/[0.03]"
                            : "bg-[#111316]/50 hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                              isToday
                                ? "bg-[#C6A15B] text-[#0E1015] font-extrabold shadow-sm"
                                : isCurrentMonth
                                ? "text-[#F4F1E8]"
                                : "text-[#777B80]"
                            }`}
                          >
                            {date.getDate()}
                          </span>

                          {dayHearings.length > 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: 'rgba(198,161,91,0.15)',
                                color: '#D8BB7A',
                              }}
                            >
                              {dayHearings.length}
                            </span>
                          )}
                        </div>

                        {/* Hearing Items */}
                        <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[105px]">
                          {dayHearings.map((h) => {
                            const timeStr = new Date(h.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })

                            return (
                              <div
                                key={h.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditModal(h)
                                }}
                                className="px-2 py-1 rounded-md text-xs cursor-pointer transition-all duration-200 shadow-sm flex flex-col gap-0.5 hover:-translate-y-0.5 hover:border-[#C6A15B]/50 hover:shadow-md active:translate-y-0"
                                style={{
                                  backgroundColor: '#1E2228',
                                  border: '1px solid rgba(198,161,91,0.25)',
                                }}
                                title={`${h.case_number} - ${h.case_title || "Case"}\nType: ${
                                  h.hearing_type || "Hearing"
                                }\nTime: ${timeStr}\nStatus: ${h.status}\nClick to Edit / Reschedule`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold truncate text-[#D8BB7A]">
                                    {h.case_number || "—"}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[#F4F1E8] shrink-0">
                                    {timeStr}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-[#8E95A5]">
                                  <span className="truncate max-w-[90px]">
                                    {h.hearing_type || "Hearing"}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Edit Hearing Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="modal-3d-panel p-6 sm:p-7 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative"
          >
            {/* Top Corner Metallic Gold Inlay Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

            {/* Modal Header */}
            <div
              className="flex items-center justify-between pb-4 mb-4 border-b"
              style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
            >
              <div>
                <h3 className="text-base font-bold text-[#F4F1E8]">
                  {editingHearingId ? "Edit / Reschedule Hearing" : "Schedule Hearing"}
                </h3>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  {editingHearingId
                    ? "Modify appearance schedule, courtroom, judge, status, or record outcome"
                    : "Select a case and set the hearing schedule and courtroom details"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-800/40 text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitHearing} className="space-y-4">
              {/* Case Select */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                  Associated Case <span className="text-[#E08080]">*</span>
                </label>
                <select
                  name="case_id"
                  value={formData.case_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  <option value="">-- Choose a Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hearing Type & Scheduled At Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                    Hearing Type <span className="text-[#E08080]">*</span>
                  </label>
                  <input
                    type="text"
                    name="hearing_type"
                    value={formData.hearing_type}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Motion Hearing, Arraignment"
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                    Date & Time <span className="text-[#E08080]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_at"
                    value={formData.scheduled_at}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>
              </div>

              {/* Judge & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                    Presiding Judge
                  </label>
                  <input
                    type="text"
                    name="judge"
                    value={formData.judge}
                    onChange={handleInputChange}
                    placeholder="e.g. Hon. Maria Chen"
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                    Courtroom / Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Courtroom 3A"
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                  Hearing Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                  Pre-Hearing Notes / Agenda
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Optional context, counsel instructions, exhibits required..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              {/* Outcome (Mainly for completed or edited hearings) */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                  Hearing Outcome / Ruling Summary
                </label>
                <textarea
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Optional outcome summary, bench orders issued, next steps..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              {/* Form Buttons */}
              <div
                className="flex items-center justify-end gap-3 pt-3 border-t"
                style={{ borderColor: '#202327' }}
              >
                <button
                  type="button"
                  onClick={closeModal}
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
                  {submitting ? "Saving..." : editingHearingId ? "Update Hearing" : "Schedule Hearing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingHearing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-4"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div
              className="flex items-center justify-between border-b pb-3"
              style={{ borderColor: '#202327' }}
            >
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <TrashIcon className="w-4 h-4" /> Delete Hearing
              </h3>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="text-[#8E95A5] hover:text-[#F4F1E8]"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8E95A5]">
              Are you sure you want to delete the hearing scheduled for{" "}
              <strong className="text-[#F4F1E8]">{formatDate(deletingHearing.scheduled_at)}</strong> (Case:{" "}
              <strong className="text-[#D8BB7A]">{deletingHearing.case_number || "—"}</strong>)?
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl text-xs bg-rose-950/40 border border-rose-800/40 text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHearing}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-700 text-white hover:bg-rose-600 transition disabled:opacity-50 cursor-pointer shadow-sm font-bold"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
