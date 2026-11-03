export default function FarmIllustration() {
  return (
    <svg viewBox="0 0 560 440" role="img" aria-label="Illustration of an Indian farm with crop rows, sun and a smartphone advisory card" className="h-auto w-full">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id="fieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#14532d" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect width="560" height="440" rx="32" fill="url(#skyGrad)" />
      <circle cx="455" cy="80" r="36" fill="#fbbf24" opacity="0.95" />
      <circle cx="455" cy="80" r="52" fill="#fbbf24" opacity="0.18" />
      <path d="M0 260 Q120 215 250 250 T560 235 V440 H0Z" fill="#bbf7d0" opacity="0.75" />
      <path d="M0 300 Q150 250 300 288 T560 270 V440 H0Z" fill="url(#fieldGrad)" opacity="0.92" />

      <g stroke="#dcfce7" strokeWidth="3" opacity="0.6">
        <path d="M20 380 Q160 330 320 360" fill="none" />
        <path d="M60 420 Q220 360 400 392" fill="none" />
        <path d="M-10 340 Q150 292 300 320" fill="none" />
      </g>

      <g fill="#22c55e">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i} transform={`translate(${55 + i * 52} ${315 + (i % 2) * 12})`}>
            <path d="M0 58 C-4 30 -2 14 0 0 C2 14 4 30 0 58Z" fill="#15803d" />
            <path d="M0 36 C-14 30 -22 18 -24 8 C-12 12 -3 22 0 36Z" fill="#86efac" />
            <path d="M0 30 C14 24 22 12 24 2 C12 6 3 16 0 30Z" fill="#4ade80" />
          </g>
        ))}
      </g>

      <g transform="translate(62 90)">
        <rect width="210" height="150" rx="20" fill="url(#cardGrad)" filter="url(#shadow)" />
        <rect x="18" y="18" width="48" height="48" rx="14" fill="#dcfce7" />
        <path d="M34 54c0-12 7-20 18-22-1 12-8 20-18 22Z" fill="#15803d" />
        <path d="M42 32v22" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
        <text x="80" y="38" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="#15803d">CROP HEALTH</text>
        <text x="80" y="57" fontFamily="Manrope, sans-serif" fontSize="15" fontWeight="800" fill="#14532d">Monitor today</text>
        <rect x="18" y="82" width="174" height="10" rx="5" fill="#dcfce7" />
        <rect x="18" y="82" width="120" height="10" rx="5" fill="#22c55e" />
        <text x="18" y="116" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="600" fill="#166534">Weather · Market · Schemes</text>
        <circle cx="186" cy="118" r="12" fill="#0ea5e9" opacity="0.15" />
        <path d="M181 119a5 5 0 0 1 10 0c0 4-5 7-5 7s-5-3-5-7Z" fill="#0284c7" />
      </g>

      <g transform="translate(325 155)">
        <rect width="175" height="126" rx="18" fill="#ffffff" filter="url(#shadow)" />
        <text x="18" y="29" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#0369a1">WEATHER ADVISORY</text>
        <text x="18" y="58" fontFamily="Fraunces, serif" fontSize="27" fontWeight="700" fill="#14532d">28°C</text>
        <text x="18" y="78" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="600" fill="#166534">Rain likely in 24 hours</text>
        <rect x="18" y="92" width="140" height="7" rx="3.5" fill="#dbeefe" />
        <rect x="18" y="92" width="92" height="7" rx="3.5" fill="#0ea5e9" />
        <circle cx="148" cy="27" r="9" fill="#fef3c7" />
        <circle cx="148" cy="27" r="4" fill="#f59e0b" />
      </g>

      <g transform="translate(370 312)">
        <rect width="150" height="84" rx="16" fill="#052e16" opacity="0.92" />
        <text x="16" y="27" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="#86efac">MANDI SNAPSHOT</text>
        <text x="16" y="50" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="#ffffff">Tomato · ₹1,530</text>
        <text x="16" y="68" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="500" fill="#bbf7d0">Compare 4 nearby markets</text>
      </g>

      <g fill="#14532d" opacity="0.14">
        <circle cx="35" cy="70" r="5" />
        <circle cx="70" cy="45" r="3" />
        <circle cx="120" cy="35" r="4" />
      </g>
    </svg>
  );
}
