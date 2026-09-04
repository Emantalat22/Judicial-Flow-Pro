import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { PlusIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from '../components/Icons'
import StatsRow from '../components/dashboard/StatsRow'
import CaseWorkflow from '../components/dashboard/CaseWorkflow'
import CaseAnalytics from '../components/dashboard/CaseAnalytics'
import PriorityActions from '../components/dashboard/PriorityActions'
import RecentCasesTable from '../components/dashboard/RecentCasesTable'
import UpcomingHearings from '../components/dashboard/UpcomingHearings'
import AICard from '../components/dashboard/AICard'
import QuickActions from '../components/dashboard/QuickActions'
import JudicialEmblem3D from '../components/dashboard/JudicialEmblem3D'

function CourthouseLineArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 700 280"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="beamGrad" cx="50%" cy="85%" r="65%">
          <stop offset="0%" stopColor="#D8BB7A" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#C6A15B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8F6B32" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pedimentCenterGlow" cx="50%" cy="40%" r="45%">
          <stop offset="0%" stopColor="#D8BB7A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C6A15B" stopOpacity="0" />
        </radialGradient>
        <filter id="courthouse3DShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* ── RADIAL GLOW & VOLUMETRIC ILLUMINATION behind building ── */}
      <ellipse cx="350" cy="230" rx="240" ry="85" fill="url(#beamGrad)" />
      <ellipse cx="350" cy="110" rx="140" ry="60" fill="url(#pedimentCenterGlow)" />

      {/* ── RADIATING BEAMS ── */}
      {[
        [350,240, 0,0],   [350,240, 117,0],  [350,240, 233,0],
        [350,240, 467,0], [350,240, 583,0],  [350,240, 700,0],
        [350,240, 0,160], [350,240, 700,160],
        [350,240, 30,280],[350,240, 670,280],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#8F6B32" strokeWidth="1" strokeOpacity="0.4"
        />
      ))}

      {/* ── 3D SHADOWED ARCHITECTURAL STRUCTURE ── */}
      <g filter="url(#courthouse3DShadow)">
        {/* ══════ LEFT WING ══════ */}
        <rect x="60" y="158" width="175" height="78"
          fill="none" stroke="#B08A45" strokeWidth="1.4"
        />
        <line x1="60" y1="158" x2="235" y2="158" stroke="#C6A15B" strokeWidth="2.2" />
        <line x1="100" y1="158" x2="100" y2="236" stroke="#B08A45" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="195" y1="158" x2="195" y2="236" stroke="#B08A45" strokeWidth="1" strokeOpacity="0.8" />
        <rect x="72" y="170" width="22" height="32" rx="2" fill="none" stroke="#B08A45" strokeWidth="1.2" />
        <line x1="72" y1="182" x2="94" y2="182" stroke="#8F6B32" strokeWidth="1" strokeOpacity="0.75" />
        <rect x="112" y="170" width="22" height="32" rx="2" fill="none" stroke="#B08A45" strokeWidth="1.2" />
        <line x1="112" y1="182" x2="134" y2="182" stroke="#8F6B32" strokeWidth="1" strokeOpacity="0.75" />
        <rect x="72" y="210" width="22" height="18" rx="2" fill="none" stroke="#8F6B32" strokeWidth="1.1" strokeOpacity="0.85" />
        <rect x="112" y="210" width="22" height="18" rx="2" fill="none" stroke="#8F6B32" strokeWidth="1.1" strokeOpacity="0.85" />

        {/* ══════ RIGHT WING ══════ */}
        <rect x="465" y="158" width="175" height="78"
          fill="none" stroke="#B08A45" strokeWidth="1.4"
        />
        <line x1="465" y1="158" x2="640" y2="158" stroke="#C6A15B" strokeWidth="2.2" />
        <line x1="505" y1="158" x2="505" y2="236" stroke="#B08A45" strokeWidth="1" strokeOpacity="0.8" />
        <line x1="600" y1="158" x2="600" y2="236" stroke="#B08A45" strokeWidth="1" strokeOpacity="0.8" />
        <rect x="476" y="170" width="22" height="32" rx="2" fill="none" stroke="#B08A45" strokeWidth="1.2" />
        <line x1="476" y1="182" x2="498" y2="182" stroke="#8F6B32" strokeWidth="1" strokeOpacity="0.75" />
        <rect x="516" y="170" width="22" height="32" rx="2" fill="none" stroke="#B08A45" strokeWidth="1.2" />
        <line x1="516" y1="182" x2="538" y2="182" stroke="#8F6B32" strokeWidth="1" strokeOpacity="0.75" />
        <rect x="476" y="210" width="22" height="18" rx="2" fill="none" stroke="#8F6B32" strokeWidth="1.1" strokeOpacity="0.85" />
        <rect x="516" y="210" width="22" height="18" rx="2" fill="none" stroke="#8F6B32" strokeWidth="1.1" strokeOpacity="0.85" />

        {/* ══════ CENTRAL BLOCK WALLS ══════ */}
        <line x1="235" y1="138" x2="235" y2="236" stroke="#8F6B32" strokeWidth="1.2" strokeOpacity="0.7" />
        <line x1="465" y1="138" x2="465" y2="236" stroke="#8F6B32" strokeWidth="1.2" strokeOpacity="0.7" />

        {/* ══════ ENTABLATURE ══════ */}
        <line x1="222" y1="138" x2="478" y2="138"
          stroke="#D8BB7A" strokeWidth="2.8"
        />
        <line x1="225" y1="146" x2="475" y2="146"
          stroke="#B08A45" strokeWidth="1.4" strokeOpacity="0.9"
        />
        <line x1="223" y1="154" x2="477" y2="154"
          stroke="#C6A15B" strokeWidth="2"
        />
        {[240,262,284,306,328,350,372,394,416,438,460].map((x,i) => (
          <line key={i} x1={x} y1="146" x2={x} y2="154"
            stroke="#B08A45" strokeWidth="1.8" strokeOpacity="0.85"
          />
        ))}

        {/* ══════ PEDIMENT ══════ */}
        <path d="M222 138 L350 20 L478 138"
          fill="none" stroke="#D8BB7A" strokeWidth="2.8"
        />
        <path d="M244 138 L350 42 L456 138"
          fill="none" stroke="#B08A45" strokeWidth="1.4" strokeOpacity="0.75"
        />
        {/* Tympanum */}
        <circle cx="350" cy="90" r="22"
          fill="none" stroke="#D8BB7A" strokeWidth="2.2"
        />
        <circle cx="350" cy="90" r="12"
          fill="none" stroke="#B08A45" strokeWidth="1.5" strokeOpacity="0.85"
        />
        <circle cx="350" cy="90" r="4"
          fill="#D8BB7A" fillOpacity="0.9"
          stroke="#B08A45" strokeWidth="1.2"
        />

        {/* ══════ 4 COLUMNS ══════ */}
        {[272, 315, 385, 428].map((x, i) => (
          <g key={i}>
            <line x1={x-12} y1="154" x2={x+12} y2="154"
              stroke="#D8BB7A" strokeWidth="2.8"
            />
            <line x1={x} y1="154" x2={x} y2="218"
              stroke="#D8BB7A" strokeWidth="3"
            />
            <line x1={x-12} y1="218" x2={x+12} y2="218"
              stroke="#D8BB7A" strokeWidth="2.8"
            />
            <line x1={x-16} y1="224" x2={x+16} y2="224"
              stroke="#B08A45" strokeWidth="1.8" strokeOpacity="0.9"
            />
          </g>
        ))}

        {/* ══════ STEPS ══════ */}
        <line x1="218" y1="236" x2="482" y2="236" stroke="#C6A15B" strokeWidth="2.4" />
        <line x1="196" y1="244" x2="504" y2="244" stroke="#B08A45" strokeWidth="2" strokeOpacity="0.9" />
        <line x1="174" y1="252" x2="526" y2="252" stroke="#B08A45" strokeWidth="1.8" strokeOpacity="0.85" />
        <line x1="152" y1="260" x2="548" y2="260" stroke="#8F6B32" strokeWidth="1.5" strokeOpacity="0.75" />
        <line x1="130" y1="268" x2="570" y2="268" stroke="#8F6B32" strokeWidth="1.2" strokeOpacity="0.6" />

        {/* Wing-to-step connectors */}
        <line x1="60" y1="236" x2="196" y2="244" stroke="#8F6B32" strokeWidth="1.2" strokeOpacity="0.65" />
        <line x1="640" y1="236" x2="504" y2="244" stroke="#8F6B32" strokeWidth="1.2" strokeOpacity="0.65" />

        {/* Ground line */}
        <line x1="40" y1="272" x2="660" y2="272"
          stroke="#8F6B32" strokeWidth="1" strokeOpacity="0.5"
        />
      </g>
    </svg>
  )
}

