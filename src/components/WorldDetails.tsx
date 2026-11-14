import type {
  BiomeId,
  ProductIconId,
  WorldBlueprint,
  WorldColors,
  WorldThemeId,
} from '../world/blueprint.ts'
import { Glyph } from './WorldParts.tsx'

/**
 * The small things that make a world feel lived in: light, plants in the
 * foreground, a path to the door, and a few touches that belong to each kind
 * of business. All original SVG, drawn in the scene's 320 × 210 space.
 */

const WOOD = '#b07a45'
const LEAF = '#58b96b'
const LEAF_DARK = '#439a58'

// ---- Light ----------------------------------------------------------------------

export function Lighting({ blueprint }: { blueprint: WorldBlueprint }) {
  const glow = blueprint.colors.glow
  if (blueprint.timeOfDay === 'night') {
    return (
      <g>
        <circle className="w-glow" cx="160" cy="124" r="84" fill="#ffd978" opacity="0.1" />
        <circle cx="160" cy="130" r="54" fill="#ffd978" opacity="0.1" />
        <ellipse cx="160" cy="191" rx="44" ry="8" fill="#ffe9a8" opacity="0.32" />
      </g>
    )
  }
  return (
    <g className="w-rays" fill={glow} opacity="0.16">
      <path d="M262 40L96 210h58z" />
      <path d="M262 40L206 210h44z" />
      <path d="M262 40L0 150v34z" />
    </g>
  )
}

// ---- Foreground -----------------------------------------------------------------

function Tuft({ x, y, fill, s = 1 }: { x: number; y: number; fill: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        className="w-nod"
        d="M-5 0q1-8-2-12M0 0v-15M5 0q-1-8 2-12"
        fill="none"
        stroke={fill}
        strokeWidth="2.600"
        strokeLinecap="round"
      />
    </g>
  )
}

function Flower({ x, y, fill, s = 1 }: { x: number; y: number; fill: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0v-12" stroke={LEAF_DARK} strokeWidth="1.800" strokeLinecap="round" />
      <path d="M0 -5c-4 0-5-3-5-4 3 0 5 1 5 4z" fill={LEAF} />
      <g className="w-nod" fill={fill}>
        <circle cx="0" cy="-17" r="2.600" />
        <circle cx="-3.600" cy="-14" r="2.600" />
        <circle cx="3.600" cy="-14" r="2.600" />
        <circle cx="-2.200" cy="-10" r="2.600" />
        <circle cx="2.200" cy="-10" r="2.600" />
        <circle cx="0" cy="-13.200" r="2.200" fill="#ffe873" />
      </g>
    </g>
  )
}

function Tulip({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0v-11" stroke={LEAF_DARK} strokeWidth="1.800" strokeLinecap="round" />
      <path d="M0 -3c4-1 5-5 5-7-3 1-5 3-5 7zM0 -2c-4-1-5-5-5-7 3 1 5 3 5 7z" fill={LEAF} />
      <path className="w-nod" d="M-4 -12c0-5 2-7 4-8 2 1 4 3 4 8-1 3-7 3-8 0z" fill={fill} />
    </g>
  )
}

function Bush({ x, y, s = 1, fill, berries }: { x: number; y: number; s?: number; fill: string; berries?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="-12" cy="-4" r="11" fill={fill} />
      <circle cx="10" cy="-5" r="12" fill={fill} />
      <circle cx="0" cy="-12" r="13" fill={fill} />
      <circle cx="-4" cy="-16" r="4" fill="#fff" opacity="0.16" />
      {berries && (
        <g fill={berries}>
          <circle cx="-9" cy="-8" r="2" />
          <circle cx="6" cy="-14" r="2" />
          <circle cx="12" cy="-4" r="2" />
        </g>
      )}
    </g>
  )
}

function Crystal({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-7 0l-3-10 4-7 5 6v11z" fill={fill} opacity="0.85" />
      <path d="M-1 0v-18l5-7 5 9-2 16z" fill={fill} />
      <path d="M4 -25l-3 7v18h3z" fill="#fff" opacity="0.35" />
      <path className="w-twinkle" d="M9 -22c.3 1.800 1.200 2.700 3 3-1.800.3-2.700 1.200-3 3-.3-1.800-1.200-2.700-3-3 1.800-.3 2.700-1.200 3-3z" fill="#fff" />
    </g>
  )
}

