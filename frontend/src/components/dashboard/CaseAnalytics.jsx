import useCaseStats from '../../hooks/useCaseStats'

const stageColors = {
  FILED:        { donutColor: '#C6A15B', textColor: '#D8BB7A' },
  UNDER_REVIEW: { donutColor: '#8F713E', textColor: '#C6A15B' },
  ASSIGNED:     { donutColor: '#70A5FE', textColor: '#93C5FD' },
  HEARING:      { donutColor: '#C084FC', textColor: '#D8B4FE' },
  DECISION:     { donutColor: '#B95353', textColor: '#E08080' },
  CLOSED:       { donutColor: '#3FA37C', textColor: '#5AC49A' },
}

function buildFilingsTrend(cases, monthCount = 8) {
  const now = new Date()
  const months = []
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      filed: 0,
    })
  }
  cases.forEach((c) => {
    if (!c.filing_date) return
    const d = new Date(c.filing_date)
    if (isNaN(d.getTime())) return
    const entry = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (entry) entry.filed++
  })
  return months
}

function StatusDonutChart({ stages }) {
  const total = stages.reduce((s, d) => s + d.count, 0)
  const R = 54
  const C = 2 * Math.PI * R

  let offset = 0
  const segments = stages.map((item) => {
    const frac = total > 0 ? item.count / total : 0
    const seg = { ...item, frac, offset }
    offset += frac
    return seg
  })

  return (
    <div>
      <h4 className="text-sm font-bold text-[#F4F1E8] mb-4">Case Status Distribution</h4>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 140 140" className="w-40 h-40 -rotate-90 filter drop-shadow-md">
            {/* Recessed Track */}
            <circle cx="70" cy="70" r={R} fill="none" stroke="#0B0D13" strokeWidth="15" />
            <circle cx="70" cy="70" r={R} fill="none" stroke="#222836" strokeWidth="13" />
            {/* Segments */}
            {segments.map((seg) => (
              <circle
                key={seg.key}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={stageColors[seg.key]?.donutColor || '#C6A15B'}
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(seg.frac * C - 3, 0)} ${C}`}
                strokeDashoffset={`${-seg.offset * C}`}
              />
            ))}
          </svg>
          {/* Raised 3D Center Hub */}
          <div className="absolute w-20 h-20 rounded-full flex flex-col items-center justify-center pointer-events-none pedestal-3d">
            <p className="text-2xl font-extrabold leading-none text-[#F4F1E8] drop-shadow-sm">{total}</p>
            <p className="text-[10px] uppercase font-bold text-[#8E95A5] mt-1 tracking-wider">Total Cases</p>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 mt-5 w-full max-w-xs">
          {segments.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
            const col = stageColors[item.key] || { donutColor: '#C6A15B', textColor: '#D8BB7A' }
            return (
              <div key={item.key} className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.donutColor }} />
                <span className="text-xs text-[#8E95A5] truncate">{item.label}</span>
                <span className="text-xs font-bold ml-auto shrink-0" style={{ color: col.textColor }}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FilingsTrendChart({ trend }) {
  const max = Math.max(...trend.map((d) => d.filed), 1)
  const currentMonth = trend[trend.length - 1]?.month

  return (
    <div>
      <h4 className="text-sm font-bold text-[#F4F1E8] mb-4">Monthly Case Filings</h4>
      <div className="relative h-36">
        {/* Grid lines */}
        {[0, 25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute w-full pointer-events-none border-t"
            style={{ top: `${pct}%`, borderColor: '#262B35' }}
          />
        ))}
        {/* Bars */}
        <div className="relative z-10 flex items-end gap-2 h-full pb-6">
          {trend.map((item, idx) => {
            const heightPct = Math.round((item.filed / max) * 100)
            const isLatest = idx === trend.length - 1
            return (
              <div key={item.key} className="flex flex-col items-center flex-1 gap-1 group h-full justify-end">
                <span
                  className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
                    isLatest ? 'text-[#D8BB7A]' : 'text-[#8E95A5]'
                  }`}
                >
                  {item.filed}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${heightPct * 0.72}%`,
                    backgroundColor: isLatest ? '#C6A15B' : '#2D323E',
                    boxShadow: isLatest ? '0 0 10px rgba(198,161,91,0.3)' : 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2">
          {trend.map((item, idx) => (
            <div key={item.key} className="flex-1 text-center">
              <span
                className={`text-[11px] font-semibold ${
                  idx === trend.length - 1 ? 'text-[#D8BB7A] font-bold' : 'text-[#777B80]'
                }`}
              >
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-[#8E95A5] mt-2">
        New cases filed per month — {currentMonth} is current month
      </p>
    </div>
  )
}

export default function CaseAnalytics() {
  const { stages, cases, loading, error, refetch } = useCaseStats()

  return (
    <div
      className="panel-3d rounded-2xl overflow-hidden"
    >
      {/* Header strip */}
      <div
        className="px-6 py-4.5 border-b"
        style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
      >
        <h3 className="text-sm font-bold text-[#F4F1E8]">Case Analytics</h3>
        <p className="text-xs text-[#8E95A5] mt-0.5">Distribution and filing overview</p>
      </div>

      {loading ? (
        <div className="p-10 text-center space-y-2">
          <div className="w-6 h-6 mx-auto border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8E95A5]">Loading case analytics...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-xs text-[#B95353]">{error}</p>
          <button
            onClick={refetch}
            className="text-xs text-[#C6A15B] hover:underline font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 p-5">
          <div className="recessed-data-bay p-5 rounded-2xl border border-[rgba(46,52,66,0.85)] flex flex-col justify-between">
            <StatusDonutChart stages={stages} />
          </div>
          <div className="recessed-data-bay p-5 rounded-2xl border border-[rgba(46,52,66,0.85)] flex flex-col justify-between">
            <FilingsTrendChart trend={buildFilingsTrend(cases)} />
          </div>
        </div>
      )}
    </div>
  )
}
