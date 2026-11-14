import { useId } from 'react'
import type { CSSProperties } from 'react'

type Puff = [cx: number, cy: number, rx: number, ry: number]

const CLOUD_SHAPES: Record<'tower' | 'bank' | 'wisp', Puff[]> = {
  tower: [
    [200, 150, 180, 38],
    [120, 122, 70, 50],
    [200, 98, 86, 66],
    [286, 120, 72, 52],
    [158, 74, 48, 40],
    [246, 66, 50, 42],
  ],
  bank: [
    [200, 142, 190, 30],
    [110, 120, 60, 34],
    [190, 106, 76, 42],
    [282, 120, 66, 34],
    [342, 134, 44, 22],
  ],
  wisp: [
    [200, 140, 120, 28],
    [160, 114, 52, 38],
    [232, 106, 58, 44],
  ],
}

type CloudProps = {
  shape: keyof typeof CLOUD_SHAPES
  left: number
  top: number
  /** Width in vw (with a pixel floor so clouds stay present on phones). */
  size: number
  opacity?: number
  drift: 'a' | 'b' | 'c'
}

function Cloud({ shape, left, top, size, opacity = 1, drift }: CloudProps) {
  const id = useId()
  const puffs = CLOUD_SHAPES[shape]
  return (
    <div
      className={`cloud cloud--drift-${drift}`}
      style={
        {
          left: `${left}%`,
          top: `${top}%`,
          '--size': size,
          opacity,
        } as CSSProperties
      }
    >
      <svg viewBox="0 0 400 200" focusable="false">
        <defs>
          <linearGradient
            id={`${id}-body`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="30"
            x2="0"
            y2="185"
          >
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#f3f9ff" />
            <stop offset="1" stopColor="#b3cff4" />
          </linearGradient>
          <filter
            id={`${id}-paint`}
            x="-15%"
            y="-25%"
            width="130%"
            height="150%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014"
              numOctaves="2"
              seed={shape.length + size}
            />
            <feDisplacementMap in="SourceGraphic" scale="22" />
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <g filter={`url(#${id}-paint)`}>
          <g fill={`url(#${id}-body)`}>
            {puffs.map(([cx, cy, rx, ry]) => (
              <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} />
            ))}
          </g>
          <g fill="#fffaf0" opacity="0.75">
            {puffs.slice(1).map(([cx, cy, rx, ry]) => (
              <ellipse
                key={`${cx}-${cy}`}
                cx={cx - rx * 0.18}
                cy={cy - ry * 0.3}
                rx={rx * 0.55}
                ry={ry * 0.45}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  )
}

function FarIsle({ className }: { className: string }) {
  const id = useId()
  return (
    <svg className={`far-isle ${className}`} viewBox="0 0 200 130">
      <defs>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8d6f2" />
          <stop offset="1" stopColor="#6c9fdc" />
        </linearGradient>
      </defs>
      <path
        d="M22 52c14 22 40 30 52 50 8 14 20 22 30 20 12-2 14-18 26-26 18-12 40-20 48-44z"
        fill={`url(#${id}-haze)`}
      />
      <path
        d="M16 52c6-14 34-18 52-22 10-16 34-18 46-6 24-2 62 8 70 28-20 12-140 12-168 0z"
        fill="#b9e3ee"
      />
      <circle cx="84" cy="24" r="15" fill="#a3d3e6" />
      <circle cx="100" cy="30" r="11" fill="#b4deeb" />
    </svg>
  )
}

// Fixed values (not random) so the scene is identical on every render.
const PARTICLES = [
  { x: 8, y: 74, size: 5, time: 16, delay: 0, drift: 24 },
  { x: 17, y: 58, size: 4, time: 19, delay: 6, drift: -18 },
  { x: 26, y: 82, size: 6, time: 15, delay: 3, drift: 30 },
  { x: 34, y: 66, size: 4, time: 21, delay: 11, drift: 14 },
  { x: 43, y: 86, size: 5, time: 17, delay: 8, drift: -26 },
  { x: 52, y: 78, size: 4, time: 20, delay: 1.5, drift: 20 },
  { x: 60, y: 62, size: 6, time: 18, delay: 13, drift: -16 },
  { x: 68, y: 84, size: 4, time: 16, delay: 5, drift: 28 },
  { x: 76, y: 70, size: 5, time: 22, delay: 9.5, drift: -22 },
  { x: 84, y: 56, size: 4, time: 17, delay: 2.5, drift: 16 },
  { x: 91, y: 80, size: 6, time: 19, delay: 14, drift: -30 },
  { x: 47, y: 52, size: 4, time: 23, delay: 7, drift: 12 },
]

/**
 * The persistent world behind every screen: sky, clouds, far isles, water
 * and drifting pollen. Purely decorative, so hidden from assistive tech.
 */
export function AmbientLayers() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="sky" />
      <div className="sky-light" />

      <div className="layer layer--far">
        <Cloud shape="wisp" left={38} top={19} size={13} opacity={0.8} drift="b" />
        <Cloud shape="tower" left={3} top={31} size={25} opacity={0.85} drift="a" />
        <Cloud shape="bank" left={62} top={37} size={30} opacity={0.85} drift="c" />
        <Cloud shape="bank" left={-9} top={50} size={36} opacity={0.6} drift="b" />
        <Cloud shape="tower" left={77} top={46} size={25} opacity={0.65} drift="a" />
        <Cloud shape="bank" left={30} top={54} size={40} opacity={0.5} drift="c" />
      </div>

      <div className="layer layer--isles">
        <FarIsle className="far-isle--left" />
        <FarIsle className="far-isle--right" />
      </div>

      <svg
        className="hills"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          d="M0 60V44c90-20 170-30 260-18 70 9 120 22 200 14 110-12 170-38 290-30 100 6 150 30 250 28 120-2 190-34 300-26 60 4 100 14 140 22v26z"
          fill="#8cc4e4"
          opacity="0.75"
        />
      </svg>

      <div className="water">
        <div className="water-glint" />
        <div className="water-isle" />
        <div className="shimmer shimmer--far" />
        <div className="shimmer shimmer--mid" />
        <div className="shimmer shimmer--near" />
        <div className="ripples">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="layer layer--mid">
        <Cloud shape="tower" left={-7} top={7} size={34} drift="c" />
        <Cloud shape="tower" left={73} top={11} size={36} drift="b" />
        <Cloud shape="wisp" left={22} top={43} size={15} opacity={0.9} drift="a" />
      </div>

      <div className="particles">
        {PARTICLES.map((p) => (
          <span
            key={p.x}
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                '--time': `${p.time}s`,
                '--delay': `${p.delay}s`,
                '--drift': `${p.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="veil" />
    </div>
  )
}
