import type { WorldColors } from '../world/blueprint.ts'
import { mix, shade } from '../world/color.ts'

/**
 * The creature-care world's own artwork: baby dragons, their beds and toys,
 * glowing crystals, moss and mushrooms. Drawn in the scene's 320 × 210 space.
 *
 * It comes in two layers so the cave stays the focus:
 *   NurseryGround  - behind the building: rock pillars, a play rug, moss.
 *   NurseryDetails - in front: the dragons, a bed, an egg, mushrooms, a crystal.
 */

const MINT = '#9fe0c0'
const PEACH = '#ffb89a'
const EYE = '#3b2a4a'
const BLUSH = '#ff9aa8'
const GLOW = '#ffe9a8'

// ---- Small pieces -----------------------------------------------------------------

function Mushroom({ x, y, s = 1, cap }: { x: number; y: number; s?: number; cap: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle className="w-glow" cx="0" cy="-8" r="9" fill={cap} opacity="0.22" />
      <path d="M-2.500 0v-7h5v7z" fill="#fff7e8" />
      <path d="M-8 -6a8 7.500 0 0 1 16 0c-5 2-11 2-16 0z" fill={cap} />
      <circle cx="-3" cy="-9" r="1.300" fill="#fff" />
      <circle cx="2.500" cy="-10.500" r="1" fill="#fff" />
      <circle cx="4.500" cy="-7.500" r="0.900" fill="#fff" />
    </g>
  )
}

function CrystalCluster({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse className="w-glow" cx="0" cy="-9" rx="15" ry="13" fill="#bff4ff" opacity="0.3" />
      <path d="M-9 0l-4-9 4-7 4 5v11z" fill="#c9a6ff" />
      <path d="M-4 0v-17l5-7 5 8-1 16z" fill="#8fe3f2" />
      <path d="M5 0l1-11 4-4 3 6-2 9z" fill="#ffc2e0" />
      <path d="M1 -24l-3 7v17h3z" fill="#fff" opacity="0.4" />
      <path
        className="w-twinkle"
        d="M7 -22c.3 1.800 1.200 2.700 3 3-1.800.3-2.700 1.200-3 3-.3-1.800-1.200-2.700-3-3 1.800-.3 2.700-1.200 3-3z"
        fill="#fff"
      />
    </g>
  )
}

function Moss({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <ellipse cx="0" cy="0" rx="12" ry="3.500" />
      <circle cx="-6" cy="-2" r="3.500" />
      <circle cx="1" cy="-3.500" r="4.500" />
      <circle cx="7" cy="-1.500" r="3" />
    </g>
  )
}

/** A baby dragon looking out of the cave mouth, with its paws on the step. */
function PeekingDragon({ x, y }: { x: number; y: number }) {
  const edge = shade(MINT, 0.42)
  const belly = mix(MINT, '#ffffff', 0.6)
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* shoulders fading into the dark */}
      <path d="M-13 0v-9a13 12 0 0 1 26 0v9z" fill={shade(MINT, 0.22)} />
      <path d="M-7 0v-7a7 8 0 0 1 14 0v7z" fill={belly} opacity="0.85" />
      {/* horns and ear frills */}
      <path d="M-9 -31l-2-9 8 5zM9 -31l2-9-8 5z" fill="#fff3d6" stroke={edge} strokeWidth="1" strokeLinejoin="round" />
      <path d="M-13 -23l-7-3 4 8zM13 -23l7-3-4 8z" fill={PEACH} stroke={edge} strokeWidth="1" strokeLinejoin="round" />
      <circle cx="0" cy="-22" r="13.500" fill={MINT} stroke={edge} strokeWidth="1.300" />
      <path d="M-9 -29a11 11 0 0 1 9-5" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" opacity="0.5" />
      <circle cx="-3" cy="-33" r="1.300" fill={shade(MINT, 0.2)} />
      <circle cx="2.500" cy="-34" r="1" fill={shade(MINT, 0.2)} />
      <ellipse cx="0" cy="-17" rx="7" ry="5" fill={belly} />
      <ellipse cx="-9.500" cy="-18.500" rx="2.800" ry="1.800" fill={BLUSH} opacity="0.7" />
      <ellipse cx="9.500" cy="-18.500" rx="2.800" ry="1.800" fill={BLUSH} opacity="0.7" />
      <g className="w-blink">
        <circle cx="-5.500" cy="-24" r="2.800" fill={EYE} />
        <circle cx="5.500" cy="-24" r="2.800" fill={EYE} />
        <circle cx="-4.600" cy="-25" r="1" fill="#fff" />
        <circle cx="6.400" cy="-25" r="1" fill="#fff" />
      </g>
      <circle cx="-1.600" cy="-18.500" r="0.700" fill={edge} />
      <circle cx="1.600" cy="-18.500" r="0.700" fill={edge} />
      <path d="M-2.500 -15.500q2.500 2 5 0" fill="none" stroke={EYE} strokeWidth="1.100" strokeLinecap="round" />
      {/* paws on the doorstep */}
      <ellipse cx="-8" cy="-1.500" rx="4" ry="2.800" fill={MINT} stroke={edge} strokeWidth="1" />
      <ellipse cx="8" cy="-1.500" rx="4" ry="2.800" fill={MINT} stroke={edge} strokeWidth="1" />
    </g>
  )
}

