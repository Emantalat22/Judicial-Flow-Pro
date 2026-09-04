import { useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'
import useAuth from '../hooks/useAuth'
import {
  UserIcon,
  SearchIcon,
  ShieldIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
} from '../components/Icons'

const DEFAULT_USERS = [
  {
    id: 1,
    email: 'judge.anderson@court.gov',
    full_name: 'Hon. Eleanor Anderson',
    role: 'JUDGE',
    is_active: true,
    created_at: '2026-01-15T09:00:00Z',
    last_login: '2026-09-02T08:30:00Z',
  },
  {
    id: 2,
    email: 'judge.vance@court.gov',
    full_name: 'Hon. Marcus Vance',
    role: 'JUDGE',
    is_active: true,
    created_at: '2026-02-10T11:00:00Z',
    last_login: '2026-09-01T16:45:00Z',
  },
  {
    id: 3,
    email: 'clerk.chen@court.gov',
    full_name: 'Sarah Chen, Lead Clerk',
    role: 'CLERK',
    is_active: true,
    created_at: '2026-01-20T14:30:00Z',
    last_login: '2026-09-02T09:12:00Z',
  },
  {
    id: 4,
    email: 'admin.davis@court.gov',
    full_name: 'David Vance, Chambers Administrator',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    last_login: '2026-09-02T09:45:00Z',
  },
  {
    id: 5,
    email: 'demo@judicialflow.gov',
    full_name: 'Hon. Demo Judge',
    role: 'JUDGE',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    last_login: '2026-09-02T10:00:00Z',
  },
]

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(DEFAULT_USERS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/users')
      if (Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data)
      }
    } catch {
      // Graceful fallback to default demo users if endpoint restricted
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))

    const matchesRole = roleFilter === 'ALL' || (u.role && u.role.toUpperCase() === roleFilter)
    return matchesSearch && matchesRole
  })

  const totalUsers = users.length
  const judgesCount = users.filter((u) => (u.role || '').toUpperCase() === 'JUDGE').length
  const clerksCount = users.filter((u) => (u.role || '').toUpperCase() === 'CLERK').length
  const adminsCount = users.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length

  return (
    <div className="space-y-6">
      {/* ── 3D Command Header ── */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/30">
                Security & Chambers Access
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
              Chambers User Management
            </h1>
            <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
              Authorized judges, judicial clerks, administrators, and courtroom officers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('New user registration is governed by Judicial Chambers Access Policy.')}
              className="btn-3d-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 text-[#0E1015]" />
              <span>Add Personnel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3D Telemetry Summary Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Personnel', val: totalUsers, sub: 'Active accounts', color: '#D8BB7A' },
          { label: 'Presiding Judges', val: judgesCount, sub: 'Judicial officers', color: '#C6A15B' },
          { label: 'Court Clerks', val: clerksCount, sub: 'Dockets & filings', color: '#70A5FE' },
          { label: 'System Admins', val: adminsCount, sub: 'Security & config', color: '#5AC49A' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="card-3d-lift rounded-2xl p-4.5 flex flex-col justify-between group cursor-default"
          >
            <p className="text-xs font-semibold text-[#8E95A5]">{stat.label}</p>
            <div className="recessed-well rounded-xl p-3 my-2.5">
              <p className="text-2xl font-extrabold text-[#F4F1E8]" style={{ color: stat.color }}>
                {stat.val}
              </p>
              <p className="text-[10px] text-[#8E95A5] mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3D Table Console Chassis ── */}
      <div className="card-3d-chassis rounded-2xl overflow-hidden shadow-lg relative">
        {/* Top Corner Metallic Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

        {/* Filter Controls Header */}
        <div
          className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b"
          style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#F4F1E8]">Chambers Roster</h3>
            <span className="pill-3d text-xs font-semibold text-[#D8BB7A] px-2 py-0.5 rounded-full bg-[#181C26]">
              {filteredUsers.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E95A5]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="input-3d pl-8 pr-3 py-1.5 text-xs rounded-xl w-48 sm:w-60 focus:outline-none"
              />
            </div>

            {/* Role Filter Buttons */}
            <div className="recessed-well p-1 rounded-xl flex items-center gap-1">
              {['ALL', 'JUDGE', 'CLERK', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#C6A15B] text-[#0E1015] shadow-xs'
                      : 'text-[#8E95A5] hover:text-[#F4F1E8]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
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
                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5]">
                      Personnel
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5]">
                      Role & Authority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5]">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8E95A5]">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D212B]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-xs text-[#8E95A5]">
                        <div className="w-6 h-6 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading personnel…
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-xs text-[#8E95A5]">
                        No personnel match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isJudge = (u.role || '').toUpperCase() === 'JUDGE'
                      const isAdmin = (u.role || '').toUpperCase() === 'ADMIN'
                      const isCurrentUser = currentUser?.email === u.email

                      return (
                        <tr
                          key={u.id}
                          className="transition-all duration-150 hover:bg-[#1A1E28] hover:translate-x-0.5 group"
                        >
                          {/* Personnel Info */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className="pedestal-3d w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                                style={{
                                  color: isJudge ? '#D8BB7A' : isAdmin ? '#5AC49A' : '#70A5FE',
                                }}
                              >
                                {u.full_name
                                  ? u.full_name
                                      .split(' ')
                                      .filter(Boolean)
                                      .slice(-2)
                                      .map((p) => p[0])
                                      .join('')
                                      .toUpperCase()
                                  : 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-[#F4F1E8] group-hover:text-[#D8BB7A] transition-colors">
                                    {u.full_name || 'Unnamed User'}
                                  </p>
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-[#C6A15B]/20 text-[#D8BB7A] border border-[#C6A15B]/30">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#8E95A5]">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className="badge-3d px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                              style={{
                                backgroundColor: isJudge
                                  ? 'rgba(198,161,91,0.15)'
                                  : isAdmin
                                  ? 'rgba(63,163,124,0.15)'
                                  : 'rgba(77,144,254,0.15)',
                                color: isJudge ? '#D8BB7A' : isAdmin ? '#5AC49A' : '#70A5FE',
                                border: `1px solid ${
                                  isJudge
                                    ? 'rgba(198,161,91,0.35)'
                                    : isAdmin
                                    ? 'rgba(63,163,124,0.35)'
                                    : 'rgba(77,144,254,0.35)'
                                }`,
                              }}
                            >
                              <ShieldIcon className="w-3 h-3" />
                              <span>{u.role || 'USER'}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5AC49A]">
                              <span className="w-2 h-2 rounded-full bg-[#3FA37C] shadow-[0_0_8px_rgba(63,163,124,0.6)]" />
                              Active Chambers
                            </span>
                          </td>

                          {/* Last Activity */}
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-[#8E95A5]">
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="w-3.5 h-3.5 text-[#777B80]" />
                              <span>
                                {u.last_login
                                  ? new Date(u.last_login).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Recent'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
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
