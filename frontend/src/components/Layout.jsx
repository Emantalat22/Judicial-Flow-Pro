import { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import apiClient from '../api/client'
import CourthouseBackground from './ui/CourthouseBackground'
import {
  ScalesIcon,
  HomeIcon,
  BriefcaseIcon,
  CalendarIcon,
  FileIcon,
  SparklesIcon,
  BellIcon,
  SettingsIcon,
  SearchIcon,
  MenuIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  LogoutIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  ExternalLinkIcon,
} from './Icons'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',    Icon: HomeIcon },
  { to: '/cases',         label: 'Cases',         Icon: BriefcaseIcon },
  { to: '/hearings',      label: 'Hearings',      Icon: CalendarIcon },
  { to: '/documents',     label: 'Documents',     Icon: FileIcon },
  { to: '/tasks',         label: 'Tasks',         Icon: CheckCircleIcon },
  { to: '/ai',            label: 'AI Assistant',  Icon: SparklesIcon },
  { to: '/notifications', label: 'Notifications', Icon: BellIcon },
]

const pageTitles = {
  '/dashboard':     'Dashboard',
  '/cases':         'Case Management',
  '/hearings':      'Hearings',
  '/documents':     'Documents',
  '/tasks':         'Tasks & Action Items',
  '/ai':            'AI Assistant',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
}

const TYPE_CONFIG = {
  HEARING_SCHEDULED: { icon: CalendarIcon, color: '#70A5FE', bg: 'rgba(77,144,254,0.12)' },
  TASK_ASSIGNED:     { icon: CheckCircleIcon, color: '#5AC49A', bg: 'rgba(63,163,124,0.12)' },
  CASE_ALERT:        { icon: BriefcaseIcon, color: '#D8BB7A', bg: 'rgba(198,161,91,0.12)' },
  DOCUMENT_UPLOADED: { icon: FileIcon, color: '#C084FC', bg: 'rgba(192,132,252,0.12)' },
  DEADLINE_URGENT:   { icon: AlertTriangleIcon, color: '#E08080', bg: 'rgba(185,83,83,0.15)' },
  SYSTEM:            { icon: BellIcon, color: '#A9AAA7', bg: 'rgba(119,123,128,0.12)' },
}

const formatDropdownTime = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const diffSec = Math.floor((new Date() - d) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

function SidebarCourthouseArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 290"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="sColGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#C6A15B" stopOpacity="0.12" />
          <stop offset="40%"  stopColor="#D8BB7A" stopOpacity="0.09" />
          <stop offset="70%"  stopColor="#C6A15B" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#8F713E" stopOpacity="0.11" />
        </linearGradient>
        <linearGradient id="sPedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#D8BB7A" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#8F713E" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Columns & Pediment Art */}
      <polygon points="110,12 18,65 202,65" stroke="#C6A15B" strokeWidth="1.2" strokeOpacity="0.3" fill="url(#sPedGrad)" />
      <polygon points="110,24 35,62 185,62" stroke="#8F713E" strokeWidth="0.8" strokeOpacity="0.2" fill="none" />
      <circle cx="110" cy="48" r="10" stroke="#C6A15B" strokeWidth="1" strokeOpacity="0.3" fill="none" />
      <circle cx="110" cy="48" r="4"  fill="#C6A15B" fillOpacity="0.2" />

      <rect x="14" y="65" width="192" height="7" fill="url(#sPedGrad)" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.3" />
      <rect x="10" y="72" width="200" height="4" fill="#C6A15B" fillOpacity="0.06" stroke="#8F713E" strokeWidth="0.6" strokeOpacity="0.25" />

      {[26, 68, 110, 152, 194].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 7} y="76" width="14" height="4" rx="1" fill="#C6A15B" fillOpacity="0.1" stroke="#C6A15B" strokeWidth="0.6" strokeOpacity="0.25" />
          <rect x={cx - 5} y="80" width="10" height="152" fill="url(#sColGrad)" />
          <line x1={cx - 3} y1="80" x2={cx - 3} y2="232" stroke="#D8BB7A" strokeWidth="0.6" strokeOpacity="0.15" />
          <line x1={cx}     y1="80" x2={cx}     y2="232" stroke="#C6A15B" strokeWidth="0.8" strokeOpacity="0.18" />
          <line x1={cx + 3} y1="80" x2={cx + 3} y2="232" stroke="#8F713E" strokeWidth="0.6" strokeOpacity="0.12" />
          <rect x={cx - 8} y="232" width="16" height="5" rx="1" fill="#C6A15B" fillOpacity="0.1" stroke="#C6A15B" strokeWidth="0.6" strokeOpacity="0.25" />
        </g>
      ))}

      <line x1="8"  y1="237" x2="212" y2="237" stroke="#C6A15B" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="4"  y1="243" x2="216" y2="243" stroke="#8F713E" strokeWidth="1"   strokeOpacity="0.25" />
      <line x1="0"  y1="249" x2="220" y2="249" stroke="#6E624A" strokeWidth="0.8" strokeOpacity="0.2" />
    </svg>
  )
}

