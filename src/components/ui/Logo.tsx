import { useId } from 'react'

interface LogoProps {
  size?: number
  className?: string
}

/** App mark: green wallet with a bill and a gold coin. Mirrors public/logo.svg. */
export function Logo({ size = 32, className = '' }: LogoProps) {
  // Gradient ids must be unique per instance; strip characters React uses that aren't valid in url(#…).
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#113821" />
          <stop offset="1" stopColor="#0a2014" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2fd56f" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id={`${id}-coin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill={`url(#${id}-tile)`} />
      <g transform="translate(-2 3)">
        <rect x="22" y="15" width="48" height="28" rx="4" fill="#4ade80" fillOpacity=".45" transform="rotate(-14 46 29)" />
        <g transform="rotate(-6 51 30)">
          <rect x="27" y="16" width="48" height="28" rx="4" fill="#86efac" />
          <rect x="30.5" y="19.5" width="41" height="21" rx="2" stroke="#15803d" strokeOpacity=".35" strokeWidth="1.5" />
          <circle cx="51" cy="30" r="6.5" stroke="#15803d" strokeWidth="2.5" />
        </g>
        <rect x="15" y="34" width="70" height="47" rx="14" fill={`url(#${id}-body)`} />
        <path d="M25 41.5H50" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="56" y="49" width="33" height="19" rx="9.5" fill="#0a2014" />
        <circle cx="65.5" cy="58.5" r="3.8" fill="#fbbf24" />
        <circle cx="77" cy="23" r="11" fill={`url(#${id}-coin)`} />
        <circle cx="77" cy="23" r="6.5" stroke="#c2620a" strokeWidth="1.75" />
      </g>
    </svg>
  )
}
