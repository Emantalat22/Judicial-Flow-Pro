import { Link } from 'react-router-dom'
import { SparklesIcon, ChevronRightIcon } from '../Icons'

export default function AICard() {
  return (
    <div
      className="card-3d-chassis card-3d-tilt rounded-2xl overflow-hidden flex flex-col shadow-lg relative"
    >
      {/* Top Corner Metallic Gold Inlay Brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#D8BB7A]/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#D8BB7A]/60 rounded-tr-xl pointer-events-none" />

      {/* Header */}
      <div
        className="px-6 pt-5 pb-4 border-b"
        style={{ borderColor: 'rgba(46, 52, 66, 0.85)' }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="pedestal-3d w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              borderColor: 'rgba(198,161,91,0.35)',
            }}
          >
            <SparklesIcon className="w-4 h-4 text-[#D8BB7A]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D8BB7A]">
            AI Assistant
          </p>
        </div>
        <h4 className="text-sm font-bold text-[#F4F1E8]">
          Judicial AI Assistant
        </h4>
        <p className="text-xs text-[#8E95A5] mt-0.5">
          Grounded RAG analysis & judicial drafting
        </p>
      </div>

      {/* Active capabilities inside recessed console well */}
      <div className="px-5 py-4 flex-1">
        <div className="recessed-well rounded-xl p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#777B80] mb-2.5">
            Active Capabilities
          </p>
          <ul className="space-y-2">
            {[
              'Case & document RAG summarization',
              'Evidentiary search & legal analysis',
              'Bench order & ruling drafting',
            ].map((capability) => (
              <li
                key={capability}
                className="flex items-start gap-2.5 text-xs text-[#8E95A5]"
              >
                <SparklesIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C6A15B]" />
                <span className="text-[#F4F1E8]/90">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="mt-3.5 pt-2 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full shrink-0 bg-[#3FA37C] shadow-[0_0_8px_rgba(63,163,124,0.6)]" />
          <span className="text-xs font-semibold text-[#5AC49A]">
            Online • Llama 3.3 70B & RAG Vector Engine
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-5">
        <Link
          to="/ai"
          className="btn-3d-gold flex items-center justify-center gap-2 w-full text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer text-[#0E1015]"
        >
          <span>Open AI Assistant</span>
          <ChevronRightIcon className="w-4 h-4 text-[#0E1015]" />
        </Link>
      </div>
    </div>
  )
}
