import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { ScalesIcon } from './Icons'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#0E1015' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse shadow-2xl"
            style={{
              backgroundColor: 'rgba(198,161,91,0.12)',
              border: '1px solid rgba(198,161,91,0.3)',
              color: '#C6A15B',
            }}
          >
            <ScalesIcon className="w-8 h-8" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-sm font-bold tracking-wider uppercase text-[#D8BB7A]">
              Judicial Flow Pro
            </h2>
            <p className="text-xs text-[#777B80]">Validating judicial credentials…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
