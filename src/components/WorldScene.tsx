import { useId } from 'react'
import type { ReactNode } from 'react'
import type {
  BiomeId,
  DecorationId,
  WorldBlueprint,
  WorldColors,
} from '../world/blueprint.ts'
import { Structure, WorldProp } from './WorldParts.tsx'

type WorldSceneProps = {
  blueprint: WorldBlueprint
  /** The wooden sign under the scene, usually the shop's name. */
  sign?: string
  /** Floats over the sky: day counter, cash and so on. */
  hud?: ReactNode
  /** A strip of ground under the scene for customers and the shelf. */
  street?: ReactNode
}

const W = 320
const H = 210
/** Where buildings stand. */
const BASE_X = 160
const BASE_Y = 174

/** Front-left, front-right, then a smaller one further back. */
const PROP_SLOTS = [
  { x: 60, y: 186, scale: 1.150 },
  { x: 262, y: 186, scale: 1.150 },
  { x: 232, y: 172, scale: 0.850 },
]

const STARS = [
  [22, 20], [58, 44], [96, 16], [128, 52], [150, 24], [190, 40], [214, 14],
  [300, 22], [286, 70], [36, 78], [176, 70], [244, 84],
]

// ---- Backdrops ------------------------------------------------------------------

function RoundTree({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-20" width="6" height="22" rx="3" fill="#a77b52" />
      <circle cx="0" cy="-30" r="16" fill={fill} />
      <circle cx="-10" cy="-22" r="10" fill={fill} />
      <circle cx="10" cy="-22" r="10" fill={fill} />
      <circle cx="-5" cy="-34" r="5" fill="#fff" opacity="0.18" />
    </g>
  )
}

function Pine({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-10" width="6" height="12" rx="2" fill="#8f6a4a" />
      <path d="M-18 -8L0 -34l18 26z" fill={fill} stroke={fill} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-13 -26L0 -48l13 22z" fill={fill} stroke={fill} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-8 -44L0 -60l8 16z" fill={fill} stroke={fill} strokeWidth="4" strokeLinejoin="round" />
    </g>
  )
}

function Hills({ c }: { c: WorldColors }) {
  return (
    <>
      <path d="M0 150C40 118 90 118 130 140c40-20 100-32 190 2v68H0z" fill={c.hillFar} />
      <path d="M0 164c60-26 110-14 160-8 60-16 110-14 160 2v52H0z" fill={c.hillNear} />
    </>
  )
}

function Ground({ c, path = true }: { c: WorldColors; path?: boolean }) {
  return (
    <>
      <path d="M0 172Q160 156 320 172v38H0z" fill={c.ground} />
      <ellipse cx={BASE_X} cy={BASE_Y + 1} rx="86" ry="9" fill={c.groundShade} opacity="0.7" />
      {path && (
        <path d="M150 176q4 16-14 34h52q-12-18-14-34z" fill="#fff3d6" opacity="0.75" />
      )}
    </>
  )
}

function Dots({ points, fills }: { points: number[][]; fills: string[] }) {
  return (
    <>
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.200" fill={fills[i % fills.length]} />
      ))}
    </>
  )
}