/** A baby dragon asleep in a cushioned basket, breathing slowly. */
function SleepingDragon({ x, y, c }: { x: number; y: number; c: WorldColors }) {
  const edge = shade(PEACH, 0.42)
  const cushion = mix(c.accent, '#ffffff', 0.25)
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="1" rx="23" ry="4" fill="#000" opacity="0.14" />
      {/* basket bed with a cushion and pillow */}
      <path d="M-21 -8h42l-4 9h-34z" fill="#d9a25f" />
      <path d="M-19 -4h38M-18 0h36" stroke="#b07a45" strokeWidth="1.200" />
      <ellipse cx="0" cy="-8" rx="21" ry="5.500" fill={cushion} />
      <ellipse cx="-12" cy="-10" rx="8" ry="4" fill="#fff7e8" />
      {/* the dragon, curled up */}
      <g className="w-breathe">
        <path d="M9 -10c8 0 12-4 11-9 3 1 3 5 1 8 3 0 4 3 1 5-4 3-10 3-14 1z" fill={PEACH} stroke={edge} strokeWidth="1" strokeLinejoin="round" />
        <ellipse cx="2" cy="-13" rx="12" ry="8" fill={PEACH} stroke={edge} strokeWidth="1.200" />
        <path d="M-2 -20c2-6 7-7 11-5-2 3-5 5-9 6z" fill={mix(PEACH, '#ffffff', 0.45)} stroke={edge} strokeWidth="1" strokeLinejoin="round" />
        <circle cx="5" cy="-13" r="1.200" fill={shade(PEACH, 0.18)} />
        <circle cx="9" cy="-10.500" r="1" fill={shade(PEACH, 0.18)} />
      </g>
      <path d="M-15 -18l-1-6 5 3zM-7 -19l2-6 3 5z" fill="#fff3d6" stroke={edge} strokeWidth="0.900" strokeLinejoin="round" />
      <circle cx="-11" cy="-12" r="8" fill={PEACH} stroke={edge} strokeWidth="1.200" />
      <ellipse cx="-14" cy="-9.500" rx="4.500" ry="3.200" fill={mix(PEACH, '#ffffff', 0.55)} />
      <path d="M-15.500 -13.500q1.800 1.800 3.600 0M-9 -13.500q1.800 1.800 3.600 0" fill="none" stroke={EYE} strokeWidth="1.200" strokeLinecap="round" />
      <ellipse cx="-7.500" cy="-10.500" rx="2" ry="1.300" fill={BLUSH} opacity="0.75" />
      {/* a blanket tucked over */}
      <path d="M-2 -9c5-4 14-5 21-2l-2 6c-6 2-14 2-20 0z" fill={c.trim} stroke={shade(c.trim, 0.3)} strokeWidth="0.900" strokeLinejoin="round" />
      <circle cx="5" cy="-7" r="1.100" fill="#fff" />
      <circle cx="11" cy="-8" r="1.100" fill="#fff" />
      <circle cx="16" cy="-6.500" r="1.100" fill="#fff" />
    </g>
  )
}

// ---- The two layers -----------------------------------------------------------------

