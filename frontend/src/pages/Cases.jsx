import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import Badge from '../components/ui/Badge'
import { SearchIcon, PlusIcon, EyeIcon, EditIcon, TrashIcon, XIcon, BriefcaseIcon, GavelIcon, FilterIcon } from '../components/Icons'
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_OPTIONS, PRIORITY_OPTIONS, statusBadge, priorityBadge } from '../data/caseMappers'

const emptyForm = { title: '', description: '', case_type: '', status: 'FILED', priority: 'MEDIUM', filing_date: '', next_hearing_date: '', courtroom: '', assigned_judge: '' }

export default function Cases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', case_type: '', priority: '' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search) params.search = search
      if (filters.status) params.status = filters.status
      if (filters.case_type) params.case_type = filters.case_type
      if (filters.priority) params.priority = filters.priority
      const { data } = await apiClient.get('/cases', { params })
      setCases(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load cases. Check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => {
    const timer = setTimeout(fetchCases, 300)
    return () => clearTimeout(timer)
  }, [fetchCases])

  function openCreateForm() {
    setFormData(emptyForm)
    setEditingId(null)
    setFormError(null)
    setShowForm(true)
  }

  function openEditForm(c) {
    setFormData({
      title: c.title || '',
      description: c.description || '',
      case_type: c.case_type || '',
      status: c.status || 'FILED',
      priority: c.priority || 'MEDIUM',
      filing_date: c.filing_date || '',
      next_hearing_date: c.next_hearing_date ? c.next_hearing_date.slice(0, 16) : '',
      courtroom: c.courtroom || '',
      assigned_judge: c.assigned_judge || '',
    })
    setEditingId(c.id)
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (!payload.next_hearing_date) delete payload.next_hearing_date
      if (!payload.description) delete payload.description
      if (!payload.courtroom) delete payload.courtroom
      if (!payload.assigned_judge) delete payload.assigned_judge
      if (editingId) {
        await apiClient.put(`/cases/${editingId}`, payload)
      } else {
        await apiClient.post('/cases', payload)
      }
      closeForm()
      fetchCases()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setFormError(detail.map(d => d.msg).join(', '))
      } else {
        setFormError(detail || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setDeleting(true)
    try {
      await apiClient.delete(`/cases/${id}`)
      setConfirmDeleteId(null)
      fetchCases()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete case.')
    } finally {
      setDeleting(false)
    }
  }

  function clearFilters() {
    setFilters({ status: '', case_type: '', priority: '' })
    setSearch('')
  }

  const hasActiveFilters = search || filters.status || filters.case_type || filters.priority

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/30">
                Judicial Registry Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
              Case Management
            </h1>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
              {loading ? 'Synchronizing docket records…' : `${cases.length} active docket case${cases.length === 1 ? '' : 's'} indexed`}
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="btn-3d-gold flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 text-[#0E1015]" />
            <span>New Case Filing</span>
          </button>
        </div>
      </div>

      {/* Form Card (Create / Edit) */}
      {showForm && (
        <div
          className="modal-3d-panel p-6 shadow-2xl relative"
        >
          {/* Corner Gold Inlay Brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

          <div
            className="flex items-center justify-between mb-5 border-b pb-3"
            style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
          >
            <h3 className="text-sm font-bold text-[#F4F1E8]">
              {editingId ? 'Edit Docket Case' : 'Register New Case Filing'}
            </h3>
            <button
              onClick={closeForm}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Title <span className="text-[#E08080]">*</span></label>
                <input
                  type="text" required value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] placeholder-[#777B80] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  placeholder="e.g. Smith vs Johnson Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Case Type <span className="text-[#E08080]">*</span></label>
                <input
                  type="text" required value={formData.case_type}
                  onChange={e => setFormData({ ...formData, case_type: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] placeholder-[#777B80] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  placeholder="e.g. civil, criminal, family"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Filing Date <span className="text-[#E08080]">*</span></label>
                <input
                  type="date" required value={formData.filing_date}
                  onChange={e => setFormData({ ...formData, filing_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                >
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Courtroom</label>
                <input
                  type="text" value={formData.courtroom}
                  onChange={e => setFormData({ ...formData, courtroom: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] placeholder-[#777B80] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  placeholder="e.g. Courtroom 3A"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Assigned Judge</label>
                <input
                  type="text" value={formData.assigned_judge}
                  onChange={e => setFormData({ ...formData, assigned_judge: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] placeholder-[#777B80] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                  placeholder="e.g. Hon. Maria Chen"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Next Hearing</label>
                <input
                  type="datetime-local" value={formData.next_hearing_date}
                  onChange={e => setFormData({ ...formData, next_hearing_date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors"
                  style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">Description</label>
              <textarea
                value={formData.description} rows={2}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-lg text-[#F4F1E8] placeholder-[#777B80] focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] focus:outline-none transition-colors resize-none"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                placeholder="Optional description…"
              />
            </div>
            {formError && <p className="text-xs text-rose-300 bg-rose-950/40 p-2 rounded border border-rose-800/40">{formError}</p>}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit" disabled={submitting}
                className="text-xs font-bold px-4 py-2.5 rounded-xl text-[#0E1015] bg-[#C6A15B] hover:bg-[#D8BB7A] transition disabled:opacity-50 cursor-pointer shadow-sm font-extrabold"
              >
                {submitting ? 'Saving…' : editingId ? 'Update Case' : 'Create Case'}
              </button>
              <button
                type="button" onClick={closeForm}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filters */}
      <div
        className="card-3d-chassis rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-md relative"
      >
        <div className="relative flex-1 w-full sm:w-auto">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A5]" />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by case number or title…"
            className="input-3d w-full pl-9 pr-3 py-2 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterIcon className="w-3.5 h-3.5 text-[#8E95A5] shrink-0" />
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="input-3d px-2.5 py-1.5 text-xs rounded-xl text-[#F4F1E8]"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select
            value={filters.priority}
            onChange={e => setFilters({ ...filters, priority: e.target.value })}
            className="input-3d px-2.5 py-1.5 text-xs rounded-xl text-[#F4F1E8]"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          <select
            value={filters.case_type}
            onChange={e => setFilters({ ...filters, case_type: e.target.value })}
            className="input-3d px-2.5 py-1.5 text-xs rounded-xl text-[#F4F1E8]"
          >
            <option value="">All types</option>
            {['civil', 'criminal', 'family', 'probate', 'administrative', 'appellate'].map(t =>
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            )}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-[#8E95A5] hover:text-[#F4F1E8] transition cursor-pointer"
              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-5 py-4 text-xs bg-rose-950/40 border border-rose-800/40 text-rose-300">
          {error}
        </div>
      )}

      {/* Table Console */}
      <div
        className="card-3d-chassis rounded-2xl overflow-hidden shadow-lg relative"
      >
        {/* Top Corner Metallic Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

        <div className="p-3.5">
          <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b"
                    style={{ backgroundColor: 'rgba(17, 19, 26, 0.95)', borderColor: 'rgba(46, 52, 66, 0.85)' }}
                  >
                <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5] whitespace-nowrap">Case No.</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">Title</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5] hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5] hidden sm:table-cell">Priority</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8E95A5] hidden lg:table-cell whitespace-nowrap">Filing Date</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#202327' }}>
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-[#8E95A5]">Loading cases…</td></tr>
              ) : cases.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-xs text-[#8E95A5]">
                  {search || hasActiveFilters ? 'No cases match your search.' : 'No cases yet. Click "New Case" to create one.'}
                </td></tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="transition-all duration-150 hover:bg-[#1A1E28] hover:translate-x-0.5 group"
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded shadow-xs"
                        style={{
                          backgroundColor: '#1E2228',
                          border: '1px solid rgba(198,161,91,0.3)',
                          color: '#D8BB7A',
                        }}
                      >
                        {c.case_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="font-bold truncate text-sm text-[#F4F1E8]">{c.title}</p>
                      {c.assigned_judge && <p className="text-xs truncate text-[#8E95A5] mt-0.5">{c.assigned_judge}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-xs hidden md:table-cell capitalize text-[#8E95A5]">{c.case_type}</td>
                    <td className="px-4 py-3.5"><Badge variant={statusBadge(c.status)} /></td>
                    <td className="px-4 py-3.5 hidden sm:table-cell"><Badge variant={priorityBadge(c.priority)} /></td>
                    <td className="px-4 py-3.5 text-xs hidden lg:table-cell whitespace-nowrap text-[#8E95A5]">
                      {c.filing_date || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {confirmDeleteId === c.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(c.id)} disabled={deleting}
                              className="text-xs font-bold px-2 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60 transition disabled:opacity-50 cursor-pointer"
                            >
                              {deleting ? '…' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg text-[#F4F1E8] hover:bg-white/5 transition cursor-pointer"
                              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to={`/cases/${c.id}`} aria-label="View"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => openEditForm(c)} aria-label="Edit"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-[#D8BB7A] hover:border-[#C6A15B] hover:bg-white/5 transition cursor-pointer"
                              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(c.id)} aria-label="Delete"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8E95A5] hover:text-rose-400 hover:border-rose-700/50 hover:bg-rose-950/30 transition cursor-pointer"
                              style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
