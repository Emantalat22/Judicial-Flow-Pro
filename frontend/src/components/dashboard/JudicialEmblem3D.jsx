export default function JudicialEmblem3D({ className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* ── Volumetric Golden Atmospheric Glow ── */}
      <div
        className="absolute w-44 h-44 rounded-full blur-2xl opacity-40 -z-10 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(216, 187, 122, 0.45) 0%, rgba(198, 161, 91, 0.15) 50%, transparent 75%)',
          animationDuration: '4s',
        }}
      />

      {/* ── 3D Floating Neoclassical Judicial Seal ── */}
      <svg
        viewBox="0 0 220 220"
        className="w-40 h-40 sm:w-44 sm:h-44 animate-judicial-float drop-shadow-[0_16px_30px_rgba(0,0,0,0.85)]"
        fill="none"
      >
        <defs>
          {/* Outer Bevel Ring Gradient */}
          <linearGradient id="emblemOuterBevel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2C98D" />
            <stop offset="25%" stopColor="#C6A15B" />
            <stop offset="50%" stopColor="#6C4E1D" />
            <stop offset="75%" stopColor="#C6A15B" />
            <stop offset="100%" stopColor="#D8BB7A" />
          </linearGradient>

          {/* Dark Metallic Inner Plate */}
          <radialGradient id="emblemCorePlate" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1E2330" />
            <stop offset="55%" stopColor="#141720" />
            <stop offset="100%" stopColor="#0B0D12" />
          </radialGradient>

          {/* 3D Scales Metallic Shimmer */}
          <linearGradient id="goldScalesGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D1" />
            <stop offset="20%" stopColor="#D8BB7A" />
            <stop offset="60%" stopColor="#B08A45" />
            <stop offset="100%" stopColor="#6D4D1A" />
          </linearGradient>

          {/* Depth Drop Shadow */}
          <filter id="emblem3DShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.9" />
          </filter>

          {/* Specular Rim Light */}
          <linearGradient id="specularRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#D8BB7A" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* ── Outer Dimensional Bezel Ring ── */}
        <circle
          cx="110"
          cy="110"
          r="102"
          fill="#0B0D12"
          stroke="url(#emblemOuterBevel)"
          strokeWidth="3.5"
          filter="url(#emblem3DShadow)"
        />

        {/* Outer Specular Rim Highlight */}
        <circle
          cx="110"
          cy="110"
          r="99"
          stroke="url(#specularRim)"
          strokeWidth="1.2"
        />

        {/* ── Recessed Inner Dial Chamber ── */}
        <circle
          cx="110"
          cy="110"
          r="94"
          fill="url(#emblemCorePlate)"
          stroke="rgba(198,161,91,0.2)"
          strokeWidth="1"
        />

        {/* Radiating Judicial Rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="110"
            y1="22"
            x2="110"
            y2="30"
            transform={`rotate(${deg} 110 110)`}
            stroke="#D8BB7A"
            strokeWidth="1.5"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
        ))}

        {/* Circular Studs / Rivets */}
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
          <circle
            key={deg}
            cx="110"
            cy="26"
            r="1.5"
            transform={`rotate(${deg} 110 110)`}
            fill="#D8BB7A"
            opacity="0.75"
          />
        ))}

        {/* Concentric Step Ring */}
        <circle
          cx="110"
          cy="110"
          r="80"
          fill="none"
          stroke="#C6A15B"
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="3 3"
        />

        {/* ── 3D SCALES OF JUSTICE & PILLAR (Cast with Depth Shadow) ── */}
        <g filter="url(#emblem3DShadow)">
          {/* Central Vertical Pillar Base & Pedestal */}
          <path
            d="M98 172 L122 172 L118 162 L102 162 Z"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />
          <rect
            x="94"
            y="172"
            width="32"
            height="4"
            rx="1"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />

          {/* Central Pillar Column with Specular Fluting */}
          <rect
            x="106.5"
            y="56"
            width="7"
            height="106"
            rx="1.5"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />
          <line
            x1="109.5"
            y1="58"
            x2="109.5"
            y2="160"
            stroke="#FFF2D1"
            strokeWidth="1.2"
            strokeOpacity="0.65"
          />

          {/* Pillar Finial Spearhead / Flame of Truth */}
          <path
            d="M110 38 L116 54 L110 52 L104 54 Z"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />

          {/* Main Horizontal Pivot Beam */}
          <path
            d="M50 78 Q110 68 170 78 L168 83 Q110 74 52 83 Z"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />

          {/* Center Pivot Boss / Diamond Emblem */}
          <circle
            cx="110"
            cy="75"
            r="7"
            fill="url(#emblemOuterBevel)"
            stroke="#0B0D12"
            strokeWidth="1.2"
          />
          <circle
            cx="110"
            cy="75"
            r="3"
            fill="#FFF2D1"
          />

          {/* ── Left Scale Assembly ── */}
          {/* Left Chains */}
          <line x1="56" y1="82" x2="38" y2="126" stroke="#D8BB7A" strokeWidth="1.2" strokeOpacity="0.8" />
          <line x1="60" y1="82" x2="78" y2="126" stroke="#D8BB7A" strokeWidth="1.2" strokeOpacity="0.8" />
          <line x1="58" y1="82" x2="58" y2="124" stroke="#B08A45" strokeWidth="0.8" strokeOpacity="0.7" strokeDasharray="2 2" />

          {/* Left Pan (Dimensional Curved Bowl) */}
          <ellipse cx="58" cy="126" rx="22" ry="5.5" fill="url(#goldScalesGrad)" stroke="#5C4520" strokeWidth="0.8" />
          <path
            d="M36 126 C36 138 80 138 80 126 Z"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />
          {/* Left Pan Lip Highlight */}
          <ellipse cx="58" cy="125.5" rx="19" ry="3.5" fill="none" stroke="#FFF2D1" strokeWidth="0.8" strokeOpacity="0.7" />

          {/* ── Right Scale Assembly ── */}
          {/* Right Chains */}
          <line x1="164" y1="82" x2="142" y2="126" stroke="#D8BB7A" strokeWidth="1.2" strokeOpacity="0.8" />
          <line x1="160" y1="82" x2="182" y2="126" stroke="#D8BB7A" strokeWidth="1.2" strokeOpacity="0.8" />
          <line x1="162" y1="82" x2="162" y2="124" stroke="#B08A45" strokeWidth="0.8" strokeOpacity="0.7" strokeDasharray="2 2" />

          {/* Right Pan (Dimensional Curved Bowl) */}
          <ellipse cx="162" cy="126" rx="22" ry="5.5" fill="url(#goldScalesGrad)" stroke="#5C4520" strokeWidth="0.8" />
          <path
            d="M140 126 C140 138 184 138 184 126 Z"
            fill="url(#goldScalesGrad)"
            stroke="#5C4520"
            strokeWidth="0.8"
          />
          {/* Right Pan Lip Highlight */}
          <ellipse cx="162" cy="125.5" rx="19" ry="3.5" fill="none" stroke="#FFF2D1" strokeWidth="0.8" strokeOpacity="0.7" />
        </g>

        {/* ── Bottom Inscription Ribbon ── */}
        <path
          d="M74 186 Q110 180 146 186 L144 195 Q110 189 76 195 Z"
          fill="url(#emblemOuterBevel)"
          stroke="#5C4520"
          strokeWidth="0.8"
          filter="url(#emblem3DShadow)"
        />
        <text
          x="110"
          y="192"
          textAnchor="middle"
          fill="#0B0D12"
          fontSize="5.5"
          fontWeight="900"
          letterSpacing="1.8"
        >
          LEX ET IUSTITIA
        </text>
      </svg>
    </div>
  )
}
