import { Link } from 'react-router-dom'
import { icons } from '../Icons'

function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 64
  const h = 24
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map((v) => h - ((v - min) / range) * 20 - 2)
  const polyPoints = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
  const areaPath = `M${xs[0]},${ys[0]} ` + xs.slice(1).map((x, i) => `L${x},${ys[i + 1]}`).join(' ') + ` L${w},${h} L0,${h} Z`
  const lx = xs[xs.length - 1]
  const ly = ys[ys.length - 1]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-16 h-6 shrink-0"
      aria-hidden="true"
    >
      <path d={areaPath} fill={color} opacity={0.12} />
      <polyline
        points={polyPoints}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  )
}

const accentConfig = {
  navy: {
    iconBg: 'rgba(198,161,91,0.12)',
    iconColor: 'text-[#C6A15B]',
    deltaUp: '#5AC49A',
    deltaDown: '#E08080',
    deltaNeutral: '#8E95A5',
    spark: '#C6A15B',
  },
  gold: {
    iconBg: 'rgba(198,161,91,0.12)',
    iconColor: 'text-[#D8BB7A]',
    deltaUp: '#5AC49A',
    deltaDown: '#E08080',
    deltaNeutral: '#8E95A5',
    spark: '#D8BB7A',
  },
  royal: {
    iconBg: 'rgba(112,165,254,0.12)',
    iconColor: 'text-[#70A5FE]',
    deltaUp: '#5AC49A',
    deltaDown: '#E08080',
    deltaNeutral: '#8E95A5',
    spark: '#70A5FE',
  },
  green: {
    iconBg: 'rgba(63,163,124,0.12)',
    iconColor: 'text-[#5AC49A]',
    deltaUp: '#5AC49A',
    deltaDown: '#E08080',
    deltaNeutral: '#8E95A5',
    spark: '#3FA37C',
  },
}

export default function StatCard({ label, value, delta, deltaType, iconKey, accent, spark, to }) {
  const c = accentConfig[accent] ?? accentConfig.navy
  const Icon = icons[iconKey]

  const deltaColor =
    deltaType === 'up' ? c.deltaUp :
    deltaType === 'down' ? c.deltaDown :
    c.deltaNeutral

  const cardContent = (
    <div className="card-3d-chassis card-3d-tilt rounded-2xl p-4.5 flex flex-col justify-between h-full group cursor-pointer overflow-hidden">
      {/* Top Corner Metallic Gold Inlay Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

      {/* Top Row: 3D Raised Icon Pedestal + Sparkline */}
      <div className="flex items-start justify-between">
        <div
          className="pedestal-3d w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            borderColor: 'rgba(198,161,91,0.35)',
          }}
        >
          {Icon && <Icon className={`w-5 h-5 ${c.iconColor} drop-shadow-sm`} />}
        </div>
        <div className="pt-1">
          <Sparkline points={spark} color={c.spark} />
        </div>
      </div>

      {/* Recessed Gauge / Readout Tray */}
      <div className="recessed-well rounded-xl p-3 mt-3.5 transition-all group-hover:border-[rgba(198,161,91,0.25)]">
        <p className="text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-sm">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-[#8E95A5] mt-0.5 tracking-wide">{label}</p>
      </div>

      {delta && (
        <div
          className="pt-2.5 border-t mt-3 flex items-center justify-between text-xs"
          style={{ borderColor: 'rgba(46, 52, 66, 0.7)' }}
        >
          <span className="font-semibold flex items-center gap-1.5" style={{ color: deltaColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deltaColor }} />
            {delta}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#777B80] group-hover:text-[#D8BB7A] transition-colors">
            Telemetry
          </span>
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block no-underline h-full cursor-pointer">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