function Stones({ c }: { c: WorldColors }) {
  return (
    <g fill="#fff" stroke={c.groundShade} strokeWidth="1" opacity="0.8">
      <ellipse cx="160" cy="183" rx="7" ry="2.600" />
      <ellipse cx="155" cy="193" rx="9" ry="3" />
      <ellipse cx="163" cy="204" rx="11" ry="3.400" />
    </g>
  )
}

export function Foreground({ biome, c }: { biome: BiomeId; c: WorldColors }) {
  switch (biome) {
    case 'meadow':
      return (
        <>
          <Stones c={c} />
          <Bush x={6} y={214} s={1.200} fill={LEAF} berries={c.accent} />
          <Bush x={316} y={214} s={1.100} fill={LEAF_DARK} />
          <Tuft x={34} y={208} fill={LEAF_DARK} />
          <Tuft x={92} y={206} fill={LEAF} s={0.800} />
          <Tuft x={228} y={207} fill={LEAF_DARK} s={0.900} />
          <Flower x={46} y={208} fill="#fff" />
          <Flower x={22} y={200} fill={c.accent} s={0.900} />
          <Flower x={284} y={207} fill={c.trim} />
          <Flower x={298} y={199} fill="#fff" s={0.850} />
        </>
      )
    case 'park':
      return (
        <>
          <Stones c={c} />
          <Bush x={4} y={214} s={1.100} fill={LEAF} />
          <g transform="translate(96 205)">
            <path d="M-14 0v-9M14 0v-9" stroke={WOOD} strokeWidth="3" strokeLinecap="round" />
            <rect x="-18" y="-12" width="36" height="4" rx="2" fill="#d9a25f" />
            <rect x="-18" y="-21" width="36" height="4" rx="2" fill="#d9a25f" />
            <path d="M-15 -9v-11M15 -9v-11" stroke={WOOD} strokeWidth="2.500" strokeLinecap="round" />
          </g>
          <Tuft x={36} y={208} fill={LEAF_DARK} />
          <Tuft x={226} y={207} fill={LEAF_DARK} s={0.900} />
          <Flower x={52} y={208} fill={c.accent} />
          <Flower x={236} y={208} fill="#fff" s={0.900} />
          <Flower x={22} y={201} fill={c.trim} s={0.900} />
        </>
      )
    case 'garden':
      return (
        <>
          <Stones c={c} />
          <Bush x={6} y={214} s={1.100} fill={LEAF} berries="#fff" />
          <Bush x={316} y={214} s={1.100} fill={LEAF_DARK} berries={c.accent} />
          {[78, 90, 102, 114].map((x, i) => (
            <Tulip key={x} x={x} y={207} fill={[c.accent, c.trim, c.roof, '#fff'][i]} />
          ))}
          {[214, 226, 238].map((x, i) => (
            <Tulip key={x} x={x} y={208} fill={[c.trim, c.accent, '#b79cf5'][i]} />
          ))}
          <Tuft x={40} y={208} fill={LEAF_DARK} />
          <Flower x={52} y={208} fill="#fff" />
        </>
      )
    case 'woods':
      return (
        <>
          <Stones c={c} />
          <g fill="none" stroke={LEAF_DARK} strokeWidth="3" strokeLinecap="round">
            <path d="M4 210c2-14 10-22 20-24M10 210c6-10 14-14 24-13M2 210c-1-12 2-20 8-26" />
            <path d="M316 210c-2-14-10-22-20-24M310 210c-6-10-14-14-24-13M318 210c1-12-2-20-8-26" />
          </g>
          <g transform="translate(94 206)">
            <rect x="-20" y="-10" width="40" height="11" rx="5.500" fill="#a77b52" />
            <ellipse cx="-19" cy="-4.500" rx="3.500" ry="5.500" fill="#d9b98c" />
            <ellipse cx="-19" cy="-4.500" rx="1.500" ry="2.500" fill="#a77b52" />
            <path d="M6 -10c0-5 2-7 5-8" fill="none" stroke={LEAF} strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="-18" r="2.500" fill={LEAF} />
          </g>
          <g transform="translate(230 206)">
            <rect x="-2" y="-8" width="4" height="9" rx="2" fill="#fff7e0" />
            <path d="M-8 -7a8 7 0 0 1 16 0z" fill={c.accent} />
            <circle cx="-3" cy="-10" r="1.300" fill="#fff" />
            <circle cx="3" cy="-9" r="1" fill="#fff" />
            <rect x="9" y="-5" width="3" height="6" rx="1.500" fill="#fff7e0" />
            <path d="M5.500 -4a5 4.500 0 0 1 10 0z" fill={c.roof} />
          </g>
          <Tuft x={44} y={208} fill={LEAF_DARK} />
          <Tuft x={278} y={208} fill={LEAF_DARK} />
        </>
      )
    case 'crags':
      return (
        <>
          <Stones c={c} />
          <Crystal x={18} y={210} s={1.200} fill="#8fe3f2" />
          <Crystal x={300} y={210} s={1.100} fill="#d9a6ff" />
          <Crystal x={94} y={207} s={0.700} fill="#d9a6ff" />
          <Crystal x={230} y={208} s={0.650} fill="#8fe3f2" />
          <Tuft x={44} y={208} fill="#8f7cc8" />
          <Tuft x={272} y={208} fill="#8f7cc8" s={0.900} />
          <Flower x={60} y={208} fill={c.accent} s={0.900} />
        </>
      )
    case 'beach':
      return (
        <>
          <Tuft x={14} y={208} fill="#9fbf6a" s={1.200} />
          <Tuft x={30} y={209} fill="#b7cf7a" />
          <Tuft x={246} y={208} fill="#9fbf6a" />
          <g transform="translate(94 206)">
            <rect x="-14" y="-9" width="28" height="10" rx="2" fill="#f0c98a" />
            <rect x="-11" y="-17" width="8" height="9" rx="1" fill="#f0c98a" />
            <rect x="3" y="-17" width="8" height="9" rx="1" fill="#f0c98a" />
            <rect x="-4" y="-22" width="8" height="14" rx="1" fill="#f6d59c" />
            <path d="M0 -22v-9" stroke={WOOD} strokeWidth="1.500" strokeLinecap="round" />
            <path className="w-sway" d="M0 -31l8 2.500-8 3z" fill={c.accent} />
          </g>
          <g transform="translate(228 207)">
            <path d="M-7 -11h14l-2 12h-10z" fill={c.accent} />
            <path d="M-7 -11c0-9 14-9 14 0" fill="none" stroke={c.roof} strokeWidth="2" />
            <path d="M12 0l5-15" stroke={WOOD} strokeWidth="2" strokeLinecap="round" />
            <path d="M15 -17l5 1-2 5-4-1z" fill={c.roof} />
          </g>
          <g fill="#fff" stroke="#f1c9a0" strokeWidth="0.800">
            <path d="M52 204a5 5 0 0 1 10 0z" />
            <path d="M270 206a4 4 0 0 1 8 0z" />
          </g>
        </>
      )
  }
}

