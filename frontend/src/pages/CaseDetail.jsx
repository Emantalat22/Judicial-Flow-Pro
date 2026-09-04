import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import apiClient from '../api/client'
import Badge from '../components/ui/Badge'
import {
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  BriefcaseIcon,
  GavelIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  XIcon,
  CheckCircleIcon,
  FileIcon,
  DownloadIcon,
  UploadIcon,
} from '../components/Icons'
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  statusBadge,
  priorityBadge,
} from '../data/caseMappers'

const DOCUMENT_TYPES = [
  'Pleading',
  'Motion',
  'Order',
  'Evidence',
  'Exhibit',
  'Brief',
  'Transcript',
  'Correspondence',
  'Other',
]

const initialHearingForm = {
  hearing_type: 'Preliminary Hearing',
  scheduled_at: '',
  judge: '',
  location: '',
  status: 'SCHEDULED',
  notes: '',
  outcome: '',
}

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '—'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatForDateTimeInput(isoStr) {
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

function getHearingBadgeVariant(status) {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'SCHEDULED':
    case 'CONFIRMED':
      return 'confirmed'
    case 'COMPLETED':
    case 'CLOSED':
      return 'closed'
    case 'CANCELLED':
      return 'cancelled'
    case 'PENDING':
      return 'pending'
    default:
      return 'hearing'
  }
}

