import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import apiClient from '../../api/client'
import { statusBadge, priorityBadge, formatHearingDate } from '../../data/caseMappers'
import { SearchIcon, EyeIcon } from '../Icons'

export default function RecentCasesTable() {
  const [filter, setFilter] = useState('')
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await apiClient.get('/cases', { params: { limit: 5 } })
        if (!cancelled) setCases(data)
      } catch {
        if (!cancelled) setError('Unable to load recent cases.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const filtered = filter
    ? cases.filter(
        (c) =>
          c.case_number.toLowerCase().includes(filter.toLowerCase()) ||
          c.title.toLowerCase().includes(filter.toLowerCase()) ||
          c.case_type.toLowerCase().includes(filter.toLowerCase())
      )
    : cases

  return (
    <div
      className="card-3d-chassis card-3d-tilt rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div
        className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b"
        style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
      >
        <div>
          <h3 className="text-sm font-bold text-[#F4F1E8]">Recent Cases</h3>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            {loading ? 'Loading…' : `${cases.length} most recent case${cases.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E95A5]" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter cases…"
              className="recessed-well pl-8 pr-3 py-1.5 text-xs rounded-xl focus:outline-none w-44 transition-all focus:border-[#C6A15B]"
              style={{
                color: '#F4F1E8',
              }}
            />
          </div>
          <Link
            to="/cases"
            className="btn-3d-charcoal text-xs font-bold whitespace-nowrap px-3.5 py-1.5 rounded-xl text-[#F4F1E8] cursor-pointer"
          >
            View all cases
          </Link>
        </div>
      </div>

      {/* Recessed Table Bay */}
      <div className="p-3.5">
        <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{ backgroundColor: 'rgba(17, 19, 26, 0.95)', borderColor: 'rgba(46, 52, 66, 0.85)' }}
                >
                  <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5] whitespace-nowrap">
                    Case No.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5]">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5] hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5]">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5] hidden sm:table-cell">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5] hidden lg:table-cell whitespace-nowrap">
                    Next Hearing
                  </th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D212B]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#8E95A5]">
                      Loading cases…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#B95353]">
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#8E95A5]">
                      {cases.length === 0 ? 'No cases yet.' : 'No cases match your filter.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-all duration-150 hover:bg-[#1A1E28] hover:translate-x-0.5 group"
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap relative">
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#C6A15B] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'rgba(198,161,91,0.12)',
                            color: '#D8BB7A',
                            border: '1px solid rgba(198,161,91,0.25)',
                          }}
                        >
                          {c.case_number}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="font-bold truncate text-sm text-[#F4F1E8]">{c.title}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs hidden md:table-cell capitalize text-[#8E95A5]">
                    {c.case_type}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusBadge(c.status)} />
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <Badge variant={priorityBadge(c.priority)} />
                  </td>
                  <td className="px-4 py-3.5 text-xs hidden lg:table-cell whitespace-nowrap text-[#8E95A5]">
                    {formatHearingDate(c.next_hearing_date)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      to={`/cases/${c.id}`}
                      aria-label="View case"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[#8E95A5] hover:text-[#F4F1E8] hover:border-[#C6A15B] hover:bg-[#1E2228] transition cursor-pointer shadow-xs"
                      style={{ borderColor: '#383D4B', backgroundColor: '#1E2228' }}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
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
  )
}
