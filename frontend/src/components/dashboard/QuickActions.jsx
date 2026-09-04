import { Link } from 'react-router-dom'
import { quickActions } from '../../data/dashboardData'
import { icons } from '../Icons'

export default function QuickActions() {
  return (
    <div
      className="card-3d-chassis card-3d-tilt rounded-2xl p-5 shadow-lg relative"
    >
      {/* Top Corner Metallic Gold Inlay Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

      <h3 className="text-sm font-bold text-[#F4F1E8] mb-3">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {quickActions.map((action) => {
          const Icon = icons[action.iconKey]
          const isPrimary = action.id === 1
          return (
            <Link
              key={action.id}
              to={action.to}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                isPrimary
                  ? 'btn-3d-gold text-[#0E1015]'
                  : 'btn-3d-charcoal text-[#F4F1E8]'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isPrimary ? 'text-[#0E1015]' : 'text-[#C6A15B]'
                  }`}
                />
              )}
              <span className="leading-tight">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