// ---- Touches for each kind of business --------------------------------------------

function Garland({ x0, x1, y, sag, fills }: { x0: number; x1: number; y: number; sag: number; fills: string[] }) {
  const count = 9
  const mid = (x0 + x1) / 2
  return (
    <g>
      <path d={`M${x0} ${y}Q${mid} ${y + 2 * sag} ${x1} ${y}`} fill="none" stroke="#5f3d42" strokeWidth="1" />
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count
        return (
          <circle
            key={i}
            className="w-twinkle"
            style={{ animationDelay: `${(i % 4) * 0.5}s` }}
            cx={x0 + (x1 - x0) * t}
            cy={y + 4 * sag * t * (1 - t) + 2.500}
            r="2.600"
            fill={fills[i % fills.length]}
          />
        )
      })}
    </g>
  )
}

function Footprints({ fill, paw }: { fill: string; paw?: boolean }) {
  // Beside the path, so they do not sit on the stepping stones.
  const spots = [[138, 186, -12], [144, 196, 14], [132, 205, -10]]
  return (
    <g opacity="0.55">
      {spots.map(([x, y, turn], i) =>
        paw ? (
          <g key={i} transform={`rotate(${turn} ${x} ${y})`}>
            <Glyph icon="paw" x={x} y={y} size={8} />
          </g>
        ) : (
          <g key={i} transform={`translate(${x} ${y}) rotate(${turn})`} fill={fill}>
            <ellipse cx="0" cy="1.500" rx="3" ry="3.500" />
            <path d="M-3.500 -2l-1.500-4 3 2zM-.800 -3l.800-4.500 1 4.500zM3.500 -2l1.500-4-3 2z" />
          </g>
        ),
      )}
    </g>
  )
}