function getRoleInfo(role) {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN':
      return { label: 'Administrator', badgeBg: 'rgba(198,161,91,0.15)', badgeBorder: '#C6A15B', badgeText: '#D8BB7A' }
    case 'JUDGE':
      return { label: 'Presiding Judge', badgeBg: 'rgba(185,83,83,0.15)', badgeBorder: '#B95353', badgeText: '#E08080' }
    case 'CLERK':
      return { label: 'Court Clerk', badgeBg: 'rgba(77,144,254,0.15)', badgeBorder: '#4D90FE', badgeText: '#70A5FE' }
    default:
      return { label: 'Judicial Staff', badgeBg: 'rgba(119,123,128,0.15)', badgeBorder: '#777B80', badgeText: '#A9AAA7' }
  }
}

export default function Layout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifs, setRecentNotifs] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notifications/unread-count')
      setUnreadCount(data?.unread_count || 0)
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err)
    }
  }, [])

  const fetchRecentNotifications = useCallback(async () => {
    setNotifsLoading(true)
    try {
      const { data } = await apiClient.get('/notifications', { params: { limit: 5 } })
      setRecentNotifs(data || [])
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err)
    } finally {
      setNotifsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    setProfileDropdownOpen(false)
    setNotifDropdownOpen(false)
    fetchUnreadCount()
  }, [location.pathname, fetchUnreadCount])

  const handleToggleNotifDropdown = () => {
    const nextState = !notifDropdownOpen
    setNotifDropdownOpen(nextState)
    if (nextState) {
      fetchRecentNotifications()
      fetchUnreadCount()
    }
  }

  const handleMarkAsRead = async (notif, e) => {
    if (e) e.stopPropagation()
    if (notif.is_read) return
    try {
      await apiClient.put(`/notifications/${notif.id}/read`)
      setRecentNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleNotificationClick = async (notif) => {
    await handleMarkAsRead(notif)
    setNotifDropdownOpen(false)
    if (notif.link) {
      navigate(notif.link)
    } else {
      navigate('/notifications')
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const basePath = '/' + location.pathname.split('/')[1]
  const currentTitle = pageTitles[basePath] || 'Overview'
  const showCrumb = basePath !== '/dashboard'

  const roleInfo = getRoleInfo(user?.role)
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const headerDisplayName = displayName
    .replace(/\s*demo\s*judge/i, '')
    .trim()
    .replace(/\.$/, '') || displayName
  const userInitials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#0E1015', color: '#F4F1E8' }}
    >
      {/* ── Mobile backdrop ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: '#111316',
          borderRight: '1px solid #202327',
          width: '16rem',
        }}
      >
        {/* Logo band */}
        <div
          className="h-16 flex items-center gap-3 px-5 shrink-0"
          style={{ borderBottom: '1px solid #202327' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
            style={{
              backgroundColor: 'rgba(198,161,91,0.12)',
              border: '1px solid rgba(198,161,91,0.3)',
              color: '#C6A15B',
            }}
          >
            <ScalesIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-sm font-bold tracking-tight truncate leading-tight"
              style={{ color: '#F4F1E8' }}
            >
              Judicial Flow Pro
            </h1>
            <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: '#8E95A5' }}>
              Court Management System
            </p>
          </div>
        </div>

        {/* Navigation & Courthouse Silhouette */}
        <div className="relative flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          {/* Subtle courthouse watermark in sidebar */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-center pb-2 opacity-35">
            <SidebarCourthouseArt className="w-48 h-auto" />
          </div>

          {/* Nav links */}
          <nav className="relative z-10 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.Icon
              const isNotificationsItem = item.to === '/notifications'
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold
                    transition-all duration-200 group cursor-pointer
                    ${isActive
                      ? 'nav-item-3d-active'
                      : 'text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-[#1A1D26] hover:translate-x-1'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-[#C6A15B]' : 'text-[#8E95A5] group-hover:text-[#F4F1E8]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {/* Sidebar unread count badge */}
                      {isNotificationsItem && unreadCount > 0 && (
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: 'rgba(198,161,91,0.2)', color: '#D8BB7A', border: '1px solid rgba(198,161,91,0.3)' }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom Settings Link & Active Session */}
          <div className="relative z-10 p-3 border-t border-[#202327] space-y-2">
            <NavLink
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150 cursor-pointer
                ${isActive
                  ? 'bg-[#1E2228] text-[#F4F1E8] border border-[#383D43]'
                  : 'text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-[#1E2228]/50'
                }
              `}
            >
              <SettingsIcon className="w-4 h-4 text-[#8E95A5]" />
              <span>Settings</span>
            </NavLink>

            {/* User Session Mini Card */}
            <div className="p-2.5 rounded-xl bg-[#161922] border border-[#262B35] flex items-center gap-2.5 shadow-inner">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                style={{ backgroundColor: 'rgba(198,161,91,0.15)', color: '#D8BB7A', border: '1px solid rgba(198,161,91,0.3)' }}
              >
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#F4F1E8] truncate">
                  {displayName}
                </p>
                <p className="text-[10px] truncate" style={{ color: '#C6A15B' }}>
                  {roleInfo.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* ── Rich Dark-Gold Architectural Courthouse Background Line-Art ─ */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.22]">
          <CourthouseBackground className="w-full h-full" />
        </div>

        {/* ── Top Bar Header ──────────────────────────────────── */}
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 border-b relative z-30"
          style={{ backgroundColor: '#111316', borderColor: '#202327' }}
        >
          {/* Mobile hamburger & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-[#1E2228]"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              {showCrumb && (
                <>
                  <span className="font-medium text-[#8E95A5]">
                    Dashboard
                  </span>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-[#4A505F]" />
                </>
              )}
              <h2 className="text-sm font-bold text-[#F4F1E8] truncate">
                {currentTitle}
              </h2>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-sm ml-auto sm:ml-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A5]" />
              <input
                type="text"
                placeholder="Search cases, dockets, court records..."
                className="w-full pl-9 pr-16 py-2 text-xs rounded-xl focus:outline-none focus:border-[#C6A15B] transition-all"
                style={{
                  backgroundColor: '#1E2228',
                  border: '1px solid #262B35',
                  color: '#F4F1E8',
                }}
              />
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none hidden sm:block"
                style={{ color: '#8E95A5', backgroundColor: '#111316', border: '1px solid #262B35' }}
              >
                Ctrl /
              </span>
            </div>
          </div>

          {/* Right Header Utilities: Notifications & Profile */}
          <div className="flex items-center gap-2 ml-3">
            {/* Notification Bell with Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleToggleNotifDropdown}
                className="relative p-2 rounded-xl transition-colors text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-[#1E2228] cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150"
                    style={{
                      backgroundColor: '#C6A15B',
                      color: '#0E1015',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                  style={{ backgroundColor: '#161922', borderColor: '#262B35' }}
                >
                  {/* Dropdown Header */}
                  <div
                    className="p-3.5 border-b flex items-center justify-between"
                    style={{ backgroundColor: '#111316', borderColor: '#202327' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F4F1E8]">
                        Judicial Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: 'rgba(198,161,91,0.2)', color: '#D8BB7A' }}
                        >
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-[11px] font-semibold hover:underline"
                      style={{ color: '#C6A15B' }}
                    >
                      View All
                    </Link>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#202327]">
                    {notifsLoading ? (
                      <div className="p-6 text-center text-xs text-[#8E95A5]">
                        Loading alerts...
                      </div>
                    ) : recentNotifs.length === 0 ? (
                      <div className="p-8 text-center space-y-1">
                        <CheckCircleIcon className="w-8 h-8 text-[#8E95A5] mx-auto opacity-50" />
                        <p className="text-xs font-semibold text-[#F4F1E8]">No Notifications</p>
                        <p className="text-[11px] text-[#8E95A5]">You are completely up to date.</p>
                      </div>
                    ) : (
                      recentNotifs.map((item) => {
                        const typeConfig = TYPE_CONFIG[(item.type || 'SYSTEM').toUpperCase()] || TYPE_CONFIG.SYSTEM
                        const TypeIcon = typeConfig.icon
                        const isUnread = !item.is_read

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#1E2228] ${
                              isUnread ? 'bg-[#1E2228]/60' : 'bg-transparent'
                            }`}
                          >
                            {/* Type Icon */}
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{
                                backgroundColor: typeConfig.bg,
                                color: typeConfig.color,
                              }}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                            </div>

                            {/* Body */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-bold truncate ${isUnread ? 'text-[#F4F1E8]' : 'text-[#8E95A5]'}`}>
                                  {item.title}
                                </p>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full shrink-0 bg-[#C6A15B]" />
                                )}
                              </div>
                              <p className="text-[11px] text-[#8E95A5] line-clamp-2 mt-0.5 leading-snug">
                                {item.message}
                              </p>
                              <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] text-[#777B80]">
                                <span>{formatDropdownTime(item.created_at)}</span>
                                {item.link && (
                                  <span className="text-[#C6A15B] flex items-center gap-0.5 font-semibold">
                                    View <ExternalLinkIcon className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div
                    className="p-2.5 border-t text-center"
                    style={{ backgroundColor: '#111316', borderColor: '#202327' }}
                  >
                    <Link
                      to="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="block w-full py-1.5 text-xs font-bold hover:underline"
                      style={{ color: '#C6A15B' }}
                    >
                      View All Notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px mx-1 bg-[#202327]" />

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#1E2228] transition-colors cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                  style={{
                    backgroundColor: 'rgba(198,161,91,0.15)',
                    border: '1px solid rgba(198,161,91,0.3)',
                    color: '#D8BB7A',
                  }}
                >
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#F4F1E8] leading-tight truncate max-w-[120px]">
                    {headerDisplayName}
                  </p>
                  <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#C6A15B' }}>
                    {roleInfo.label}
                  </p>
                </div>
                <ChevronDownIcon className="w-3.5 h-3.5 text-[#8E95A5]" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                  style={{ backgroundColor: '#161922', borderColor: '#262B35' }}
                >
                  <div
                    className="p-3.5 border-b"
                    style={{ backgroundColor: '#111316', borderColor: '#202327' }}
                  >
                    <p className="text-xs font-bold text-[#F4F1E8] truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-[#8E95A5] truncate mt-0.5">
                      {user?.email}
                    </p>
                    <span
                      className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: roleInfo.badgeBg,
                        color: roleInfo.badgeText,
                        border: `1px solid ${roleInfo.badgeBorder}`,
                      }}
                    >
                      {roleInfo.label}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-[#1E2228] rounded-xl transition"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Settings & Preferences
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#B95353] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                    >
                      <LogoutIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Scrollable Canvas ──────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto relative z-10"
          style={{ backgroundColor: '#0E1015' }}
        >
          <div className="p-4 lg:p-6 xl:p-8 max-w-screen-2xl mx-auto">
            <div key={location.pathname} className="page-3d-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
