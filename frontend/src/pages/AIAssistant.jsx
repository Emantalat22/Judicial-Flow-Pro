import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import useAuth from '../hooks/useAuth'
import {
  SparklesIcon,
  BriefcaseIcon,
  FileIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SendIcon,
  RotateCcwIcon,
  CopyIcon,
  CheckIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  XIcon,
} from '../components/Icons'

const QUICK_PROMPTS = [
  {
    title: 'Executive Case Summary',
    prompt: 'Provide a comprehensive executive summary of this case, including its procedural history, active claims, docketed hearings, and submitted evidence filings.',
    mode: 'summarization',
    icon: BriefcaseIcon,
  },
  {
    title: 'Evidentiary & Filing Analysis',
    prompt: 'What documentary evidence and exhibits are on record in this case? Analyze their relevance to the disputed claims.',
    mode: 'case_analysis',
    icon: FileIcon,
  },
  {
    title: 'Statutory & Precedent Research',
    prompt: 'What specific procedural standards and statutory provisions govern the motions and claims at issue in this proceeding?',
    mode: 'statute_search',
    icon: BookOpenIcon,
  },
  {
    title: 'Draft Scheduling Order',
    prompt: 'Draft a formal Case Management & Pretrial Scheduling Order incorporating standard discovery deadlines and pretrial conference dates.',
    mode: 'drafting',
    icon: SparklesIcon,
  },
]

const MODES = [
  { id: 'case_analysis',  label: 'Case Analysis',     icon: BriefcaseIcon },
  { id: 'summarization',  label: 'Executive Summary', icon: FileIcon },
  { id: 'drafting',       label: 'Ruling / Order Draft', icon: SparklesIcon },
  { id: 'statute_search', label: 'Statutory Standards', icon: BookOpenIcon },
  { id: 'general',        label: 'General Inquiries', icon: CheckCircleIcon },
]

// Simple, elegant Markdown renderer for judicial outputs
function MarkdownContent({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBuffer = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={key++}
            className="my-3 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border leading-relaxed"
            style={{
              backgroundColor: '#111316',
              borderColor: '#202327',
              color: '#D8BB7A',
            }}
          >
            <pre>{codeBuffer.join('\n')}</pre>
          </div>
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // Heading 3: ###
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-sm font-bold text-[#F4F1E8] mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-3.5 rounded-full bg-[#C6A15B]" />
          {renderInline(line.slice(4))}
        </h3>
      )
    }
    // Heading 2: ##
    else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          className="text-base font-bold text-[#F4F1E8] mt-5 mb-2.5 pb-1 border-b"
          style={{ borderColor: '#202327' }}
        >
          {renderInline(line.slice(3))}
        </h2>
      )
    }
    // Heading 1: #
    else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="text-lg font-bold text-[#F4F1E8] mt-6 mb-3">
          {renderInline(line.slice(2))}
        </h1>
      )
    }
    // Bullet list: - or *
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={key++} className="ml-4 list-disc text-xs text-[#8E95A5] my-1 leading-relaxed">
          {renderInline(line.slice(2))}
        </li>
      )
    }
    // Numbered list: 1. 2. etc
    else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, '')
      elements.push(
        <li key={key++} className="ml-4 list-decimal text-xs text-[#8E95A5] my-1 leading-relaxed">
          {renderInline(text)}
        </li>
      )
    }
    // Empty line
    else if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />)
    }
    // Standard paragraph
    else {
      elements.push(
        <p key={key++} className="text-xs text-[#F4F1E8] leading-relaxed my-1.5">
          {renderInline(line)}
        </p>
      )
    }
  }

  return <div>{elements}</div>
}