function getDocTypeBadgeVariant(type) {
  const t = (type || '').toLowerCase()
  switch (t) {
    case 'order':
      return 'active'
    case 'motion':
      return 'hearing'
    case 'evidence':
    case 'exhibit':
      return 'confirmed'
    case 'pleading':
    case 'brief':
      return 'pending'
    default:
      return 'closed'
  }
}

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  // Edit Case state
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Hearings state
  const [hearings, setHearings] = useState([])
  const [hearingsLoading, setHearingsLoading] = useState(true)
  const [hearingsError, setHearingsError] = useState(null)

  // Hearing modal state
  const [hearingModalOpen, setHearingModalOpen] = useState(false)
  const [editingHearing, setEditingHearing] = useState(null)
  const [hearingFormData, setHearingFormData] = useState(initialHearingForm)
  const [hearingSubmitting, setHearingSubmitting] = useState(false)
  const [hearingFormError, setHearingFormError] = useState(null)

  // Documents state
  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [docsError, setDocsError] = useState(null)

  // Document upload modal state
  const [docUploadModalOpen, setDocUploadModalOpen] = useState(false)
  const [docUploadForm, setDocUploadForm] = useState({
    document_type: 'Pleading',
    description: '',
    file: null,
  })
  const [docUploading, setDocUploading] = useState(false)
  const [docUploadError, setDocUploadError] = useState(null)
  const docFileInputRef = useRef(null)

  // Document delete state
  const [docToDelete, setDocToDelete] = useState(null)
  const [docDeleting, setDocDeleting] = useState(false)
  const [docDeleteError, setDocDeleteError] = useState(null)

  function showFeedback(msg) {
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(''), 4000)
  }

  // Fetch Case Data
  async function fetchCase() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/cases/${id}`)
      setCaseData(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Case not found.')
      } else {
        setError('Failed to load case. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch Case Hearings
  async function fetchHearings() {
    setHearingsLoading(true)
    setHearingsError(null)
    try {
      const { data } = await apiClient.get(`/hearings/case/${id}`)
      setHearings(data || [])
    } catch (err) {
      console.error('Failed to load case hearings:', err)
      setHearingsError('Failed to load hearing history.')
    } finally {
      setHearingsLoading(false)
    }
  }

  // Fetch Case Documents
  async function fetchDocuments() {
    setDocsLoading(true)
    setDocsError(null)
    try {
      const { data } = await apiClient.get(`/documents/case/${id}`)
      setDocuments(data || [])
    } catch (err) {
      console.error('Failed to load case documents:', err)
      setDocsError('Failed to load case documents.')
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => {
    fetchCase()
    fetchHearings()
    fetchDocuments()
  }, [id])

  function startEdit() {
    setFormData({
      title: caseData.title || '',
      case_type: caseData.case_type || '',
      status: caseData.status || 'FILED',
      priority: caseData.priority || 'MEDIUM',
      filing_date: caseData.filing_date || '',
      description: caseData.description || '',
      courtroom: caseData.courtroom || '',
      assigned_judge: caseData.assigned_judge || '',
      next_hearing_date: formatForDateTimeInput(caseData.next_hearing_date),
    })
    setFormError(null)
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        case_type: formData.case_type,
        status: formData.status,
        priority: formData.priority,
        filing_date: formData.filing_date,
        description: formData.description || null,
        courtroom: formData.courtroom || null,
        assigned_judge: formData.assigned_judge || null,
        next_hearing_date: formData.next_hearing_date ? new Date(formData.next_hearing_date).toISOString() : null,
      }
      const { data } = await apiClient.put(`/cases/${id}`, payload)
      setCaseData(data)
      setEditing(false)
      showFeedback('Case details updated successfully.')
    } catch (err) {
      const detail = err.response?.data?.detail
      let errorMsg = 'Failed to update case.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => d.msg || d.message).join(', ')
      }
      setFormError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiClient.delete(`/cases/${id}`)
      navigate('/cases')
    } catch (err) {
      const detail = err.response?.data?.detail
      setFormError(typeof detail === 'string' ? detail : 'Failed to delete case.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // Hearing handlers
  function openScheduleHearingModal() {
    setEditingHearing(null)
    setHearingFormData(initialHearingForm)
    setHearingFormError(null)
    setHearingModalOpen(true)
  }

  function openEditHearingModal(hearing) {
    setEditingHearing(hearing)
    setHearingFormData({
      hearing_type: hearing.hearing_type || 'Preliminary Hearing',
      scheduled_at: formatForDateTimeInput(hearing.scheduled_at),
      judge: hearing.judge || '',
      location: hearing.location || '',
      status: hearing.status || 'SCHEDULED',
      notes: hearing.notes || '',
      outcome: hearing.outcome || '',
    })
    setHearingFormError(null)
    setHearingModalOpen(true)
  }

  function closeHearingModal() {
    setHearingModalOpen(false)
    setEditingHearing(null)
    setHearingFormData(initialHearingForm)
    setHearingFormError(null)
  }

  async function handleHearingSubmit(e) {
    e.preventDefault()
    setHearingFormError(null)
    setHearingSubmitting(true)
    try {
      const payload = {
        case_id: parseInt(id, 10),
        hearing_type: hearingFormData.hearing_type,
        scheduled_at: new Date(hearingFormData.scheduled_at).toISOString(),
        judge: hearingFormData.judge || null,
        location: hearingFormData.location || null,
        status: hearingFormData.status,
        notes: hearingFormData.notes || null,
        outcome: hearingFormData.outcome || null,
      }

      if (editingHearing) {
        await apiClient.put(`/hearings/${editingHearing.id}`, payload)
        showFeedback('Hearing updated successfully.')
      } else {
        await apiClient.post('/hearings', payload)
        showFeedback('Hearing scheduled successfully.')
      }

      closeHearingModal()
      await fetchHearings()
      await fetchCase()
    } catch (err) {
      const detail = err.response?.data?.detail
      let errorMsg = 'Failed to save hearing.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => d.msg || d.message).join(', ')
      }
      setHearingFormError(errorMsg)
    } finally {
      setHearingSubmitting(false)
    }
  }

  // Document handlers
  function openDocUploadModal() {
    setDocUploadForm({
      document_type: 'Pleading',
      description: '',
      file: null,
    })
    setDocUploadError(null)
    setDocUploadModalOpen(true)
  }

  function closeDocUploadModal() {
    setDocUploadModalOpen(false)
    setDocUploadForm({
      document_type: 'Pleading',
      description: '',
      file: null,
    })
    setDocUploadError(null)
  }

  async function handleDocUploadSubmit(e) {
    e.preventDefault()
    setDocUploadError(null)
    if (!docUploadForm.file) {
      setDocUploadError('Please select a file to upload.')
      return
    }

    setDocUploading(true)
    try {
      const data = new FormData()
      data.append('file', docUploadForm.file)
      data.append('case_id', id)
      data.append('document_type', docUploadForm.document_type)
      if (docUploadForm.description) {
        data.append('description', docUploadForm.description)
      }

      await apiClient.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      closeDocUploadModal()
      showFeedback(`Document "${docUploadForm.file.name}" uploaded successfully.`)
      await fetchDocuments()
    } catch (err) {
      const detail = err.response?.data?.detail
      let errorMsg = 'Failed to upload document.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => d.msg || d.message).join(', ')
      }
      setDocUploadError(errorMsg)
    } finally {
      setDocUploading(false)
    }
  }

  async function handleDocDownload(doc) {
    try {
      const response = await apiClient.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.filename || `document_${doc.id}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      showFeedback('Failed to download document file.')
    }
  }

  async function handleDocDeleteConfirm() {
    if (!docToDelete) return
    setDocDeleting(true)
    setDocDeleteError(null)
    try {
      await apiClient.delete(`/documents/${docToDelete.id}`)
      setDocToDelete(null)
      showFeedback(`Document "${docToDelete.filename}" deleted successfully.`)
      await fetchDocuments()
    } catch (err) {
      const detail = err.response?.data?.detail
      setDocDeleteError(detail || 'Failed to delete document.')
    } finally {
      setDocDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xs text-[#8E95A5]">
          Loading case records…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8E95A5] hover:text-[#F4F1E8] transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Cases
        </Link>
        <div className="rounded-xl px-5 py-4 text-xs font-semibold bg-rose-950/40 border border-rose-800/40 text-rose-300">
          {error}
        </div>
      </div>
    )
  }

  const c = caseData

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Back link */}
      <Link
        to="/cases"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#8E95A5] hover:text-[#D8BB7A] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Cases
      </Link>

      {/* ── 3D Case Dossier Command Header ── */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <span
                className="font-mono text-xs font-bold px-3 py-1 rounded-lg shadow-sm"
                style={{
                  backgroundColor: '#1E2228',
                  border: '1px solid rgba(198,161,91,0.4)',
                  color: '#D8BB7A',
                }}
              >
                {c.case_number}
              </span>
              <Badge variant={statusBadge(c.status)} />
              <Badge variant={priorityBadge(c.priority)} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
              {c.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1 capitalize">
              {c.case_type} Proceeding & Docket Dossier
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {confirmDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-bold px-4 py-2 rounded-xl text-white bg-rose-700 hover:bg-rose-600 transition disabled:opacity-50 cursor-pointer shadow-sm font-bold"
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer shadow-sm"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  <EditIcon className="w-3.5 h-3.5 text-[#D8BB7A]" /> Edit Case
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-rose-800/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition cursor-pointer shadow-sm"
                >
                  <TrashIcon className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {formError && (
        <div className="rounded-xl px-5 py-3 text-xs font-semibold bg-rose-950/40 border border-rose-800/40 text-rose-300">
          {formError}
        </div>
      )}

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 animate-in slide-in-from-top duration-200 shadow-sm">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Detail / Edit Case Card */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
      >
        {editing ? (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Title <span className="text-[#E08080]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Case Type <span className="text-[#E08080]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.case_type}
                  onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Filing Date <span className="text-[#E08080]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.filing_date}
                  onChange={(e) => setFormData({ ...formData, filing_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Next Hearing
                </label>
                <input
                  type="datetime-local"
                  value={formData.next_hearing_date}
                  onChange={(e) => setFormData({ ...formData, next_hearing_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Courtroom
                </label>
                <input
                  type="text"
                  value={formData.courtroom}
                  onChange={(e) => setFormData({ ...formData, courtroom: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Assigned Judge
                </label>
                <input
                  type="text"
                  value={formData.assigned_judge}
                  onChange={(e) => setFormData({ ...formData, assigned_judge: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                Description
              </label>
              <textarea
                value={formData.description}
                rows={3}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="text-xs font-bold px-5 py-2.5 rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition disabled:opacity-50 cursor-pointer shadow-md font-extrabold"
              >
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y" style={{ borderColor: '#202327' }}>
            {/* Info Grid */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              <DetailField
                icon={<BriefcaseIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Case Type"
                value={c.case_type}
              />
              <DetailField
                icon={<GavelIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Courtroom"
                value={c.courtroom || '—'}
              />
              <DetailField
                icon={<UserIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Assigned Judge"
                value={c.assigned_judge || '—'}
              />
              <DetailField
                icon={<CalendarIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Filing Date"
                value={c.filing_date || '—'}
              />
              <DetailField
                icon={<ClockIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Next Hearing"
                value={c.next_hearing_date ? formatDate(c.next_hearing_date) : '—'}
              />
              <DetailField
                icon={<ClockIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Created"
                value={formatDate(c.created_at)}
              />
              <DetailField
                icon={<ClockIcon className="w-4 h-4 text-[#D8BB7A]" />}
                label="Updated"
                value={c.updated_at ? formatDate(c.updated_at) : '—'}
              />
            </div>
            {/* Description */}
            {c.description && (
              <div className="px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-[#8E95A5]">
                  Description
                </p>
                <p className="text-xs leading-relaxed text-[#F4F1E8]">
                  {c.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case Documents Section */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
      >
        {/* Section Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: '#111316', borderColor: '#202327' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(198,161,91,0.15)',
                color: '#D8BB7A',
                border: '1px solid rgba(198,161,91,0.3)',
              }}
            >
              <FileIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F1E8]">
                Case Documents & Exhibits
              </h3>
              <p className="text-xs text-[#8E95A5]">
                Official filings, evidence attachments, and rulings for {c.case_number}
              </p>
            </div>
          </div>

          <button
            onClick={openDocUploadModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition shadow-md cursor-pointer font-extrabold"
          >
            <UploadIcon className="w-3.5 h-3.5 text-[#0E1015]" />
            Upload Document
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {docsLoading && (
            <div className="py-8 text-center text-xs text-[#8E95A5]">
              Loading case documents…
            </div>
          )}

          {!docsLoading && docsError && (
            <div className="rounded-xl p-3.5 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/40">
              {docsError}
            </div>
          )}

          {!docsLoading && !docsError && documents.length === 0 && (
            <div className="py-10 text-center space-y-1.5">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: '#1E2228', color: '#8E95A5' }}
              >
                <FileIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#F4F1E8]">
                No documents uploaded for this case.
              </p>
              <p className="text-xs text-[#8E95A5] max-w-sm mx-auto">
                Attach pleadings, motions, and evidence exhibits directly to this case.
              </p>
            </div>
          )}

          {!docsLoading && !docsError && documents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-[11px] font-bold uppercase tracking-wider border-b"
                    style={{ backgroundColor: '#111316', borderColor: '#202327', color: '#8E95A5' }}
                  >
                    <th className="py-3 px-4">Document Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs" style={{ borderColor: '#202327' }}>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileIcon className="w-4 h-4 text-[#D8BB7A] shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-[#F4F1E8] truncate block max-w-xs" title={doc.filename}>
                              {doc.filename}
                            </span>
                            {doc.description && (
                              <p className="text-[11px] text-[#8E95A5] truncate max-w-xs mt-0.5">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={getDocTypeBadgeVariant(doc.document_type)} />
                      </td>

                      <td className="py-3 px-4 font-mono text-[#8E95A5]">
                        {formatFileSize(doc.file_size)}
                      </td>

                      <td className="py-3 px-4 text-[#8E95A5]">
                        {formatDate(doc.created_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleDocDownload(doc)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#D8BB7A] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            title="Download"
                          >
                            <DownloadIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-rose-400 hover:border-rose-700/50 hover:bg-rose-950/30 transition cursor-pointer"
                            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            title="Delete"
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
          )}
        </div>
      </div>

      {/* Hearing History / Timeline Section */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
      >
        {/* Section Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: '#111316', borderColor: '#202327' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(198,161,91,0.15)',
                color: '#D8BB7A',
                border: '1px solid rgba(198,161,91,0.3)',
              }}
            >
              <GavelIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F1E8]">
                Hearing History & Timeline
              </h3>
              <p className="text-xs text-[#8E95A5]">
                Chronological proceedings, court sessions, and recorded outcomes
              </p>
            </div>
          </div>

          <button
            onClick={openScheduleHearingModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition shadow-md cursor-pointer font-extrabold"
          >
            <PlusIcon className="w-3.5 h-3.5 text-[#0E1015]" />
            Schedule Hearing
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6">
          {hearingsLoading && (
            <div className="py-10 text-center text-xs text-[#8E95A5]">
              Loading hearing history…
            </div>
          )}

          {!hearingsLoading && hearingsError && (
            <div className="rounded-xl p-3.5 text-xs font-semibold bg-rose-950/40 border border-rose-800/40 text-rose-300">
              {hearingsError}
            </div>
          )}

          {!hearingsLoading && !hearingsError && hearings.length === 0 && (
            <div className="py-12 text-center space-y-1.5">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: '#1E2228', color: '#8E95A5' }}
              >
                <CalendarIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#F4F1E8]">
                No hearing history available for this case.
              </p>
              <p className="text-xs text-[#8E95A5] max-w-sm mx-auto">
                Click "Schedule Hearing" to assign the next court appearance and docket directives.
              </p>
            </div>
          )}

          {!hearingsLoading && !hearingsError && hearings.length > 0 && (
            <div
              className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-2.5 sm:before:left-3.5 before:w-0.5"
              style={{ '--tw-before-bg': '#383D4B' }}
            >
              {hearings.map((h) => {
                return (
                  <div key={h.id} className="relative group">
                    <div
                      className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: '#0E1015',
                        border: '2px solid #C6A15B',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]" />
                    </div>

                    <div
                      className="rounded-2xl p-4 sm:p-5 transition-all shadow-sm"
                      style={{
                        backgroundColor: '#1E2228',
                        border: '1px solid #383D4B',
                      }}
                    >
                      <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b"
                        style={{ borderColor: '#262B35' }}
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs font-bold text-[#F4F1E8]">
                            {h.hearing_type || 'Court Hearing'}
                          </span>
                          <Badge variant={getHearingBadgeVariant(h.status)} />
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#D8BB7A] flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5 text-[#8E95A5]" />
                            {formatDate(h.scheduled_at)}
                          </span>

                          <button
                            onClick={() => openEditHearingModal(h)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8E95A5] hover:text-[#D8BB7A] hover:bg-white/5 transition cursor-pointer"
                            style={{ backgroundColor: '#161922', border: '1px solid #383D4B' }}
                            title="Edit Hearing Details"
                          >
                            <EditIcon className="w-3 h-3 text-[#D8BB7A]" />
                            Edit
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                        {h.judge && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#8E95A5] font-semibold">Judge:</span>
                            <span className="text-[#F4F1E8] font-medium">{h.judge}</span>
                          </div>
                        )}

                        {h.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#8E95A5] font-semibold">Courtroom / Location:</span>
                            <span className="text-[#F4F1E8] font-medium">{h.location}</span>
                          </div>
                        )}
                      </div>

                      {h.outcome && (
                        <div
                          className="mt-3 p-3 rounded-xl text-xs"
                          style={{
                            backgroundColor: '#161922',
                            border: '1px solid #262B35',
                          }}
                        >
                          <span className="font-bold text-[#D8BB7A] block mb-1">
                            Ruling / Outcome:
                          </span>
                          <p className="text-[#F4F1E8] leading-relaxed">{h.outcome}</p>
                        </div>
                      )}

                      {h.notes && (
                        <div className="mt-2 text-xs text-[#8E95A5]">
                          <span className="font-semibold text-[#F4F1E8]">Docket Notes: </span>
                          <span>{h.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule / Edit Hearing Modal */}
      {hearingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div
              className="flex items-center justify-between pb-4 mb-4 border-b"
              style={{ borderColor: '#202327' }}
            >
              <div>
                <h3 className="text-base font-bold text-[#F4F1E8]">
                  {editingHearing ? 'Edit Hearing' : 'Schedule Hearing for Case'}
                </h3>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  {c.case_number} — {c.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeHearingModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleHearingSubmit} className="space-y-4">
              {hearingFormError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300">
                  {hearingFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                    Hearing Type
                  </label>
                  <select
                    value={hearingFormData.hearing_type}
                    onChange={(e) =>
                      setHearingFormData({ ...hearingFormData, hearing_type: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  >
                    <option value="Preliminary Hearing">Preliminary Hearing</option>
                    <option value="Motion Hearing">Motion Hearing</option>
                    <option value="Pre-Trial Conference">Pre-Trial Conference</option>
                    <option value="Arraignment">Arraignment</option>
                    <option value="Trial">Trial</option>
                    <option value="Sentencing">Sentencing</option>
                    <option value="Status Conference">Status Conference</option>
                    <option value="Bail Hearing">Bail Hearing</option>
                    <option value="Appeal Hearing">Appeal Hearing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                    Date & Time <span className="text-[#E08080]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={hearingFormData.scheduled_at}
                    onChange={(e) =>
                      setHearingFormData({ ...hearingFormData, scheduled_at: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                    Presiding Judge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hon. Sarah Jenkins"
                    value={hearingFormData.judge}
                    onChange={(e) =>
                      setHearingFormData({ ...hearingFormData, judge: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                    Courtroom / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Courtroom 3B"
                    value={hearingFormData.location}
                    onChange={(e) =>
                      setHearingFormData({ ...hearingFormData, location: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                    style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Hearing Status
                </label>
                <select
                  value={hearingFormData.status}
                  onChange={(e) =>
                    setHearingFormData({ ...hearingFormData, status: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Outcome / Ruling Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Record judgment, directives, or hearing outcome..."
                  value={hearingFormData.outcome}
                  onChange={(e) =>
                    setHearingFormData({ ...hearingFormData, outcome: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Docket Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or preparation instructions..."
                  value={hearingFormData.notes}
                  onChange={(e) =>
                    setHearingFormData({ ...hearingFormData, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: '#202327' }}
              >
                <button
                  type="button"
                  onClick={closeHearingModal}
                  disabled={hearingSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hearingSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md font-extrabold"
                >
                  {hearingSubmitting ? 'Saving…' : editingHearing ? 'Save Changes' : 'Schedule Hearing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Document Upload Modal */}
      {docUploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div
              className="flex items-center justify-between pb-4 mb-4 border-b"
              style={{ borderColor: '#202327' }}
            >
              <div>
                <h3 className="text-base font-bold text-[#F4F1E8]">Upload Document for Case</h3>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  {c.case_number} — {c.title}
                </p>
              </div>
              <button
                onClick={closeDocUploadModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDocUploadSubmit} className="space-y-4">
              {docUploadError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300">
                  {docUploadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Document Type <span className="text-[#E08080]">*</span>
                </label>
                <select
                  required
                  value={docUploadForm.document_type}
                  onChange={(e) =>
                    setDocUploadForm({ ...docUploadForm, document_type: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  File Attachment <span className="text-[#E08080]">*</span>
                </label>
                <div
                  onClick={() => docFileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: '#383D4B',
                    backgroundColor: '#1E2228',
                  }}
                >
                  <input
                    ref={docFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDocUploadForm({ ...docUploadForm, file: e.target.files[0] })
                        setDocUploadError(null)
                      }
                    }}
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.jpg,.jpeg,.png,.tif,.tiff"
                  />
                  {docUploadForm.file ? (
                    <div
                      className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
                    >
                      <div className="flex items-center gap-2 min-w-0 text-left">
                        <FileIcon className="w-4 h-4 text-[#D8BB7A] shrink-0" />
                        <span className="text-xs font-bold text-[#F4F1E8] truncate max-w-[200px]">
                          {docUploadForm.file.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8E95A5] font-mono">
                        {formatFileSize(docUploadForm.file.size)}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div
                        className="w-8 h-8 rounded-full mx-auto flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(198,161,91,0.15)', color: '#D8BB7A' }}
                      >
                        <UploadIcon className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-[#F4F1E8]">Click to select document file</p>
                      <p className="text-[11px] text-[#8E95A5]">PDF, DOCX, TXT, PNG, JPG</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description..."
                  value={docUploadForm.description}
                  onChange={(e) =>
                    setDocUploadForm({ ...docUploadForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              <div
                className="flex items-center justify-end gap-3 pt-3 border-t"
                style={{ borderColor: '#202327' }}
              >
                <button
                  type="button"
                  onClick={closeDocUploadModal}
                  disabled={docUploading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docUploading}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition disabled:opacity-50 cursor-pointer shadow-md font-extrabold"
                >
                  {docUploading ? 'Uploading…' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Document Delete Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-5 shadow-2xl w-full max-w-sm"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-950/40 text-rose-400 shrink-0 border border-rose-800/40">
                <TrashIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F4F1E8]">Delete Document?</h3>
                <p className="text-xs text-[#8E95A5] truncate max-w-[240px]">
                  {docToDelete.filename}
                </p>
              </div>
            </div>

            {docDeleteError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300 mb-3">
                {docDeleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={docDeleting}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDocDeleteConfirm}
                disabled={docDeleting}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-white bg-rose-700 hover:bg-rose-600 transition disabled:opacity-50 cursor-pointer shadow-sm font-bold"
              >
                {docDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailField({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">
          {label}
        </span>
      </div>
      <p className="text-xs font-bold text-[#F4F1E8]">
        {value}
      </p>
    </div>
  )
}
