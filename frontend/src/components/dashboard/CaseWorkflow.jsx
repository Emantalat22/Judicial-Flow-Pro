import useCaseStats from '../../hooks/useCaseStats'

const stageIcons = ['I', 'II', 'III', 'IV', 'V', 'VI']

export default function CaseWorkflow() {
  const { stages, total, loading, error, refetch } = useCaseStats()

  // The furthest stage currently holding cases is the court's active stage
  const activeIdx = stages.reduce((acc, s, i) => (s.count > 0 ? i : acc), -1)
  const activeStages = stages.filter((s) => s.count > 0).length
  const totalCases = total || 0

  return (
    <div
      className="panel-3d rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-6 py-4.5 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
      >
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#F4F1E8]">Judicial Case Flow</h3>
          <p className="text-xs text-[#8E95A5] mt-0.5">
            {loading
              ? 'Loading case workflow…'
              : `Live workflow — ${total} case${total === 1 ? '' : 's'} in the system`}
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full shadow-xs"
          style={{
            backgroundColor: 'rgba(198,161,91,0.12)',
            color: '#D8BB7A',
            border: '1px solid rgba(198,161,91,0.3)',
          }}
        >
          {`${totalCases} Cases · ${activeStages} Workflow Stages`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-10 text-center space-y-2">
          <div className="w-6 h-6 mx-auto border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#8E95A5]">Loading case workflow...</p>
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
        <>
          {/* Steps */}
          <div className="px-5 py-9">
            <div className="relative flex items-start">
              {/* 3D Recessed Conduit Tray */}
              <div
                className="conduit-track absolute top-4.5 h-3.5 z-0 rounded-full"
                style={{ left: '6%', right: '6%' }}
              />
              {/* 3D Golden Illuminated Core Conduit */}
              <div
                className="absolute top-5.5 h-1.5 z-0 rounded-full transition-all duration-700"
                style={{
                  left: '6%',
                  width: activeIdx > 0 ? `calc(${(activeIdx / (stages.length - 1)) * 88}%)` : '0%',
                  background: 'linear-gradient(90deg, #8F713E 0%, #C6A15B 50%, #E8D09A 100%)',
                  boxShadow: '0 0 12px rgba(198, 161, 91, 0.8), 0 0 4px rgba(255, 242, 209, 0.9)',
                }}
              />

              {stages.map((step, idx) => {
                const isPast = idx < activeIdx
                const isActive = idx === activeIdx

                return (
                  <div
                    key={step.key}
                    className="relative z-10 flex flex-col items-center flex-1 min-w-0 px-1"
                  >
                    {/* 3D Physical Node Puck */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-default ${
                        isActive
                          ? 'node-puck-active ring-4 ring-[#C6A15B]/30 text-[#FFF2D1] scale-110 z-20'
                          : isPast
                          ? 'node-puck text-[#D8BB7A] hover:scale-105'
                          : 'node-puck border-[#2B313F] text-[#777B80] opacity-80'
                      }`}
                    >
                      {isPast ? (
                        <svg
                          className="w-4 h-4 text-[#D8BB7A] drop-shadow-sm"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="drop-shadow-sm">{stageIcons[idx]}</span>
                      )}
                    </div>

                    {/* Elliptical Cast Shadow Beneath Node */}
                    <div
                      className="w-7 h-1.5 rounded-full bg-black/60 blur-[1px] mt-1 pointer-events-none"
                      aria-hidden="true"
                    />

                    {/* Label */}
                    <p
                      className={`mt-2 text-xs font-bold text-center leading-tight tracking-wide ${
                        isActive ? 'text-[#D8BB7A] drop-shadow-sm' : isPast ? 'text-[#F4F1E8]' : 'text-[#777B80]'
                      }`}
                    >
                      {step.label}
                    </p>

                    {/* Count pill inside mini recessed well */}
                    <div
                      className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#C6A15B]/20 text-[#D8BB7A] border border-[#C6A15B]/50 shadow-[0_0_10px_rgba(198,161,91,0.2)]'
                          : isPast
                          ? 'recessed-well text-[#8E95A5]'
                          : 'bg-[#12141C] text-[#6B7280] border border-[#202530]'
                      }`}
                    >
                      {step.count}
                    </div>

                    {/* Description — md+ only */}
                    <p
                      className={`mt-1 text-[11px] text-center leading-tight px-1 hidden md:block ${
                        isActive ? 'text-[#8E95A5]' : 'text-[#777B80]'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Percentage Bar */}
          <div
            className="px-6 py-3 flex items-center gap-5 overflow-x-auto border-t"
            style={{ backgroundColor: 'rgba(17, 19, 26, 0.65)', borderColor: 'rgba(46, 52, 66, 0.85)' }}
          >
            {stages.map((step, idx) => {
              const pct = total > 0 ? Math.round((step.count / total) * 100) : 0
              const isActive = idx === activeIdx
              return (
                <div key={step.key} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-[#D8BB7A]' : idx < activeIdx ? 'bg-[#C6A15B]' : 'bg-[#383D4B]'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isActive ? 'text-[#D8BB7A] font-bold' : 'text-[#8E95A5]'
                    }`}
                  >
                    {step.label}: {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