// Inline formatting (bold, italic, code)
function renderInline(text) {
  const parts = []
  let buffer = ''
  let i = 0

  while (i < text.length) {
    // Bold: **text**
    if (text.substr(i, 2) === '**') {
      if (buffer) {
        parts.push(buffer)
        buffer = ''
      }
      const closing = text.indexOf('**', i + 2)
      if (closing !== -1) {
        const boldText = text.slice(i + 2, closing)
        parts.push(
          <strong key={parts.length} className="font-bold text-[#D8BB7A]">
            {boldText}
          </strong>
        )
        i = closing + 2
        continue
      }
    }

    // Inline code: `code`
    if (text[i] === '`') {
      if (buffer) {
        parts.push(buffer)
        buffer = ''
      }
      const closing = text.indexOf('`', i + 1)
      if (closing !== -1) {
        const codeText = text.slice(i + 1, closing)
        parts.push(
          <code
            key={parts.length}
            className="px-1.5 py-0.5 rounded font-mono text-[11px]"
            style={{
              backgroundColor: '#1E2228',
              color: '#D8BB7A',
              border: '1px solid #383D4B',
            }}
          >
            {codeText}
          </code>
        )
        i = closing + 1
        continue
      }
    }

    buffer += text[i]
    i++
  }

  if (buffer) {
    parts.push(buffer)
  }

  return parts
}