function Backdrop({ biome, c }: { biome: BiomeId; c: WorldColors }) {
  switch (biome) {
    case 'meadow':
      return (
        <>
          <Hills c={c} />
          <RoundTree x={30} y={166} fill="#6fc47a" />
          <RoundTree x={296} y={164} s={0.850} fill="#7fd08a" />
          <Ground c={c} />
          <Dots points={[[20, 194], [44, 202], [96, 198], [118, 188], [206, 200], [290, 198], [304, 188]]} fills={['#fff', '#ffe873']} />
        </>
      )
    case 'park':
      return (
        <>
          <Hills c={c} />
          <RoundTree x={26} y={164} fill="#6fc47a" />
          <RoundTree x={300} y={162} s={0.900} fill="#7fd08a" />
          <Ground c={c} />
          <g stroke="#fffaf0" strokeWidth="3" strokeLinecap="round">
            <path d="M6 180h84M230 180h84" />
            <path d="M10 172v14M30 172v14M50 172v14M70 172v14M88 172v14M234 172v14M254 172v14M274 172v14M294 172v14M312 172v14" />
          </g>
          <ellipse cx="282" cy="200" rx="26" ry="6" fill="#9fdcf2" />
          <path d="M268 199q6-3 12 0" stroke="#fff" strokeWidth="1.500" fill="none" strokeLinecap="round" opacity="0.8" />
        </>
      )
    case 'garden':
      return (
        <>
          <Hills c={c} />
          <g fill="#5fbf6a">
            {[8, 30, 52, 74, 246, 268, 290, 312].map((x) => (
              <circle key={x} cx={x} cy="166" r="14" />
            ))}
          </g>
          <Dots points={[[10, 160], [34, 156], [56, 162], [250, 158], [272, 162], [296, 156]]} fills={['#ff8fb8', '#fff', '#ffe873']} />
          <Ground c={c} />
          <Dots
            points={[[14, 192], [28, 202], [46, 190], [70, 200], [92, 192], [112, 202], [208, 198], [226, 190], [246, 202], [284, 196], [304, 190]]}
            fills={['#ff8fb8', '#fff', '#ffe873', '#b79cf5']}
          />
        </>
      )
    case 'crags':
      return (
        <>
          <path d="M0 152L30 96l28 36 34-54 36 60h62l36-52 32 42 32-28 30 40v68H0z" fill={c.hillFar} stroke={c.hillFar} strokeWidth="6" strokeLinejoin="round" />
          <path d="M92 78l-9 14 9-4 8 5zM226 86l-8 12 8-3 7 4z" fill="#fff" opacity="0.85" />
          <path d="M0 166c50-20 100-10 160-8 60-12 110-10 160 4v48H0z" fill={c.hillNear} />
          <Ground c={c} />
          <ellipse cx="24" cy="184" rx="14" ry="8" fill={c.groundShade} />
          <ellipse cx="38" cy="188" rx="8" ry="5" fill={c.hillFar} />
          <ellipse cx="300" cy="196" rx="12" ry="7" fill={c.groundShade} />
        </>
      )
    case 'woods':
      return (
        <>
          <Hills c={c} />
          <Pine x={84} y={160} s={0.600} fill="#5fb07f" />
          <Pine x={244} y={160} s={0.650} fill="#5fb07f" />
          <Pine x={52} y={164} s={0.850} fill="#49a06c" />
          <Pine x={272} y={164} s={0.900} fill="#49a06c" />
          <Pine x={20} y={170} s={1.150} fill="#3f9461" />
          <Pine x={302} y={170} s={1.150} fill="#3f9461" />
          <Ground c={c} />
          <g>
            <rect x="104" y="192" width="4" height="7" rx="2" fill="#fff7e0" />
            <path d="M98 193a8 7 0 0 1 16 0z" fill="#f0705f" />
            <rect x="214" y="196" width="3.500" height="6" rx="1.700" fill="#fff7e0" />
            <path d="M209 197a7 6 0 0 1 13.500 0z" fill="#f0705f" />
          </g>
        </>
      )
    case 'beach':
      return (
        <>
          <path d="M0 126h320v54H0z" fill={c.hillFar} />
          <g className="w-shimmer" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7">
            <path d="M20 140h22M70 150h30M130 138h18M196 146h28M260 138h24M34 160h18M228 160h22" />
          </g>
          <g transform="translate(56 126)">
            <path d="M-10 0h20l-4 6h-12z" fill="#fff" />
            <path d="M0 -2v-16l10 14z" fill="#ffd978" />
          </g>
          <path d="M0 168q160-16 320 0v14H0z" fill={c.hillNear} />
          <Ground c={c} path={false} />
          <g transform="translate(298 176)">
            <path d="M0 0c-2-18-6-30-12-40" fill="none" stroke="#b98a5e" strokeWidth="5" strokeLinecap="round" />
            <g fill="none" stroke="#58b96b" strokeWidth="5" strokeLinecap="round">
              <path d="M-12 -40c-10-6-20-4-26 2M-12 -40c-4-10-12-14-20-12M-12 -40c6-8 16-10 24-6M-12 -40c10-2 18 2 22 10" />
            </g>
          </g>
          <path d="M32 196l2.200 4.500 5 .7-3.600 3.500.9 5-4.500-2.400-4.500 2.400.9-5-3.600-3.500 5-.7z" fill={c.accent} transform="scale(0.8) translate(8 48)" />
          <circle cx="250" cy="202" r="3.500" fill="#fff" opacity="0.9" />
        </>
      )
  }
}

