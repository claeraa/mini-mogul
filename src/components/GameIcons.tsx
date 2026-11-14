/** Small original icons for the game's counters, signs and buttons. */

type IconProps = { className?: string }

const frame = (className: string | undefined) => ({
  className: className ? `game-icon ${className}` : 'game-icon',
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
})

export function PriceTagIcon({ className }: IconProps) {
  return (
    <svg {...frame(className)}>
      <path d="M3 4.500A1.500 1.500 0 0 1 4.500 3h7.200a2 2 0 0 1 1.400.6l7.300 7.300a2 2 0 0 1 0 2.800l-6.700 6.700a2 2 0 0 1-2.800 0l-7.300-7.300A2 2 0 0 1 3 11.700z" fill="#ffd23f" stroke="#b96a10" strokeWidth="1.500" />
      <circle cx="7.500" cy="7.500" r="1.700" fill="#fff8e6" stroke="#b96a10" strokeWidth="1.200" />
      <path d="M11 12.500l3.500 3.500M14.500 10.500l-4 6" stroke="#8a4b00" strokeWidth="1.600" strokeLinecap="round" />
    </svg>
  )
}

export function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg {...frame(className)}>
      <path d="M4 9.500h4l9-5v15l-9-5H4z" fill="#ff8fb8" stroke="#a83a6a" strokeWidth="1.500" strokeLinejoin="round" />
      <path d="M6.500 14.500l1.500 5h2.500l-1-5" fill="#ffd0dc" stroke="#a83a6a" strokeWidth="1.500" strokeLinejoin="round" />
      <path d="M19.500 9.500c1.200 1.500 1.200 3.500 0 5" fill="none" stroke="#a83a6a" strokeWidth="1.600" strokeLinecap="round" />
    </svg>
  )
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...frame(className)}>
      <circle cx="8" cy="7.500" r="3.500" fill="#ffe2c4" stroke="#17325c" strokeWidth="1.200" />
      <path d="M2 20c0-5 3-7.500 6-7.500s6 2.500 6 7.500z" fill="#ff9c82" stroke="#17325c" strokeWidth="1.200" strokeLinejoin="round" />
      <circle cx="16.500" cy="9" r="3" fill="#f3c9a0" stroke="#17325c" strokeWidth="1.200" />
      <path d="M13 20c.3-4 1.800-6 3.500-6 2.500 0 5 2 5 6z" fill="#8f7ff0" stroke="#17325c" strokeWidth="1.200" strokeLinejoin="round" />
    </svg>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...frame(className)}>
      <path d="M12 3.500c-4 0-6 3-6 7v3.500L4 17.500h16L18 14v-3.500c0-4-2-7-6-7z" fill="#fff3a0" stroke="currentColor" strokeWidth="1.600" strokeLinejoin="round" />
      <path d="M10 19.500a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.600" strokeLinecap="round" />
      <circle cx="12" cy="2.800" r="1.300" fill="currentColor" />
    </svg>
  )
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...frame(className)}>
      <circle cx="12" cy="12" r="5" fill="#ffd23f" stroke="#e58a1f" strokeWidth="1.400" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="#e58a1f" strokeWidth="1.800" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...frame(className)}>
      <path d="M6 9.500l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
