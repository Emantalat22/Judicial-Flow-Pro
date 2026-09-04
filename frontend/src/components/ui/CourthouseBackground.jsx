export default function CourthouseBackground({ className = '' }) {
  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
      >
        <defs>
          {/* Rich Dark Gold architectural gradients */}
          <linearGradient id="courtStrokeGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6A15B" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#B08A45" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8F6B32" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="courtStrokeDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B08A45" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8F6B32" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="pedimentShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C6A15B" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#8F6B32" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* ── Architectural Perspective Grid ─────────────────── */}
        <g stroke="url(#courtStrokeDark)" strokeWidth="0.85" strokeDasharray="3 6" opacity="0.5">
          <line x1="0" y1="750" x2="1200" y2="750" />
          <line x1="0" y1="780" x2="1200" y2="780" />
          <line x1="100" y1="800" x2="600" y2="400" />
          <line x1="1100" y1="800" x2="600" y2="400" />
          <line x1="300" y1="800" x2="600" y2="400" />
          <line x1="900" y1="800" x2="600" y2="400" />
        </g>

        {/* ── Central Supreme Dome / Rotunda Silhouettes ─────── */}
        <g stroke="url(#courtStrokeDark)" strokeWidth="1.4" opacity="0.85">
          {/* Outer Rotunda Arc */}
          <path d="M 450 250 A 150 150 0 0 1 750 250" fill="none" />
          {/* Inner Cupola Arc */}
          <path d="M 480 250 A 120 120 0 0 1 720 250" fill="none" />
          {/* Lantern Top */}
          <rect x="585" y="60" width="30" height="40" fill="none" strokeWidth="1.2" />
          <polygon points="580,60 600,25 620,60" fill="none" stroke="url(#courtStrokeGold)" strokeWidth="1.8" />
          <line x1="600" y1="25" x2="600" y2="5" stroke="#C6A15B" strokeWidth="2" />
          <circle cx="600" cy="5" r="3" fill="#C6A15B" />

          {/* Dome Drum Columns */}
          <line x1="450" y1="250" x2="450" y2="280" />
          <line x1="500" y1="230" x2="500" y2="280" />
          <line x1="550" y1="220" x2="550" y2="280" />
          <line x1="600" y1="218" x2="600" y2="280" />
          <line x1="650" y1="220" x2="650" y2="280" />
          <line x1="700" y1="230" x2="700" y2="280" />
          <line x1="750" y1="250" x2="750" y2="280" />
          <line x1="440" y1="280" x2="760" y2="280" strokeWidth="1.8" />
        </g>

        {/* ── Grand Classical Pediment (Triangular Gable) ────── */}
        <g>
          {/* Outer Triangle */}
          <polygon
            points="600,160 220,320 980,320"
            fill="url(#pedimentShade)"
            stroke="url(#courtStrokeGold)"
            strokeWidth="2.8"
          />
          {/* Inner Tympanum Line */}
          <polygon
            points="600,185 260,310 940,310"
            fill="none"
            stroke="url(#courtStrokeDark)"
            strokeWidth="1.5"
          />

          {/* Tympanum Relief Artwork: Scales of Justice & Laurel Motif */}
          <g transform="translate(600, 260)" stroke="url(#courtStrokeGold)" fill="none" opacity="0.95">
            {/* Center Beam */}
            <line x1="0" y1="-45" x2="0" y2="35" strokeWidth="2" />
            <line x1="-35" y1="-30" x2="35" y2="-30" strokeWidth="2" />
            <circle cx="0" cy="-45" r="4" fill="#C6A15B" />
            {/* Left Pan */}
            <line x1="-35" y1="-30" x2="-45" y2="-5" strokeWidth="1.2" />
            <line x1="-35" y1="-30" x2="-25" y2="-5" strokeWidth="1.2" />
            <path d="M -50 -5 Q -35 12 -20 -5 Z" strokeWidth="1.8" fill="none" />
            {/* Right Pan */}
            <line x1="35" y1="-30" x2="25" y2="-5" strokeWidth="1.2" />
            <line x1="35" y1="-30" x2="45" y2="-5" strokeWidth="1.2" />
            <path d="M 20 -5 Q 35 12 50 -5 Z" strokeWidth="1.8" fill="none" />
            {/* Laurel Leaves Arcs */}
            <path d="M -80 20 C -60 -10 -30 25 -10 32" strokeWidth="1.4" strokeDasharray="2 3" />
            <path d="M 80 20 C 60 -10 30 25 10 32" strokeWidth="1.4" strokeDasharray="2 3" />
          </g>

          {/* Pediment Acroterion (Apex Ornaments) */}
          <path d="M 590 160 Q 600 135 610 160" stroke="#C6A15B" strokeWidth="2.2" fill="none" />
          <path d="M 215 320 Q 205 305 220 295" stroke="#C6A15B" strokeWidth="1.8" fill="none" />
          <path d="M 985 320 Q 995 305 980 295" stroke="#C6A15B" strokeWidth="1.8" fill="none" />
        </g>

        {/* ── Entablature, Frieze & Dentils ───────────────────── */}
        <g stroke="url(#courtStrokeDark)">
          {/* Architrave */}
          <rect x="200" y="320" width="800" height="20" fill="none" strokeWidth="1.8" />
          <line x1="200" y1="330" x2="1000" y2="330" strokeWidth="1" />

          {/* Frieze with classical Triglyphs */}
          <rect x="210" y="340" width="780" height="28" fill="none" strokeWidth="1.8" />
          {[260, 380, 500, 620, 740, 860, 940].map((tx, idx) => (
            <g key={idx} stroke="url(#courtStrokeGold)" strokeWidth="1.2">
              <line x1={tx} y1="344" x2={tx} y2="364" />
              <line x1={tx + 6} y1="344" x2={tx + 6} y2="364" />
              <line x1={tx + 12} y1="344" x2={tx + 12} y2="364" />
            </g>
          ))}

          {/* Cornice Lower Band */}
          <rect x="190" y="368" width="820" height="14" fill="none" strokeWidth="2.2" stroke="url(#courtStrokeDark)" />
        </g>

        {/* ── Monumental Classical Columns (6 Grand Portico Columns) ─ */}
        {[
          { x: 250, label: 'Col 1' },
          { x: 390, label: 'Col 2' },
          { x: 530, label: 'Col 3' },
          { x: 670, label: 'Col 4' },
          { x: 810, label: 'Col 5' },
          { x: 950, label: 'Col 6' },
        ].map((col, idx) => {
          const cx = col.x
          return (
            <g key={idx}>
              {/* Corinthian / Ionic Capital (Volutes & Details) */}
              <g stroke="url(#courtStrokeGold)" strokeWidth="1.8" fill="none">
                {/* Abacus */}
                <rect x={cx - 32} y="382" width="64" height="8" rx="1" />
                {/* Capital Volutes */}
                <circle cx={cx - 24} cy="398" r="7" />
                <circle cx={cx + 24} cy="398" r="7" />
                <path d={`M ${cx - 24} 405 Q ${cx} 412 ${cx + 24} 405`} strokeWidth="1.4" />
                <path d={`M ${cx - 20} 390 Q ${cx} 396 ${cx + 20} 390`} strokeWidth="1.2" />
              </g>

              {/* Column Shaft with Fluting Lines */}
              <g stroke="url(#courtStrokeDark)" strokeWidth="1.2">
                {/* Outer Shaft Outline */}
                <line x1={cx - 22} y1="405" x2={cx - 25} y2="670" strokeWidth="1.8" />
                <line x1={cx + 22} y1="405" x2={cx + 25} y2="670" strokeWidth="1.8" />
                {/* Fluting internal vertical lines */}
                <line x1={cx - 14} y1="407" x2={cx - 16} y2="668" opacity="0.75" />
                <line x1={cx - 7} y1="408" x2={cx - 8} y2="668" opacity="0.75" />
                <line x1={cx} y1="408" x2={cx} y2="668" stroke="url(#courtStrokeGold)" opacity="0.9" />
                <line x1={cx + 7} y1="408" x2={cx + 8} y2="668" opacity="0.75" />
                <line x1={cx + 14} y1="407" x2={cx + 16} y2="668" opacity="0.75" />
              </g>

              {/* Column Base / Torus / Plinth */}
              <g stroke="url(#courtStrokeDark)" strokeWidth="1.4" fill="none">
                <rect x={cx - 28} y="670" width="56" height="8" rx="1" stroke="url(#courtStrokeGold)" />
                <rect x={cx - 34} y="678" width="68" height="12" />
              </g>
            </g>
          )
        })}

        {/* ── Central Courthouse Main Archway Entrance ───────── */}
        <g stroke="url(#courtStrokeDark)" fill="none">
          {/* Main Grand Portal Frame */}
          <path
            d="M 540 690 L 540 510 A 60 60 0 0 1 660 510 L 660 690"
            strokeWidth="2.2"
            stroke="url(#courtStrokeDark)"
          />
          {/* Inner Arch Details */}
          <path
            d="M 552 690 L 552 516 A 48 48 0 0 1 648 516 L 648 690"
            strokeWidth="1.2"
            stroke="url(#courtStrokeGold)"
            strokeDasharray="4 2"
          />
          {/* Keystone */}
          <polygon points="593,456 607,456 605,472 595,472" stroke="url(#courtStrokeGold)" strokeWidth="1.8" />

          {/* Left Portal */}
          <path d="M 350 690 L 350 550 A 40 40 0 0 1 430 550 L 430 690" strokeWidth="1.2" opacity="0.7" />
          {/* Right Portal */}
          <path d="M 770 690 L 770 550 A 40 40 0 0 1 850 550 L 850 690" strokeWidth="1.2" opacity="0.7" />
        </g>

        {/* ── Grand Monumental Steps / Stylobate / Podium ─────── */}
        <g stroke="url(#courtStrokeDark)">
          <line x1="160" y1="690" x2="1040" y2="690" strokeWidth="2.8" stroke="url(#courtStrokeGold)" />
          <line x1="140" y1="704" x2="1060" y2="704" strokeWidth="1.8" />
          <line x1="120" y1="718" x2="1080" y2="718" strokeWidth="1.8" />
          <line x1="90" y1="732" x2="1110" y2="732" strokeWidth="2" />
          <line x1="60" y1="748" x2="1140" y2="748" strokeWidth="2.4" stroke="url(#courtStrokeDark)" />
          <line x1="30" y1="766" x2="1170" y2="766" strokeWidth="2.6" stroke="url(#courtStrokeGold)" />
          <line x1="0" y1="786" x2="1200" y2="786" strokeWidth="3.2" />
        </g>

        {/* ── Symmetrical Flanking Wings (Left & Right Colonnades) ─ */}
        <g stroke="url(#courtStrokeDark)" opacity="0.55">
          {/* Left Wing Silhouette */}
          <rect x="40" y="440" width="160" height="250" strokeWidth="1.2" />
          <line x1="40" y1="470" x2="200" y2="470" strokeWidth="1.2" />
          <line x1="80" y1="470" x2="80" y2="690" strokeDasharray="3 3" />
          <line x1="120" y1="470" x2="120" y2="690" strokeDasharray="3 3" />
          <line x1="160" y1="470" x2="160" y2="690" strokeDasharray="3 3" />

          {/* Right Wing Silhouette */}
          <rect x="1000" y="440" width="160" height="250" strokeWidth="1.2" />
          <line x1="1000" y1="470" x2="1160" y2="470" strokeWidth="1.2" />
          <line x1="1040" y1="470" x2="1040" y2="690" strokeDasharray="3 3" />
          <line x1="1080" y1="470" x2="1080" y2="690" strokeDasharray="3 3" />
          <line x1="1120" y1="470" x2="1120" y2="690" strokeDasharray="3 3" />
        </g>
      </svg>
    </div>
  )
}