// ---- Sky ------------------------------------------------------------------------

function Sky({ blueprint, gradientId }: { blueprint: WorldBlueprint; gradientId: string }) {
  const c = blueprint.colors
  const night = blueprint.timeOfDay === 'night'
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.skyTop} />
          <stop offset="1" stopColor={c.skyBottom} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${gradientId})`} />
      {night &&
        STARS.map(([x, y], i) => (
          <circle
            key={i}
            className="w-twinkle"
            style={{ animationDelay: `${(i % 5) * 0.6}s` }}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 1.800 : 1.200}
            fill="#fff"
          />
        ))}
      <circle className="w-glow" cx="262" cy="40" r="28" fill={c.glow} opacity="0.35" />
      <circle cx="262" cy="40" r="18" fill={c.glow} />
      {night && (
        <>
          <circle cx="255" cy="34" r="4" fill="#e9ddb0" />
          <circle cx="268" cy="46" r="3" fill="#e9ddb0" />
          <circle cx="258" cy="48" r="1.800" fill="#e9ddb0" />
        </>
      )}
      <g fill="#fff" opacity={night ? 0.22 : 0.9}>
        <g className="w-cloud">
          <circle cx="44" cy="40" r="10" />
          <circle cx="58" cy="34" r="13" />
          <circle cx="74" cy="40" r="10" />
          <rect x="38" y="38" width="44" height="12" rx="6" />
        </g>
        <g className="w-cloud w-cloud--slow">
          <circle cx="188" cy="24" r="7" />
          <circle cx="198" cy="20" r="9" />
          <circle cx="209" cy="24" r="7" />
          <rect x="183" y="23" width="32" height="8" rx="4" />
        </g>
      </g>
    </>
  )
}

// ---- Decorations ----------------------------------------------------------------

const SPARK = 'M0 -6c.6 3.600 2.400 5.400 6 6-3.600.6-5.400 2.400-6 6-.6-3.600-2.400-5.400-6-6 3.600-.6 5.400-2.400 6-6z'
const HEART = 'M0 4C-7 -1-5 -7 0 -3 5 -7 7 -1 0 4z'

/** Evenly spaced points along a sagging garland between two pegs. */
function garland(x0: number, x1: number, y: number, sag: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    return {
      x: x0 + (x1 - x0) * t,
      y: y + 4 * sag * t * (1 - t),
    }
  })
}

function Decoration({ id, c }: { id: DecorationId; c: WorldColors }) {
  const delay = (i: number, step: number) => ({ animationDelay: `${i * step}s` })
  switch (id) {
    case 'sparkles':
      return (
        <g>
          {[[92, 78, 1], [230, 66, 0.800], [252, 128, 0.700], [70, 132, 0.800], [150, 44, 0.600], [208, 104, 0.550]].map(
            ([x, y, s], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <path className="w-twinkle" style={delay(i, 0.45)} d={SPARK} fill={i % 2 ? c.trim : '#fff'} />
              </g>
            ),
          )}
        </g>
      )
    case 'fireflies':
      return (
        <g>
          {[[40, 136], [84, 110], [118, 150], [214, 128], [250, 150], [288, 118]].map(([x, y], i) => (
            <circle key={i} className="w-firefly" style={delay(i, 0.7)} cx={x} cy={y} r="2.200" fill="#fff3a0" />
          ))}
        </g>
      )
    case 'butterflies':
      return (
        <g>
          {[[72, 116, '#ff8fb8'], [248, 102, '#ffd978']].map(([x, y, fill], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g className="w-wander" style={delay(i, 1.300)}>
                <ellipse className="w-flap" cx="-3.500" cy="0" rx="4" ry="5.500" fill={fill as string} />
                <ellipse className="w-flap w-flap--right" cx="3.500" cy="0" rx="4" ry="5.500" fill={fill as string} />
                <rect x="-0.800" y="-4" width="1.600" height="8" rx="0.800" fill="#5f3d42" />
              </g>
            </g>
          ))}
        </g>
      )
    case 'bunting': {
      const fills = [c.accent, c.trim, c.roof, '#fff']
      const left = garland(-6, 160, 8, 16, 7)
      const right = garland(160, 326, 8, 16, 7)
      return (
        <g className="w-sway w-sway--soft">
          <path d="M-6 8Q77 40 160 8Q243 40 326 8" fill="none" stroke="#fff" strokeWidth="1.500" opacity="0.9" />
          {[...left, ...right].map((p, i) => (
            <path key={i} d={`M${p.x - 5} ${p.y - 1}h10l-5 11z`} fill={fills[i % fills.length]} />
          ))}
        </g>
      )
    }
    case 'hearts':
      return (
        <g>
          {[[136, 84], [186, 76], [162, 60]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path className="w-rise" style={delay(i, 1.400)} d={HEART} fill="#ff8fa8" />
            </g>
          ))}
        </g>
      )
    case 'bubbles':
      return (
        <g>
          {[[112, 122, 4], [124, 104, 3], [204, 118, 5], [216, 96, 3], [196, 84, 2.500]].map(([x, y, r], i) => (
            <circle
              key={i}
              className="w-rise"
              style={delay(i, 0.9)}
              cx={x}
              cy={y}
              r={r}
              fill="#fff"
              fillOpacity="0.3"
              stroke="#fff"
              strokeWidth="1"
            />
          ))}
        </g>
      )
    case 'petals':
      return (
        <g>
          {[[40, 60], [98, 30], [150, 70], [214, 44], [272, 90], [300, 50]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <ellipse className="w-fall" style={delay(i, 1.100)} rx="3.500" ry="2" fill={i % 2 ? '#ffc2d6' : '#fff'} />
            </g>
          ))}
        </g>
      )
    case 'seagulls':
      return (
        <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {[[84, 52, 1], [124, 70, 0.700]].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <path className="w-glide" style={delay(i, 2)} d="M-8 0q4-6 8 0q4-6 8 0" />
            </g>
          ))}
        </g>
      )
    case 'smoke':
      return (
        <g fill="#fff">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              className="w-smoke"
              style={delay(i, 1.200)}
              cx={BASE_X + 39}
              cy={BASE_Y - 126}
              r={5 + i}
            />
          ))}
        </g>
      )
  }
}

// ---- The scene ------------------------------------------------------------------

/** A live picture of the player's business world, drawn from its blueprint. */
export function WorldScene({ blueprint, sign, hud, street }: WorldSceneProps) {
  const gradientId = `sky${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const c = blueprint.colors
  const night = blueprint.timeOfDay === 'night'

  return (
    <figure
      className="world"
      data-theme={blueprint.theme}
      data-time={blueprint.timeOfDay}
    >
      <div className="world__view">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${blueprint.label} scene`}>
          <Sky blueprint={blueprint} gradientId={gradientId} />
          <Backdrop biome={blueprint.biome} c={c} />
          {night && <rect width={W} height={H} fill="#1d1b5a" opacity="0.28" />}
          <g transform={`translate(${BASE_X} ${BASE_Y})`}>
            <g className="w-settle" key={blueprint.structure}>
              <Structure type={blueprint.structure} colors={c} icon={blueprint.productIcon} />
            </g>
          </g>
          {blueprint.props.slice(0, PROP_SLOTS.length).map((id, i) => (
            <WorldProp key={id} id={id} {...PROP_SLOTS[i]} colors={c} icon={blueprint.productIcon} />
          ))}
          {blueprint.decorations.map((id) => (
            <Decoration key={id} id={id} c={c} />
          ))}
        </svg>
        {hud && <div className="world__hud">{hud}</div>}
      </div>
      {street && (
        <div className="world__street" style={{ background: c.ground }}>
          {street}
        </div>
      )}
      {sign !== undefined && (
        <figcaption className="world__sign">{sign.trim() || 'Your shop name'}</figcaption>
      )}
    </figure>
  )
}
