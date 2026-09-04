import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Badge from '../components/ui/Badge'
import {
  FileIcon,
  SearchIcon,
  DownloadIcon,
  TrashIcon,
  EyeIcon,
  XIcon,
  CheckCircleIcon,
  UploadIcon,
} from '../components/Icons'

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

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Filters State
  const [search, setSearch] = useState('')
  const [caseFilter, setCaseFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    case_id: '',
    document_type: 'Pleading',
    description: '',
    file: null,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  // Fetch Cases for selectors
  async function fetchCases() {
    try {
      const { data } = await apiClient.get('/cases')
      setCases(data || [])
    } catch (err) {
      console.error('Failed to load cases:', err)
    }
  }

  // Fetch Documents with active filters
  async function fetchDocuments() {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (caseFilter) params.case_id = caseFilter
      if (typeFilter) params.document_type = typeFilter

      const { data } = await apiClient.get('/documents', { params })
      setDocuments(data || [])
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setError('Unable to load document records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, caseFilter, typeFilter])

  function handleClearFilters() {
    setSearch('')
    setCaseFilter('')
    setTypeFilter('')
  }

  const hasActiveFilters = Boolean(search || caseFilter || typeFilter)

  // Download Action
  async function handleDownload(doc) {
    try {
      const response = await apiClient.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      showSuccess(`Error downloading "${doc.filename}".`)
    }
  }

  // Upload Handlers
  function openUploadModal() {
    setUploadForm({
      case_id: '',
      document_type: 'Pleading',
      description: '',
      file: null,
    })
    setUploadError(null)
    setDragActive(false)
    setUploadModalOpen(true)
  }

  function closeUploadModal() {
    setUploadModalOpen(false)
    setUploadForm({
      case_id: '',
      document_type: 'Pleading',
      description: '',
      file: null,
    })
    setUploadError(null)
    setDragActive(false)
  }

  function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      setUploadForm((prev) => ({ ...prev, file: e.target.files[0] }))
      setUploadError(null)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadForm((prev) => ({ ...prev, file: e.dataTransfer.files[0] }))
      setUploadError(null)
    }
  }

  async function handleUploadSubmit(e) {
    e.preventDefault()
    setUploadError(null)

    if (!uploadForm.case_id) {
      setUploadError('Please select an associated case.')
      return
    }
    if (!uploadForm.file) {
      setUploadError('Please attach a document file.')
      return
    }

    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', uploadForm.file)
      data.append('case_id', uploadForm.case_id)
      data.append('document_type', uploadForm.document_type)
      if (uploadForm.description) {
        data.append('description', uploadForm.description)
      }

      await apiClient.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      closeUploadModal()
      showSuccess(`Document "${uploadForm.file.name}" uploaded successfully.`)
      await fetchDocuments()
    } catch (err) {
      const detail = err.response?.data?.detail
      let errorMsg = 'Failed to upload document.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => d.msg || d.message).join(', ')
      }
      setUploadError(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  function openDetailsModal(doc) {
    setSelectedDoc(doc)
    setDetailsModalOpen(true)
  }

  function openDeleteModal(doc) {
    setDocToDelete(doc)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false)
    setDocToDelete(null)
    setDeleteError(null)
  }

  async function handleDeleteConfirm() {
    if (!docToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiClient.delete(`/documents/${docToDelete.id}`)
      closeDeleteModal()
      showSuccess(`Document "${docToDelete.filename}" deleted successfully.`)
      await fetchDocuments()
    } catch (err) {
      const detail = err.response?.data?.detail
      setDeleteError(typeof detail === 'string' ? detail : 'Failed to delete document.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* ── 3D Command Header ── */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/30">
                Digital Evidence & Registry Archive
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
              Documents Repository
            </h1>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
              Court filings, evidence exhibits, motions, and verified evidentiary case records.
            </p>
          </div>

          <button
            onClick={openUploadModal}
            className="btn-3d-gold flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer shrink-0"
          >
            <UploadIcon className="w-4 h-4 text-[#0E1015]" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 animate-in slide-in-from-top duration-200 shadow-sm">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card-3d-chassis rounded-2xl p-4.5 shadow-md relative"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A5]" />
            <input
              type="text"
              placeholder="Search filename, case title, number, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            />
          </div>

          {/* Case Filter */}
          <div>
            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Cases</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              <option value="">All Types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-xs font-semibold rounded-xl shrink-0 text-[#8E95A5] hover:text-[#F4F1E8] transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Documents Table Card */}
      <div
        className="card-3d-chassis rounded-2xl shadow-lg overflow-hidden relative"
      >
        {/* Top Corner Metallic Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center text-xs text-[#8E95A5]">
            <div className="w-6 h-6 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading documents from repository…
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center space-y-3">
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300 max-w-md mx-auto">
              {error}
            </div>
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && documents.length === 0 && (
          <div className="py-16 px-6 text-center space-y-2">
            <div
              className="pedestal-3d w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[#D8BB7A]"
            >
              <FileIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#F4F1E8]">
              {hasActiveFilters ? 'No documents match your filters.' : 'No documents in repository.'}
            </p>
            <p className="text-xs text-[#8E95A5] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Upload affidavits, orders, motions, evidence items, and official case filings.'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={openUploadModal}
                className="mt-2 btn-3d-gold inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
              >
                <UploadIcon className="w-3.5 h-3.5 text-[#0E1015]" />
                Upload First Document
              </button>
            )}
          </div>
        )}

        {/* Documents Table */}
        {!loading && !error && documents.length > 0 && (
          <div className="p-3.5">
            <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className="text-[11px] font-bold uppercase tracking-wider border-b"
                      style={{ backgroundColor: 'rgba(17, 19, 26, 0.95)', borderColor: 'rgba(46, 52, 66, 0.85)', color: '#8E95A5' }}
                    >
                      <th className="py-3.5 px-5">Document Name</th>
                      <th className="py-3.5 px-5">Associated Case</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Size</th>
                      <th className="py-3.5 px-5">Uploaded Date</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm" style={{ borderColor: '#202327' }}>
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="transition-all duration-150 hover:bg-[#1A1E28] hover:translate-x-0.5 group"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="pedestal-3d w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-[#D8BB7A]"
                            >
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => openDetailsModal(doc)}
                                className="font-bold text-xs text-[#F4F1E8] hover:text-[#D8BB7A] transition text-left truncate block max-w-xs cursor-pointer"
                                title={doc.filename}
                              >
                                {doc.filename}
                              </button>
                          {doc.description && (
                            <p className="text-[11px] truncate max-w-xs mt-0.5 text-[#8E95A5]">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="min-w-0">
                        {doc.case_id ? (
                          <Link
                            to={`/cases/${doc.case_id}`}
                            className="font-mono text-xs font-bold text-[#D8BB7A] hover:underline block"
                          >
                            {doc.case_number || `Case #${doc.case_id}`}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-[#777B80]">—</span>
                        )}
                        <p className="text-xs truncate max-w-xs mt-0.5 text-[#8E95A5]">
                          {doc.case_title || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant={getDocTypeBadgeVariant(doc.document_type)} />
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-[#8E95A5]">
                      {formatFileSize(doc.file_size)}
                    </td>

                    <td className="py-4 px-5 text-xs text-[#8E95A5]">
                      {formatDate(doc.created_at)}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openDetailsModal(doc)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                          style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                          title="View Details"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#D8BB7A] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                          style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                          title="Download File"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(doc)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-rose-400 hover:border-rose-700/50 hover:bg-rose-950/30 transition cursor-pointer"
                          style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                          title="Delete Document"
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
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="modal-3d-panel p-6 sm:p-7 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
          >
            {/* Top Corner Metallic Gold Inlay Brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

            <div
              className="flex items-center justify-between pb-4 mb-4 border-b"
              style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
            >
              <div>
                <h3 className="text-base font-bold text-[#F4F1E8]">Upload Document</h3>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  Attach official court records, motions, or exhibits to a case.
                </p>
              </div>
              <button
                onClick={closeUploadModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300">
                  {uploadError}
                </div>
              )}

              {/* Case Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Associated Case <span className="text-[#E08080]">*</span>
                </label>
                <select
                  required
                  value={uploadForm.case_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, case_id: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  <option value="">-- Select Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Document Type <span className="text-[#E08080]">*</span>
                </label>
                <select
                  required
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
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

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  File Attachment <span className="text-[#E08080]">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#C6A15B] bg-[#C6A15B]/10'
                      : 'border-[#383D4B] hover:border-[#C6A15B] bg-[#1E2228]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.jpg,.jpeg,.png,.tif,.tiff"
                  />
                  {uploadForm.file ? (
                    <div
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 text-left">
                        <FileIcon className="w-5 h-5 text-[#C6A15B] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#F4F1E8] truncate">
                            {uploadForm.file.name}
                          </p>
                          <p className="text-[11px] text-[#8E95A5] font-mono">
                            {formatFileSize(uploadForm.file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadForm((prev) => ({ ...prev, file: null }))
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="p-1 rounded text-[#8E95A5] hover:text-rose-400 transition"
                        title="Remove file"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div
                        className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-[#D8BB7A]"
                        style={{ backgroundColor: '#161922', border: '1px solid rgba(198,161,91,0.25)' }}
                      >
                        <UploadIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-[#F4F1E8]">
                        Click to browse or drag & drop file here
                      </p>
                      <p className="text-[11px] text-[#8E95A5]">
                        Supports PDF, DOC, DOCX, TXT, RTF, PNG, JPG
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[#8E95A5]">
                  Description / Docket Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief summary of the document contents..."
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] focus:outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition-colors resize-none"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: '#202327' }}
              >
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm font-extrabold"
                >
                  {uploading ? 'Uploading…' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModalOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 shadow-2xl w-full max-w-lg"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div
              className="flex items-center justify-between pb-4 mb-4 border-b"
              style={{ borderColor: '#202327' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: '#1E2228',
                    border: '1px solid rgba(198,161,91,0.25)',
                    color: '#D8BB7A',
                  }}
                >
                  <FileIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#F4F1E8] truncate">
                    {selectedDoc.filename}
                  </h3>
                  <p className="text-xs text-[#8E95A5]">Document Registry Details</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div
                className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                style={{ backgroundColor: '#1E2228', border: '1px solid #262B35' }}
              >
                <div>
                  <span className="text-[#8E95A5] font-semibold uppercase tracking-wider block mb-1">
                    Document Type
                  </span>
                  <Badge variant={getDocTypeBadgeVariant(selectedDoc.document_type)} />
                </div>
                <div>
                  <span className="text-[#8E95A5] font-semibold uppercase tracking-wider block mb-1">
                    File Size
                  </span>
                  <span className="font-mono text-[#F4F1E8] font-bold">
                    {formatFileSize(selectedDoc.file_size)}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E95A5] font-semibold uppercase tracking-wider block mb-1">
                    MIME Type
                  </span>
                  <span className="text-[#8E95A5] font-mono">
                    {selectedDoc.mime_type || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E95A5] font-semibold uppercase tracking-wider block mb-1">
                    Uploaded Date
                  </span>
                  <span className="text-[#F4F1E8] font-medium">
                    {formatDate(selectedDoc.created_at)}
                  </span>
                </div>
              </div>

              {/* Case Information */}
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: '#1E2228', border: '1px solid #262B35' }}
              >
                <span className="text-[#8E95A5] font-semibold uppercase tracking-wider block mb-1.5">
                  Associated Case
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#D8BB7A] block">
                      {selectedDoc.case_number || `Case #${selectedDoc.case_id}`}
                    </span>
                    <p className="text-[#F4F1E8] font-medium text-xs mt-0.5">
                      {selectedDoc.case_title || '—'}
                    </p>
                  </div>
                  {selectedDoc.case_id && (
                    <Link
                      to={`/cases/${selectedDoc.case_id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#F4F1E8] hover:border-[#C6A15B] hover:bg-white/5 transition"
                      style={{ backgroundColor: '#161922', border: '1px solid #383D4B' }}
                    >
                      View Case
                    </Link>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedDoc.description && (
                <div
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #262B35' }}
                >
                  <span className="text-[#8E95A5] font-semibold uppercase tracking-wider block mb-1">
                    Description / Docket Synopsis
                  </span>
                  <p className="text-[#F4F1E8] leading-relaxed">
                    {selectedDoc.description}
                  </p>
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-end gap-3 pt-4 mt-5 border-t"
              style={{ borderColor: '#202327' }}
            >
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownload(selectedDoc)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition flex items-center gap-1.5 cursor-pointer shadow-sm font-extrabold"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && docToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-4"
            style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-950/40 text-rose-400 shrink-0 border border-rose-800/40">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F4F1E8]">
                  Delete Document Record?
                </h3>
                <p className="text-xs text-[#8E95A5]">
                  This action will permanently delete the physical file and database entry.
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl text-xs space-y-1"
              style={{ backgroundColor: '#1E2228', border: '1px solid #262B35' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#8E95A5]">Document:</span>
                <span className="font-semibold text-[#F4F1E8] truncate max-w-[200px]">
                  {docToDelete.filename}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E95A5]">Case Number:</span>
                <span className="font-mono font-bold text-[#D8BB7A]">
                  {docToDelete.case_number || `Case #${docToDelete.case_id}`}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs font-semibold text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
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
