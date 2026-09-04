import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/client'
import Badge from '../ui/Badge'

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

export default function UpcomingHearings() {
  const [hearings, setHearings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchUpcomingHearings() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await apiClient.get('/hearings')
        if (isMounted) {
          const now = new Date()
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

          // Filter for upcoming/future hearings and sort earliest first
          const upcoming = data
            .filter((h) => {
              if (!h.scheduled_at) return false
              const hTime = new Date(h.scheduled_at).getTime()
              // Include today & future, exclude cancelled
              return hTime >= todayStart && (h.status || '').toUpperCase() !== 'CANCELLED'
            })
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
            .slice(0, 5)

          setHearings(upcoming)
        }
      } catch (err) {
        console.error('Failed to load upcoming hearings:', err)
        if (isMounted) {
          setError('Failed to load upcoming hearings.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUpcomingHearings()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div
      className="card-3d-chassis card-3d-tilt rounded-2xl overflow-hidden flex flex-col shadow-lg relative"
    >
      {/* Top Corner Metallic Gold Inlay Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

      {/* Header */}
      <div
        className="px-6 py-4.5 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
      >
        <div>
          <h3 className="text-sm font-bold text-[#F4F1E8]">
            Upcoming Hearings
          </h3>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            {loading
              ? 'Checking schedule…'
              : `${hearings.length} upcoming scheduled`}
          </p>
        </div>
        <Link
          to="/hearings"
          className="btn-3d-charcoal text-xs font-bold px-3.5 py-1.5 rounded-xl text-[#F4F1E8] cursor-pointer"
        >
          View all hearings
        </Link>
      </div>

      {/* Rows Container */}
      <div className="flex-1">
        {loading && (
          <div className="py-12 text-center text-xs text-[#8E95A5]">
            Loading upcoming hearings…
          </div>
        )}

        {!loading && error && (
          <div className="py-8 px-5 text-center text-xs text-[#B95353]">
            {error}
          </div>
        )}

        {!loading && !error && hearings.length === 0 && (
          <div className="py-12 px-5 text-center space-y-1.5">
            <p className="text-sm font-bold text-[#F4F1E8]">
              No upcoming hearings.
            </p>
            <p className="text-xs text-[#8E95A5]">
              Scheduled hearings will appear here automatically.
            </p>
          </div>
        )}

        {!loading && !error && hearings.length > 0 && (
          <div className="p-3.5">
            <div className="recessed-data-bay rounded-xl overflow-hidden border border-[rgba(46,52,66,0.7)] divide-y divide-[#1D212B]">
              {hearings.map((h) => {
                const dateObj = new Date(h.scheduled_at)
                const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                const dayNum = dateObj.getDate()
                const dayAbbr = dateObj.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                const linkTarget = h.case_id ? `/cases/${h.case_id}` : '/hearings'

                return (
              <Link
                key={h.id}
                to={linkTarget}
                className="flex items-start gap-3.5 px-5 py-4 transition-all duration-150 hover:bg-[#1C202A] hover:translate-x-0.5 block group cursor-pointer border-t first:border-t-0"
                style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
              >
                {/* Date block */}
                <div
                  className="shrink-0 w-13 text-center rounded-xl py-2 px-1 border transition-transform group-hover:scale-102 shadow-xs"
                  style={{
                    backgroundColor: 'rgba(198,161,91,0.12)',
                    borderColor: 'rgba(198,161,91,0.25)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 5px rgba(0,0,0,0.35)',
                  }}
                >
                  <p className="text-[10px] font-bold leading-none tracking-widest text-[#D8BB7A]">
                    {month}
                  </p>
                  <p className="text-xl font-extrabold leading-tight text-[#F4F1E8] mt-0.5">
                    {dayNum}
                  </p>
                  <p className="text-[10px] leading-none text-[#8E95A5]">
                    {dayAbbr}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-[#F4F1E8] group-hover:text-[#D8BB7A] transition-colors">
                    {h.case_title || 'Untitled Case'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-[#8E95A5]">
                      {h.case_number || '—'}
                    </span>
                    {h.hearing_type && (
                      <>
                        <span className="text-[#383D4B]">·</span>
                        <span className="text-xs font-bold text-[#C6A15B]">
                          {h.hearing_type}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs">
                    <span className="font-bold text-[#D8BB7A]">
                      {timeStr}
                    </span>
                    {h.location && (
                      <>
                        <span className="text-[#383D4B]">·</span>
                        <span className="text-[#8E95A5]">{h.location}</span>
                      </>
                    )}
                    {h.judge && (
                      <>
                        <span className="text-[#383D4B]">·</span>
                        <span className="text-[#777B80]">{h.judge}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="shrink-0 pt-0.5">
                  <Badge variant={getHearingBadgeVariant(h.status)} />
                </div>
              </Link>
            )
          })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