/** Behind the building: tall rocks either side, a play rug and soft moss. */
export function NurseryGround({ c }: { c: WorldColors }) {
  const rock = mix(c.hillNear, c.wallShade, 0.55)
  const rockDark = shade(rock, 0.16)
  const moss = mix(c.foliage, '#7fd6b0', 0.4)
  return (
    <g>
      {/* rock pillars that frame the cave */}
      {[
        { x: 78, flip: 1 },
        { x: 244, flip: -1 },
      ].map(({ x, flip }) => (
        <g key={x} transform={`translate(${x} 172) scale(${flip} 1)`}>
          <path d="M-13 0c-3-22-1-44 5-58 3-6 9-6 11 0 5 14 8 36 6 58z" fill={rock} />
          <path d="M1 -60c5 14 8 38 6 60h4c2-22-1-44-6-58-1-2-2-3-4-2z" fill={rockDark} />
          <path d="M-9 -30h7M-10 -14h9M-6 -44h6" stroke={rockDark} strokeWidth="1.200" strokeLinecap="round" />
          <path d="M-9 -54c2-5 8-7 12-3 2 2 3 5 2 7-4-2-10-1-14-4z" fill={moss} />
          <g transform="translate(-2 -60) scale(0.550)">
            <path d="M-4 0v-15l4-6 5 7-1 14z" fill="#8fe3f2" />
            <path d="M0 -21l-2 6v15h2z" fill="#fff" opacity="0.4" />
          </g>
        </g>
      ))}
      {/* the play rug */}
      <ellipse cx="258" cy="197" rx="36" ry="8.500" fill={mix(c.accent, '#ffffff', 0.35)} />
      <ellipse cx="258" cy="197" rx="29" ry="6" fill="none" stroke="#fff" strokeWidth="1.600" strokeDasharray="3 4" opacity="0.9" />
      <ellipse cx="258" cy="197" rx="20" ry="3.800" fill={mix(c.trim, '#ffffff', 0.3)} opacity="0.85" />
      {/* moss and worn stone on the ground */}
      <Moss x={112} y={181} fill={moss} s={0.800} />
      <Moss x={214} y={180} fill={moss} s={0.700} />
      <g fill={c.groundShade} opacity="0.6">
        <ellipse cx="122" cy="207" rx="9" ry="2.200" />
        <ellipse cx="190" cy="186" rx="6" ry="1.600" />
        <ellipse cx="206" cy="207" rx="7" ry="1.800" />
        <ellipse cx="46" cy="198" rx="5" ry="1.400" />
      </g>
    </g>
  )
}

/** In front: the dragons and the things that make it a nursery. */
export function NurseryDetails({ c }: { c: WorldColors }) {
  return (
    <>
      {/* looking out of the cave mouth (the cave's own eyes sit behind) */}
      <PeekingDragon x={160} y={173} />

      {/* a decorated egg keeping warm on a cushion by the door */}
      <g transform="translate(187 184)">
        <ellipse cx="0" cy="0" rx="9" ry="3" fill={mix(c.accent, '#ffffff', 0.2)} />
        <g className="w-wobble">
          <ellipse cx="0" cy="-8" rx="5.500" ry="7.500" fill="#fff7e0" />
          <path d="M-5.200 -9.500l2.600 2 2.600-2 2.600 2 2.600-2" fill="none" stroke={c.roof} strokeWidth="1.400" strokeLinejoin="round" />
          <circle cx="-2" cy="-4.500" r="1" fill="#8fe3f2" />
          <circle cx="2.200" cy="-12" r="1" fill={c.accent} />
        </g>
      </g>

      {/* nap corner */}
      <SleepingDragon x={110} y={201} c={c} />
      <g fill="none" stroke="#fff" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${96 - i * 7} ${178 - i * 9}) scale(${0.600 + i * 0.220})`}>
            <path className="w-rise" style={{ animationDelay: `${i * 1.300}s` }} d="M0 0h6l-6 7h6" />
          </g>
        ))}
      </g>

      {/* play corner: a ball and a rattle on the rug */}
      <g transform="translate(232 200)">
        <circle cx="0" cy="-5" r="5" fill="#8fe3f2" />
        <path d="M-5 -5a5 5 0 0 1 10 0z" fill="#fff" opacity="0.6" />
        <circle cx="0" cy="-5" r="1.600" fill={c.trim} />
      </g>
      <g transform="translate(288 199) rotate(24)">
        <rect x="-1.300" y="-9" width="2.600" height="10" rx="1.300" fill="#fff7e8" />
        <circle cx="0" cy="-12" r="4.500" fill={c.accent} />
        <circle cx="0" cy="-12" r="1.600" fill="#fff" />
      </g>

      {/* glowing things */}
      <Mushroom x={198} y={201} cap="#ff9ec4" />
      <Mushroom x={207} y={203} s={0.700} cap="#c9a6ff" />
      <Mushroom x={66} y={206} s={0.750} cap="#ff9ec4" />
      <CrystalCluster x={146} y={207} s={0.600} />
      <ellipse className="w-glow" cx="160" cy="176" rx="20" ry="4" fill={GLOW} opacity="0.5" />
    </>
  )
}
