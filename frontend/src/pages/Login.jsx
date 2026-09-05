import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { ScalesIcon, EyeIcon, SparklesIcon } from '../components/Icons'
import CourthouseBackground from '../components/ui/CourthouseBackground'

function EyeOffIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  )
}

export default function Login() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const from = location.state?.from?.pathname || '/dashboard'

  // When visiting the login page, clear previous session so the login page always appears first
  useEffect(() => {
    logout()
  }, [logout])

  const handleUseDemoCredentials = () => {
    setEmail('demo@judicialflow.gov')
    setPassword('JudicialDemo123!')
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      console.error('Login failed:', err)
      const detail = err.response?.data?.detail
      let errorMsg = 'Failed to sign in. Please verify your credentials.'
      if (typeof detail === 'string') {
        errorMsg = detail
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map((d) => d.msg || d.message).join(', ')
      } else if (!err.response || err.response.status >= 500 || (err.message && err.message.includes('Network Error'))) {
        errorMsg = 'Cannot connect to backend server. Please check your network connection or verify the backend service is running.'
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#0E1015' }}
    >
      {/* Rich Dark Gold Neoclassical Courthouse Architectural Artwork */}
      <CourthouseBackground className="absolute inset-0 w-full h-full opacity-45 pointer-events-none" />

      {/* Login Container */}
      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in duration-200">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div
            className="pedestal-3d w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xl mb-3 border border-[#C6A15B]/40"
            style={{
              color: '#D8BB7A',
            }}
          >
            <ScalesIcon className="w-9 h-9 drop-shadow-sm" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
            Judicial Flow Pro
          </h1>
          <p className="text-xs text-[#8E95A5]">
            Official Court Case Management & Registry Portal
          </p>
        </div>

        {/* Login Card */}
        <div
          className="card-3d-chassis rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Top Corner Metallic Gold Inlay Brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-2xl pointer-events-none" />

          <div
            className="space-y-1 pb-3 border-b"
            style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
          >
            <h2 className="text-base font-bold text-[#F4F1E8]">
              Chambers Authentication
            </h2>
            <p className="text-xs text-[#8E95A5]">
              Enter your credentials to access the judicial registry.
            </p>
          </div>

          {/* Demo Access Section */}
          <div
            className="recessed-well p-4 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D8BB7A] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C6A15B]" />
                Demo Access
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide"
                style={{
                  backgroundColor: 'rgba(198,161,91,0.12)',
                  color: '#D8BB7A',
                  border: '1px solid rgba(198,161,91,0.25)',
                }}
              >
                Public Hackathon Demo
              </span>
            </div>

            <p className="text-xs text-[#8E95A5] leading-relaxed">
              This is a public hackathon demo. Use the demo credentials below to explore Judicial Flow Pro.
            </p>

            <div
              className="p-3 rounded-lg space-y-1.5 text-xs"
              style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#8E95A5]">Email:</span>
                <span className="font-mono text-[#F4F1E8] font-medium select-all">demo@judicialflow.gov</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8E95A5]">Password:</span>
                <span className="font-mono text-[#F4F1E8] font-medium select-all">JudicialDemo123!</span>
              </div>
            </div>

            <button
              type="button"
              id="use-demo-credentials-btn"
              onClick={handleUseDemoCredentials}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-[#D8BB7A] hover:text-[#F4F1E8] active:scale-[0.99]"
              style={{
                backgroundColor: 'rgba(198,161,91,0.14)',
                border: '1px solid rgba(198,161,91,0.38)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(198,161,91,0.24)'
                e.currentTarget.style.borderColor = 'rgba(198,161,91,0.55)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(198,161,91,0.14)'
                e.currentTarget.style.borderColor = 'rgba(198,161,91,0.38)'
              }}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Use Demo Credentials</span>
            </button>
          </div>

          {error && (
            <div
              className="p-3.5 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(185,83,83,0.15)',
                border: '1px solid rgba(185,83,83,0.3)',
                color: '#E08080',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                Email Address <span className="text-[#E08080]">*</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="e.g. judge.sarah@court.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-3d w-full px-3.5 py-2.5 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95A5] mb-1.5">
                Password <span className="text-[#E08080]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-3d w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8E95A5] hover:text-[#F4F1E8] transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-3d-gold w-full py-3 px-4 rounded-xl text-xs font-bold text-[#0E1015] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0E1015] border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Chambers…</span>
                </>
              ) : (
                'Sign In to Chambers Deck'
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] leading-relaxed text-[#777B80]">
          Authorized judicial personnel only. All access and case transactions are securely logged and audited.
        </p>
      </div>
    </div>
  )
}
