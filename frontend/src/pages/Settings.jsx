import { useState } from 'react'
import { CheckCircleIcon, SparklesIcon, BellIcon, ShieldIcon, BriefcaseIcon } from '../components/Icons'

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [courtName, setCourtName] = useState('United States District Court — Northern District')
  const [docketPrefix, setDocketPrefix] = useState('CR-2026')
  const [aiAutoSync, setAiAutoSync] = useState(true)
  const [notificationsEmail, setNotificationsEmail] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState('60')

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* ── 3D Command Header ── */}
      <div className="page-header-3d p-6 sm:p-7 relative overflow-hidden">
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D8BB7A] bg-[#1E2330] border border-[#C6A15B]/30">
              System Configuration & Chambers Policy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F1E8] drop-shadow-md">
            System Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#8E95A5] mt-1">
            Configure judicial chambers parameters, docket defaults, AI engine preferences, and security thresholds.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-[#5AC49A] animate-in slide-in-from-top duration-200 shadow-xs">
          <CheckCircleIcon className="w-4 h-4 text-[#5AC49A] shrink-0" />
          <span>Judicial preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Court & Jurisdiction Card */}
        <div
          className="card-3d-chassis rounded-2xl p-6 shadow-md space-y-4 relative"
        >
          {/* Top Corner Metallic Gold Inlay Brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />
          <div
            className="flex items-center gap-2.5 pb-3 border-b"
            style={{ borderColor: '#202327' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(198,161,91,0.12)',
                borderColor: 'rgba(198,161,91,0.25)',
                color: '#D8BB7A',
              }}
            >
              <BriefcaseIcon className="w-4 h-4 text-[#D8BB7A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F1E8]">Chambers & Jurisdiction</h3>
              <p className="text-xs text-[#8E95A5]">Court jurisdiction name and default docketing prefixes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#8E95A5] mb-1.5">Court Title / Jurisdiction</label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B]"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              />
            </div>
            <div>
              <label className="block font-semibold text-[#8E95A5] mb-1.5">Default Docket Number Prefix</label>
              <input
                type="text"
                value={docketPrefix}
                onChange={(e) => setDocketPrefix(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B]"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              />
            </div>
          </div>
        </div>

        {/* AI & RAG Preferences Card */}
        <div
          className="rounded-2xl p-6 shadow-md space-y-4"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
        >
          <div
            className="flex items-center gap-2.5 pb-3 border-b"
            style={{ borderColor: '#202327' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(198,161,91,0.12)',
                borderColor: 'rgba(198,161,91,0.25)',
                color: '#D8BB7A',
              }}
            >
              <SparklesIcon className="w-4 h-4 text-[#D8BB7A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F1E8]">Legal AI & RAG Engine</h3>
              <p className="text-xs text-[#8E95A5]">LLM inference parameters and vector store behavior</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div
              className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{ backgroundColor: '#1E2228', borderColor: '#202327' }}
            >
              <div>
                <p className="font-bold text-[#F4F1E8]">Automatic RAG Document Indexing</p>
                <p className="text-[#8E95A5] mt-0.5">Automatically parse and vectorize newly uploaded documents</p>
              </div>
              <input
                type="checkbox"
                checked={aiAutoSync}
                onChange={(e) => setAiAutoSync(e.target.checked)}
                className="w-4 h-4 accent-[#C6A15B] cursor-pointer"
              />
            </div>

            <div
              className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{ backgroundColor: '#1E2228', borderColor: '#202327' }}
            >
              <div>
                <p className="font-bold text-[#F4F1E8]">Active Model Foundation</p>
                <p className="text-[#8E95A5] mt-0.5">Groq Llama 3.3 70B Versatile with temperature 0.2</p>
              </div>
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{
                  backgroundColor: 'rgba(198,161,91,0.12)',
                  color: '#D8BB7A',
                  border: '1px solid rgba(198,161,91,0.25)',
                }}
              >
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Notifications & Security Card */}
        <div
          className="rounded-2xl p-6 shadow-md space-y-4"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
        >
          <div
            className="flex items-center gap-2.5 pb-3 border-b"
            style={{ borderColor: '#202327' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(198,161,91,0.12)',
                borderColor: 'rgba(198,161,91,0.25)',
                color: '#D8BB7A',
              }}
            >
              <BellIcon className="w-4 h-4 text-[#D8BB7A]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F1E8]">Notifications & Security</h3>
              <p className="text-xs text-[#8E95A5]">Alert routing and session timeout configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#8E95A5] mb-1.5">Session Timeout (Minutes)</label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-[#F4F1E8] focus:outline-none focus:border-[#C6A15B]"
                style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
              >
                <option value="15" className="bg-[#161922] text-[#F4F1E8]">15 Minutes</option>
                <option value="30" className="bg-[#161922] text-[#F4F1E8]">30 Minutes</option>
                <option value="60" className="bg-[#161922] text-[#F4F1E8]">60 Minutes (Standard)</option>
                <option value="120" className="bg-[#161922] text-[#F4F1E8]">120 Minutes</option>
              </select>
            </div>

            <div
              className="flex items-center justify-between p-3.5 rounded-xl border"
              style={{ backgroundColor: '#1E2228', borderColor: '#202327' }}
            >
              <div>
                <p className="font-bold text-[#F4F1E8]">Real-Time Judicial Alerts</p>
                <p className="text-[#8E95A5] mt-0.5">Show in-app unread badges</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEmail}
                onChange={(e) => setNotificationsEmail(e.target.checked)}
                className="w-4 h-4 accent-[#C6A15B] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn-3d-gold px-6 py-2.5 rounded-xl text-xs font-bold text-[#0E1015] cursor-pointer"
          >
            Save Chambers Preferences
          </button>
        </div>
      </form>
    </div>
  )
}