export default function AIAssistant() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputQuery, setInputQuery] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [cases, setCases] = useState([])
  const [activeMode, setActiveMode] = useState('case_analysis')
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [expandedCitations, setExpandedCitations] = useState({})

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Fetch Cases for Scope Selector
  useEffect(() => {
    async function loadCases() {
      try {
        const { data } = await apiClient.get('/cases')
        setCases(data || [])
      } catch (err) {
        console.error('Failed to load cases for AI assistant:', err)
      }
    }
    loadCases()
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Handle Query Submission
  const handleSendMessage = async (customPrompt = null, customMode = null) => {
    const query = customPrompt || inputQuery.trim()
    if (!query || loading) return

    const mode = customMode || activeMode
    const caseId = selectedCaseId ? parseInt(selectedCaseId, 10) : null

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
      caseId: caseId,
      mode: mode,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputQuery('')
    setLoading(true)

    try {
      const payload = {
        prompt: query,
        case_id: caseId,
        mode: mode,
        temperature: 0.2,
      }

      const { data } = await apiClient.post('/ai/query', payload)

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.response,
        citations: data.citations || [],
        modelUsed: data.model_used || 'Groq Llama 3.3 70B',
        tokensUsed: data.tokens_used,
        timestamp: data.created_at || new Date().toISOString(),
        caseId: data.case_id,
        mode: data.mode,
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error('AI Query failed:', err)
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        isError: true,
        text: '### Judicial AI Connection Error\n\nUnable to process query at this time. Please verify that the backend AI service is running and try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // Re-index all court documents
  const handleReindexDocuments = async () => {
    setIndexing(true)
    try {
      const { data } = await apiClient.post('/ai/index-documents')
      showToast(`Indexed ${data.indexed_documents} documents (${data.total_chunks} vector chunks)`)
    } catch (err) {
      console.error('Indexing failed:', err)
      showToast('Failed to index documents')
    } finally {
      setIndexing(false)
    }
  }

  // Copy AI response
  const handleCopyResponse = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    showToast('Copied response to clipboard')
  }

  // Clear chat
  const handleClearChat = () => {
    setMessages([])
    showToast('Conversation cleared')
  }

  // Toggle citations
  const toggleCitations = (msgId) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }))
  }

  const selectedCaseObj = cases.find((c) => c.id === parseInt(selectedCaseId, 10))

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-7xl mx-auto space-y-3 animate-in fade-in duration-150">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top duration-200"
          style={{ backgroundColor: '#161922', border: '1px solid #262B35', color: '#F4F1E8' }}
        >
          <SparklesIcon className="w-4 h-4 text-[#D8BB7A]" />
          {toastMessage}
        </div>
      )}

      {/* ── 3D Command Header & Control Bar ──────────────────────────── */}
      <div
        className="page-header-3d p-4.5 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 relative overflow-hidden"
      >
        {/* Corner Gold Inlay Brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/70 rounded-tr-xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className="pedestal-3d w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[#C6A15B]/40"
            style={{
              color: '#D8BB7A',
            }}
          >
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#F4F1E8]">
                Judicial AI Assistant
              </h1>
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 bg-[#171B24] text-[#D8BB7A] border border-[#C6A15B]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Llama 3.3 70B & RAG Vector Engine
              </span>
            </div>
            <p className="text-xs text-[#8E95A5] mt-0.5">
              Grounded evidentiary retrieval, case summarization, statutory research, and ruling drafting.
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto relative z-10">
          {/* Case Scope Selector */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="input-3d w-full text-xs font-semibold py-2 pl-3 pr-8 rounded-xl text-[#F4F1E8] appearance-none cursor-pointer"
            >
              <option value="">Court-Wide Scope (All Cases)</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title.length > 25 ? c.title.slice(0, 25) + '...' : c.title}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E95A5] pointer-events-none" />
          </div>

          {/* Re-index RAG Button */}
          <button
            onClick={handleReindexDocuments}
            disabled={indexing}
            title="Re-index all court documents into the vector store"
            className="px-3 py-2 text-xs font-semibold rounded-xl text-[#F4F1E8] hover:bg-white/5 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
          >
            <RotateCcwIcon className={`w-3.5 h-3.5 ${indexing ? 'animate-spin text-[#D8BB7A]' : 'text-[#8E95A5]'}`} />
            <span className="hidden sm:inline">{indexing ? 'Indexing...' : 'Sync Index'}</span>
          </button>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-800/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 flex items-center gap-1.5 transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── RAG Workflow & Case Scope Guidance Banner ────────────────── */}
      <div
        className="px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 shadow-sm"
        style={{
          backgroundColor: '#161922',
          border: '1px solid rgba(198,161,91,0.25)',
        }}
      >
        <div className="flex items-start sm:items-center gap-2.5 text-[#8E95A5] min-w-0">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
            style={{
              backgroundColor: 'rgba(198,161,91,0.15)',
              color: '#D8BB7A',
            }}
          >
            <BookOpenIcon className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] sm:text-xs">
            <span className="font-bold text-[#D8BB7A]">RAG Workflow:</span>{' '}
            AI uses documents uploaded from the{' '}
            <span className="text-[#F4F1E8] font-bold">Documents</span> module. Select a case, upload/associate its documents there, then{' '}
            <span className="text-[#D8BB7A] font-bold">Sync Index</span> to make them available for AI analysis. Selecting a case strictly isolates queries to that case's records.
          </p>
        </div>

        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 text-[#F4F1E8] hover:bg-white/5 transition shadow-sm cursor-pointer"
          style={{ backgroundColor: '#1E2228', border: '1px solid #383D4B' }}
        >
          <FileIcon className="w-3.5 h-3.5 text-[#D8BB7A]" />
          Go to Documents
          <ExternalLinkIcon className="w-3 h-3 ml-0.5 text-[#8E95A5]" />
        </Link>
      </div>

      {/* ── Active Scope Info Strip (When a case is selected) ─────────── */}
      {selectedCaseObj && (
        <div
          className="px-4 py-2 rounded-xl flex items-center justify-between gap-3 text-xs shrink-0 shadow-sm"
          style={{
            backgroundColor: '#1E2228',
            border: '1px solid rgba(198,161,91,0.3)',
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <BriefcaseIcon className="w-4 h-4 text-[#D8BB7A] shrink-0" />
            <span className="font-bold text-[#D8BB7A] truncate">
              Scoped to: {selectedCaseObj.case_number} — {selectedCaseObj.title}
            </span>
            <span
              className="px-2 py-0.2 rounded text-[10px] font-bold shrink-0 uppercase"
              style={{
                backgroundColor: 'rgba(198,161,91,0.15)',
                color: '#D8BB7A',
                border: '1px solid rgba(198,161,91,0.3)',
              }}
            >
              {selectedCaseObj.status}
            </span>
          </div>
          <button
            onClick={() => setSelectedCaseId('')}
            className="text-[11px] font-semibold text-[#8E95A5] hover:text-[#F4F1E8] flex items-center gap-1 cursor-pointer"
          >
            Clear Scope <XIcon className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Main Chat Feed ────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 rounded-2xl shadow-sm space-y-5"
        style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
      >
        {/* Welcome state when chat is empty */}
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto py-8 text-center space-y-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm"
              style={{
                backgroundColor: '#1E2228',
                border: '1px solid rgba(198,161,91,0.3)',
                color: '#D8BB7A',
              }}
            >
              <SparklesIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg md:text-xl font-bold text-[#F4F1E8]">
                Judicial Flow Pro Legal Intelligence
              </h2>
              <p className="text-xs md:text-sm text-[#8E95A5] max-w-xl mx-auto leading-relaxed">
                Query pleadings, analyze documentary exhibits, research statutory standards, and draft formal bench rulings with strict factual grounding.
              </p>
            </div>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              {QUICK_PROMPTS.map((item, idx) => {
                const ItemIcon = item.icon
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveMode(item.mode)
                      handleSendMessage(item.prompt, item.mode)
                    }}
                    className="p-3.5 rounded-2xl text-left transition-all group cursor-pointer space-y-1.5 shadow-sm"
                    style={{
                      backgroundColor: '#1E2228',
                      border: '1px solid #383D4B',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'rgba(198,161,91,0.15)',
                          color: '#D8BB7A',
                        }}
                      >
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs font-bold text-[#F4F1E8] group-hover:text-[#D8BB7A] transition-colors">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-[#8E95A5] line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user'

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end gap-3 max-w-3xl ml-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div
                  className="card-3d-chassis p-4 rounded-2xl text-xs max-w-2xl leading-relaxed shadow-md border border-[#C6A15B]/35 text-[#F4F1E8]"
                >
                  <p className="font-medium">{msg.text}</p>
                  <div
                    className="flex items-center justify-end gap-2 mt-2 pt-1 border-t text-[10px] text-[#8E95A5]"
                    style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
                  >
                    {msg.caseId && (
                      <span className="text-[#D8BB7A] font-semibold">Case #{msg.caseId}</span>
                    )}
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div
                  className="pedestal-3d w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                  style={{
                    backgroundColor: '#C6A15B',
                    color: '#0E1015',
                    fontWeight: 800,
                  }}
                >
                  {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'JD'}
                </div>
              </div>
            )
          }

          // AI Message Card
          return (
            <div key={msg.id} className="flex items-start gap-3 max-w-4xl mr-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                className="pedestal-3d w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1"
                style={{
                  color: '#D8BB7A',
                }}
              >
                <SparklesIcon className="w-4 h-4" />
              </div>

              <div
                className="flex-1 card-3d-chassis p-4 md:p-5 rounded-2xl shadow-lg space-y-3 relative"
                style={{
                  borderTop: '2px solid rgba(216, 187, 122, 0.45)',
                  backgroundColor: msg.isError ? 'rgba(127,29,29,0.3)' : '#161922',
                }}
              >
                {/* AI Header */}
                <div
                  className="flex items-center justify-between border-b pb-2.5"
                  style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F1E8]">Judicial Assistant</span>
                    <span
                      className="px-2 py-0.2 rounded text-[10px] font-mono font-semibold"
                      style={{
                        backgroundColor: '#1E2228',
                        color: '#D8BB7A',
                        border: '1px solid rgba(198,161,91,0.25)',
                      }}
                    >
                      {msg.modelUsed || 'Llama 3.3 70B'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyResponse(msg.text, index)}
                      className="p-1 rounded text-[#8E95A5] hover:text-[#F4F1E8] transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIndex === index ? (
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Response Body */}
                <div className="text-xs leading-relaxed text-[#F4F1E8]">
                  <MarkdownContent content={msg.text} />
                </div>

                {/* Citations & Evidence Sources Accordion */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: '#202327' }}>
                    <button
                      onClick={() => toggleCitations(msg.id)}
                      className="flex items-center justify-between w-full text-[11px] font-semibold text-[#8E95A5] hover:text-[#F4F1E8] py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-[#D8BB7A] font-bold">
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        Grounded Sources & Evidentiary Citations ({msg.citations.length})
                      </span>
                      <ChevronDownIcon
                        className={`w-3.5 h-3.5 text-[#8E95A5] transition-transform duration-150 ${
                          expandedCitations[msg.id] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedCitations[msg.id] && (
                      <div className="mt-2 space-y-2 animate-in fade-in duration-100">
                        {msg.citations.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-2.5 rounded-xl text-[11px] space-y-1 shadow-sm"
                            style={{
                              backgroundColor: '#1E2228',
                              border: '1px solid #383D4B',
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#F4F1E8] flex items-center gap-1.5">
                                {c.source_type === 'case' ? (
                                  <BriefcaseIcon className="w-3 h-3 text-[#D8BB7A]" />
                                ) : (
                                  <FileIcon className="w-3 h-3 text-[#60A5FA]" />
                                )}
                                {c.title}
                              </span>
                              {c.relevance_score && (
                                <span
                                  className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold"
                                  style={{
                                    backgroundColor: 'rgba(198,161,91,0.15)',
                                    color: '#D8BB7A',
                                    border: '1px solid rgba(198,161,91,0.25)',
                                  }}
                                >
                                  {Math.round(c.relevance_score * 100)}% match
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#8E95A5] line-clamp-2 leading-relaxed">
                              "{c.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Loading / Generating State */}
        {loading && (
          <div className="flex items-start gap-3 max-w-4xl mr-auto animate-in fade-in duration-150">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1"
              style={{
                backgroundColor: '#1E2228',
                border: '1px solid rgba(198,161,91,0.3)',
                color: '#D8BB7A',
              }}
            >
              <SparklesIcon className="w-4 h-4 animate-spin" />
            </div>

            <div
              className="p-4 rounded-2xl shadow-sm flex items-center gap-3"
              style={{ backgroundColor: '#111316', border: '1px solid #202327' }}
            >
              <div className="w-4 h-4 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs text-[#8E95A5]">
                Retrieving vector embeddings and synthesizing judicial analysis...
              </p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input & Action Toolbar ────────────────────────────────────── */}
      <div
        className="p-3 md:p-4 rounded-2xl shadow-sm space-y-3 shrink-0"
        style={{ backgroundColor: '#161922', border: '1px solid #262B35' }}
      >
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MODES.map((m) => {
            const ModeIcon = m.icon
            const isActive = activeMode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#C6A15B] text-[#0E1015] font-extrabold shadow-sm'
                    : 'text-[#8E95A5] hover:text-[#F4F1E8] hover:bg-white/5'
                }`}
                style={!isActive ? { backgroundColor: '#1E2228', border: '1px solid #383D4B' } : {}}
              >
                <ModeIcon className="w-3 h-3" />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Input Bar */}
        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              rows={2}
              placeholder={
                selectedCaseObj
                  ? `Ask a question regarding ${selectedCaseObj.case_number}... (Enter to send, Shift+Enter for new line)`
                  : "Ask about legal standards, docket proceedings, or select a case above... (Enter to send)"
              }
              className="input-3d w-full p-3 text-xs rounded-xl text-[#F4F1E8] placeholder-[#777B80] transition-all resize-none leading-relaxed"
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
            className="btn-3d-gold p-3 rounded-xl flex items-center justify-center cursor-pointer text-[#0E1015] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <SendIcon className="w-4 h-4 text-[#0E1015]" />
          </button>
        </div>

        {/* Mandatory Judicial Disclaimer */}
        <div
          className="flex items-center justify-center gap-1.5 text-[10px] text-[#8E95A5] text-center pt-1 border-t"
          style={{ borderColor: '#202327' }}
        >
          <span>⚖️</span>
          <span>
            Judicial Notice: AI-generated analysis and draft orders are assistive research tools grounded in court records and do not constitute binding judicial decisions.
          </span>
        </div>
      </div>
    </div>
  )
}
