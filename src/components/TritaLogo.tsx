interface TritaLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function TritaLogo({
  size = 80,
  showText = true,
  className = ''
}: TritaLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <defs>
          {/* Warm gradient (indigo to purple) */}
          <linearGradient id="warmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#8b5cf6"/>
          </linearGradient>
        </defs>

        {/* Hexagon shape */}
        <polygon
          points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
          fill="url(#warmGradient)"
          opacity="0.9"
        />

        {/* Inner connecting lines (6 HEXACO traits) */}
        <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="1.5" opacity="0.4"/>
        <line x1="15" y1="30" x2="85" y2="70" stroke="white" strokeWidth="1.5" opacity="0.4"/>
        <line x1="15" y1="70" x2="85" y2="30" stroke="white" strokeWidth="1.5" opacity="0.4"/>

        {/* Center dot */}
        <circle cx="50" cy="50" r="8" fill="white"/>
      </svg>

      {showText && (
        <span className="text-2xl font-bold tracking-wider text-indigo-600">
          TRITA
        </span>
      )}
    </div>
  )
}