export function ThemeDetails({
  theme,
  c,
  icon,
}: {
  theme: WorldThemeId
  c: WorldColors
  icon: ProductIconId
}) {
  switch (theme) {
    case 'bakery':
      return (
        <>
          {/* A chalkboard by the door and the smell of baking in the air. */}
          <g transform="translate(128 196)">
            <path d="M-9 0l4-22h10l4 22z" fill="#5f3d42" />
            <path d="M-6 -3l3-16h6l3 16z" fill="#3f4a45" />
            <Glyph icon={icon} x={0} y={-11} size={10} />
          </g>
          <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8">
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${104 + i * 9} 120)`}>
                <path className="w-rise" style={{ animationDelay: `${i * 1.300}s` }} d="M0 0q-3-4 0-8t0-8" />
              </g>
            ))}
          </g>
        </>
      )
    case 'creature-care':
      return (
        <>
          <Footprints fill="#8f7cc8" />
          <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${190 + i * 9} ${122 - i * 10}) scale(${0.700 + i * 0.250})`}>
                <path className="w-rise" style={{ animationDelay: `${i * 1.200}s` }} d="M0 0h6l-6 7h6" />
              </g>
            ))}
          </g>
          <g transform="translate(196 198)">
            <ellipse cx="0" cy="-2" rx="11" ry="4" fill={c.accent} opacity="0.5" />
            <path className="w-glow" d="M-3 -2c-3-6 1-9 1-13 3 2 6 6 5 13z" fill="#ffb347" />
            <path d="M-1 -2c-1-4 1-5 1-8 2 2 3 4 2 8z" fill="#fff3a0" />
          </g>
        </>
      )
    case 'pet-care':
      return (
        <>
          <Footprints fill="#8a5a48" paw />
          <g transform="translate(128 198)">
            <path d="M-11 -6h22l-3 7h-16z" fill={c.accent} />
            <ellipse cx="0" cy="-6" rx="11" ry="2.600" fill="#9fdcf2" />
            <path className="w-shimmer" d="M-5 -6h5" stroke="#fff" strokeWidth="1.200" strokeLinecap="round" />
          </g>
          <g transform="translate(198 198)">
            <path d="M-8 0v-6M8 0v-6" stroke={WOOD} strokeWidth="2.500" strokeLinecap="round" />
            <path d="M-12 -6q12-12 24 0z" fill={c.roof} />
            <circle className="w-bounce" cx="0" cy="-17" r="4" fill={c.trim} />
          </g>
        </>
      )
    case 'drink-stand':
      return (
        <>
          <Garland x0={84} x1={236} y={64} sag={7} fills={[c.accent, '#fff', c.trim, '#ff9fb2']} />
          <path d="M84 64v112M236 64v112" stroke={WOOD} strokeWidth="2.500" strokeLinecap="round" />
          <g transform="translate(196 199)">
            <rect x="-11" y="-13" width="22" height="13" rx="3" fill="#7fc7e8" />
            <rect x="-12" y="-16" width="24" height="5" rx="2.500" fill="#a6dcf2" />
            <g fill="#fff" opacity="0.9">
              <rect x="-7" y="-21" width="6" height="6" rx="1.500" transform="rotate(-12 -4 -18)" />
              <rect x="1" y="-22" width="6" height="6" rx="1.500" transform="rotate(10 4 -19)" />
            </g>
          </g>
        </>
      )
    case 'garden':
      return (
        <>
          <g transform="translate(118 132)">
            <g className="w-wander">
              <ellipse className="w-flap" cx="-2" cy="-4" rx="3.500" ry="2.500" fill="#fff" opacity="0.85" />
              <ellipse cx="0" cy="0" rx="5" ry="3.600" fill="#ffd23f" />
              <path d="M-1.500 -3.400v6.800M1.500 -3.400v6.800" stroke="#5f3d42" strokeWidth="1.400" />
              <circle cx="4.500" cy="-.5" r="1" fill="#5f3d42" />
            </g>
          </g>
          <g transform="translate(198 199)">
            <path d="M-12 -10h22l-4 9h-14z" fill={c.accent} />
            <circle cx="-8" cy="-1" r="4" fill="#5f3d42" />
            <circle cx="-8" cy="-1" r="1.500" fill="#d9b98c" />
            <path d="M10 -10l9-4" stroke={WOOD} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="-1" cy="-10" rx="10" ry="2.500" fill="#8a5a48" />
            <path d="M-5 -10v-6M0 -10v-8M5 -10v-5" stroke={LEAF} strokeWidth="1.800" strokeLinecap="round" />
            <circle cx="0" cy="-19" r="2.200" fill="#fff" />
          </g>
        </>
      )
    case 'craft-studio':
      return (
        <>
          <g transform="translate(128 199)">
            <ellipse cx="-6" cy="-1" rx="9" ry="3" fill={c.accent} />
            <ellipse cx="7" cy="-3" rx="6" ry="2.200" fill={c.trim} />
            <ellipse cx="2" cy="1" rx="4.500" ry="1.800" fill={c.roof} />
          </g>
          <g fill="#fff" stroke={c.accent} strokeWidth="0.800">
            {[[92, 96, 1], [232, 110, 0.800]].map(([x, y, s], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <path className="w-glide" style={{ animationDelay: `${i * 2}s` }} d="M-9 2l18-7-7 13-3-5z" />
              </g>
            ))}
          </g>
          <g transform="translate(198 199)">
            <rect x="-8" y="-12" width="16" height="12" rx="3" fill="#fff7e0" stroke={WOOD} strokeWidth="1" />
            <path d="M-4 -12v-9M0 -12v-11M4 -12v-8" stroke={WOOD} strokeWidth="1.800" strokeLinecap="round" />
            <circle cx="-4" cy="-22" r="2" fill={c.accent} />
            <circle cx="0" cy="-24" r="2" fill={c.roof} />
            <circle cx="4" cy="-21" r="2" fill={c.trim} />
          </g>
        </>
      )
    case 'book-nook':
      return (
        <>
          <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {['M-3 4l3-8 3 8M-2 1h4', 'M-2 -4v8M-2 1c5-3 5 5 0 3', 'M3 -2c-6-3-6 7 0 4'].map((d, i) => (
              <g key={i} transform={`translate(${200 + i * 11} ${118 - i * 12})`}>
                <path className="w-rise" style={{ animationDelay: `${i * 1.300}s` }} d={d} />
              </g>
            ))}
          </g>
          <g transform="translate(128 199)">
            <rect x="-7" y="-8" width="14" height="9" rx="3" fill="#a77b52" />
            <ellipse cx="0" cy="-8" rx="8" ry="2.600" fill="#d9b98c" />
            <path d="M-8 -12c3-2 5-2 8 0 3-2 5-2 8 0v3c-3-2-5-2-8 0-3-2-5-2-8 0z" fill="#fff" stroke={c.accent} strokeWidth="0.800" />
          </g>
        </>
      )
    case 'general-store':
      return (
        <>
          <g transform="translate(160 181)">
            <rect x="-13" y="-3" width="26" height="7" rx="2" fill={c.accent} />
            <path d="M-9 0.500h18" stroke="#fff" strokeWidth="1.500" strokeLinecap="round" opacity="0.8" />
          </g>
          <g transform="translate(118 178)">
            <g className="w-sway w-sway--soft">
              <path d="M0 0L-7 -30M0 0L1 -36M0 0L8 -29" stroke="#5f3d42" strokeWidth="0.800" />
              <ellipse cx="-7" cy="-36" rx="6" ry="7.500" fill={c.accent} />
              <ellipse cx="8" cy="-35" rx="6" ry="7.500" fill={c.trim} />
              <ellipse cx="1" cy="-43" rx="6" ry="7.500" fill={c.roof} />
              <ellipse cx="-1" cy="-46" rx="1.500" ry="2.500" fill="#fff" opacity="0.5" />
            </g>
          </g>
        </>
      )
  }
}