function PageCourthouseBg({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 600"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pageCourthouseDepthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D8BB7A" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#C6A15B" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#5C4520" stopOpacity="0.04" />
        </linearGradient>
        <filter id="pageCourthouseGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#C6A15B" floodOpacity="0.12" />
        </filter>
      </defs>
      <g stroke="url(#pageCourthouseDepthGrad)" strokeWidth="1.2" filter="url(#pageCourthouseGlow)">
        <path d="M20 180 L150 60 L280 180 Z" />
        <path d="M46 172 L150 88 L254 172" />
        <line x1="14" y1="186" x2="286" y2="186" />
        <line x1="12" y1="198" x2="288" y2="198" />
        <line x1="38" y1="204" x2="66" y2="204" />
        <line x1="86" y1="204" x2="114" y2="204" />
        <line x1="134" y1="204" x2="162" y2="204" />
        <line x1="182" y1="204" x2="210" y2="204" />
        <line x1="230" y1="204" x2="258" y2="204" />
        <line x1="16" y1="204" x2="36" y2="204" />
        <line x1="260" y1="204" x2="280" y2="204" />
        <line x1="52" y1="204" x2="52" y2="410" />
        <line x1="100" y1="204" x2="100" y2="410" />
        <line x1="148" y1="204" x2="148" y2="410" />
        <line x1="196" y1="204" x2="196" y2="410" />
        <line x1="244" y1="204" x2="244" y2="410" />
        <line x1="24" y1="204" x2="24" y2="410" />
        <line x1="272" y1="204" x2="272" y2="410" />
        <line x1="38" y1="410" x2="66" y2="410" />
        <line x1="86" y1="410" x2="114" y2="410" />
        <line x1="134" y1="410" x2="162" y2="410" />
        <line x1="182" y1="410" x2="210" y2="410" />
        <line x1="230" y1="410" x2="258" y2="410" />
        <line x1="14" y1="410" x2="36" y2="410" />
        <line x1="260" y1="410" x2="284" y2="410" />
        <line x1="8" y1="420" x2="292" y2="420" />
        <line x1="4" y1="434" x2="296" y2="434" />
        <line x1="0" y1="448" x2="300" y2="448" />
        <circle cx="150" cy="128" r="12" />
      </g>
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)
  const [metrics, setMetrics] = useState({
    todayHearings: 0,
    urgentTasks: 0,
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const handleMetricsLoaded = useCallback((loadedMetrics) => {
    setMetrics({
      todayHearings: loadedMetrics.todayHearings || 0,
      urgentTasks: loadedMetrics.urgentTasks || 0,
    })
  }, [])

  const handleTaskCompleted = useCallback(() => {
    // Increment key to trigger live re-fetch in StatsRow
    setStatsRefreshKey((prev) => prev + 1)
  }, [])

  const getTimeGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const rawName = user?.full_name?.trim() || ''
  const isDemoPlaceholder = !rawName || /demo\s*judge/i.test(rawName)
  const timeGreeting = getTimeGreeting()
  const greetingHeadline = isDemoPlaceholder ? timeGreeting : `${timeGreeting}, ${rawName}`

  return (
    <div className="relative space-y-6">
      {/* ── Layered Atmospheric Depth Gradients (Command Center Ambience) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft upper central golden spotlight */}
        <div
          className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full blur-3xl opacity-35"
          style={{
            background: 'radial-gradient(ellipse, rgba(198,161,91,0.18) 0%, rgba(14,16,21,0) 70%)',
          }}
        />
        {/* Subtle left atmospheric accent */}
        <div
          className="absolute top-1/4 -left-48 w-[650px] h-[650px] rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(198,161,91,0.12) 0%, rgba(14,16,21,0) 70%)',
          }}
        />
      </div>

      {/* ── Background courthouse line silhouette with 3D depth integration ── */}
      <div
        className="fixed left-0 top-0 h-full pointer-events-none overflow-hidden"
        style={{ width: '440px', zIndex: 0, opacity: 0.22 }}
      >
        <PageCourthouseBg className="w-full h-full" />
      </div>

      {/* ── All content above background ──────────────────── */}
      <div className="relative z-10 space-y-6">

        {/* ── 3D Command Bridge Hero Environment ── */}
        <div
          className="hero-3d perspective-deck relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#C6A15B]/30 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
          style={{
            background: 'linear-gradient(135deg, rgba(26,30,42,0.98) 0%, rgba(18,21,29,0.99) 55%, rgba(11,13,18,1) 100%)',
          }}
        >
          {/* 3D Neoclassical Floor Grid converging into courthouse columns */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-25 overflow-hidden"
            aria-hidden="true"
            style={{
              perspective: '300px',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="w-full h-full origin-bottom"
              style={{
                transform: 'rotateX(60deg) translateZ(-10px)',
                backgroundImage: `
                  linear-gradient(to right, rgba(198, 161, 91, 0.25) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(198, 161, 91, 0.25) 1px, transparent 1px)
                `,
                backgroundSize: '40px 30px',
                maskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
              }}
            />
          </div>

          {/* Courthouse line art background positioned in 3D midground */}
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
            style={{
              opacity: 0.9,
              transform: 'translateZ(-30px) scale(1.05)',
              maskImage: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.95) 100%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.95) 100%)',
            }}
          >
            <CourthouseLineArt className="w-full h-full" />
          </div>

          {/* Corner gold brackets indicating high-security command console */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#D8BB7A]/80 rounded-tl-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#D8BB7A]/80 rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#D8BB7A]/40 rounded-bl-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#D8BB7A]/40 rounded-br-2xl pointer-events-none" />

          {/* Foreground Grid: 3-column layout (Telemetry & Greeting | 3D Judicial Emblem | Command Actions) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 cols: Date, Live Clock, Greeting, Status Telemetry */}
            <div className="lg:col-span-7 space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  className="pill-3d inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
                  style={{
                    color: '#C6A15B',
                    backgroundColor: 'rgba(20, 24, 33, 0.9)',
                    border: '1px solid rgba(198,161,91,0.35)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.4)',
                  }}
                >
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{dateStr}</span>
                </div>

                <div
                  className="pill-3d inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
                  style={{
                    color: '#D8BB7A',
                    backgroundColor: 'rgba(20, 24, 33, 0.9)',
                    border: '1px solid rgba(216,187,122,0.4)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.4)',
                  }}
                >
                  <ClockIcon className="w-3.5 h-3.5 shrink-0 text-[#C6A15B]" />
                  <span className="tabular-nums font-bold tracking-wide">{timeStr}</span>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#3FA37C] bg-emerald-950/40 border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3FA37C] animate-ping" />
                  Live Court Session
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
                {greetingHeadline}
              </h2>

              <p className="text-xs sm:text-sm text-[#8E95A5] leading-relaxed">
                Supreme judicial workflow & courtroom command console. Real-time docket synchronization active.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/hearings"
                  className="recessed-well flex items-center gap-2.5 px-3 py-1.5 rounded-xl group cursor-pointer transition-all hover:border-[#C6A15B]/50"
                >
                  <span className="w-2 h-2 rounded-full bg-[#C6A15B] shadow-[0_0_8px_rgba(198,161,91,0.6)]" />
                  <span className="text-xs font-semibold text-[#D8BB7A] group-hover:underline">
                    {metrics.todayHearings} hearing{metrics.todayHearings === 1 ? '' : 's'} scheduled today
                  </span>
                </Link>

                <Link
                  to="/tasks"
                  className="recessed-well flex items-center gap-2.5 px-3 py-1.5 rounded-xl group cursor-pointer transition-all hover:border-[#C6A15B]/50"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: metrics.urgentTasks > 0 ? '#B95353' : '#3FA37C',
                      boxShadow: metrics.urgentTasks > 0 ? '0 0 8px rgba(185,83,83,0.6)' : '0 0 8px rgba(63,163,124,0.6)',
                    }}
                  />
                  <span
                    className="text-xs font-semibold group-hover:underline"
                    style={{ color: metrics.urgentTasks > 0 ? '#E08080' : '#5AC49A' }}
                  >
                    {metrics.urgentTasks > 0
                      ? `${metrics.urgentTasks} urgent action${metrics.urgentTasks === 1 ? '' : 's'} required`
                      : 'All priority actions clear'}
                  </span>
                </Link>
              </div>
            </div>

            {/* Center 2 cols: 3D Floating Judicial Scales / Seal Emblem */}
            <div className="lg:col-span-2 hidden sm:flex justify-center items-center py-1">
              <JudicialEmblem3D />
            </div>

            {/* Right 3 cols: Command CTA Controls */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-3 shrink-0">
              <Link
                to="/cases"
                className="btn-3d-gold flex items-center justify-center gap-2 text-xs font-bold px-5 py-3 rounded-xl text-[#0E1015] cursor-pointer w-full sm:w-auto lg:w-full text-center"
              >
                <PlusIcon className="w-4 h-4 text-[#0E1015]" />
                <span>New Case Filing</span>
              </Link>

              <Link
                to="/tasks"
                className="btn-3d-charcoal flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl text-[#F4F1E8] cursor-pointer w-full sm:w-auto lg:w-full text-center"
              >
                <CheckCircleIcon className="w-4 h-4 text-[#C6A15B]" />
                <span>Manage Docket Tasks</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────── */}
        <StatsRow key={statsRefreshKey} onMetricsLoaded={handleMetricsLoaded} />

        {/* ── Main Row: Case Workflow + Analytics | Priority Actions + AI Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <CaseWorkflow />
            <CaseAnalytics />
          </div>
          <div className="space-y-6">
            <PriorityActions onTaskCompleted={handleTaskCompleted} />
            <AICard />
          </div>
        </div>

        {/* ── Recent Cases Table ───────────────────────────────── */}
        <RecentCasesTable />

        {/* ── Upcoming Hearings + Quick Actions ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2">
            <QuickActions />
          </div>
          <div className="lg:col-span-3">
            <UpcomingHearings />
          </div>
        </div>
      </div>
    </div>
  )
}
