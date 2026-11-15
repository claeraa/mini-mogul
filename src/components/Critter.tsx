import type { CustomerCastId } from '../world/customers.ts'
import { mix, shade } from '../world/color.ts'

/**
 * The little customers. Each cast (fairy folk, dragon families, pet owners,
 * shoppers, bear bakers and so on) is put together from one set of parts:
 * ears or hair, a hat, wings, something to carry. A new cast only needs a
 * new line in CAST. Every character carries three faces: waiting, delighted
 * and disappointed; the street's styles choose which shows.
 */

type Ears = 'round' | 'pointy' | 'floppy' | 'long' | 'horns' | 'elf' | 'none'
type Topper = 'chef' | 'leaf' | 'bow' | 'sunhat' | 'crown' | 'cap' | 'none'
type Hair = 'tuft' | 'bob' | 'bun' | 'pigtails'
type Held = 'bag' | 'pet' | 'teddy'

type Species = {
  ears: Ears
  topper: Topper
  /** Fur, scales or skin. */
  coats: string[]
  /** People and fairies have hair and clothes instead of fur. */
  hair?: Hair
  hairs?: string[]
  outfits?: string[]
  wings?: 'fairy' | 'dragon'
  held?: Held
  glasses?: boolean
  /** A little one: a baby dragon beside its parent. */
  small?: boolean
}

const BEAR = ['#e9b98a', '#f6dcb4', '#c99872', '#ffd3c2']
const PET = ['#f2c38a', '#fff1dc', '#b98f6c', '#d8d2cd', '#ffd9a8']
const PASTEL = ['#ffc9d6', '#c9d4ff', '#c8efd4', '#ffe3a6']
const SCALES = ['#9fe0c0', '#c3b2f0', '#ffb89a', '#9ad8f2']
const SKIN = ['#f8d9bd', '#eec39a', '#d39a6e', '#a8734f', '#fbe3cf']
const HAIR = ['#5a3a2a', '#2f2622', '#c9853b', '#e8c15a', '#8a4b2a']
const CLOTHES = ['#6fb7e8', '#ff9ec4', '#8fd6a0', '#ffd066', '#b79cf0', '#ff9a76']
const FAIRY_SKIN = ['#fbe3cf', '#f8d9bd', '#eec39a', '#ecdcff']
const FAIRY_HAIR = ['#ff9ec4', '#b79cf0', '#7fd3c0', '#ffd66b']
const PETALS = ['#ff9ec4', '#c3a6f5', '#8fdcc0', '#ffd978']

const person = (hair: Hair, extra: Partial<Species> = {}): Species => ({
  ears: 'none',
  topper: 'none',
  coats: SKIN,
  hair,
  hairs: HAIR,
  outfits: CLOTHES,
  ...extra,
})

const fairy = (hair: Hair, extra: Partial<Species> = {}): Species => ({
  ears: 'elf',
  topper: 'crown',
  coats: FAIRY_SKIN,
  hair,
  hairs: FAIRY_HAIR,
  outfits: PETALS,
  wings: 'fairy',
  ...extra,
})

const CAST: Record<CustomerCastId, Species[]> = {
  fairies: [fairy('bob'), fairy('bun', { topper: 'none' }), fairy('pigtails'), fairy('tuft', { topper: 'none' })],
  dragons: [
    { ears: 'horns', topper: 'none', coats: SCALES, wings: 'dragon' },
    { ears: 'horns', topper: 'none', coats: SCALES, small: true },
  ],
  'pet-owners': [
    person('tuft', { held: 'pet' }),
    person('bob', { held: 'pet' }),
    person('bun', { held: 'pet' }),
    person('pigtails', { held: 'pet' }),
  ],
  shoppers: [
    person('bob', { topper: 'sunhat', held: 'bag' }),
    person('tuft', { held: 'bag' }),
    person('bun', { topper: 'bow', held: 'bag' }),
    person('pigtails', { topper: 'sunhat' }),
  ],
  kids: [
    person('tuft', { topper: 'cap', held: 'teddy' }),
    person('pigtails', { topper: 'bow' }),
    person('bob', { held: 'teddy' }),
    person('tuft'),
  ],
  bakers: [
    { ears: 'round', topper: 'chef', coats: BEAR },
    { ears: 'round', topper: 'none', coats: BEAR },
    { ears: 'long', topper: 'none', coats: ['#fff1dc', '#f6dcb4'] },
  ],
  gardeners: [
    { ears: 'long', topper: 'leaf', coats: ['#fff1dc', '#f6dcb4', '#d8d2cd'] },
    { ears: 'round', topper: 'leaf', coats: BEAR },
  ],
  crafters: [
    { ears: 'pointy', topper: 'bow', coats: PASTEL },
    { ears: 'round', topper: 'none', coats: PASTEL },
  ],
  readers: [
    { ears: 'pointy', topper: 'none', coats: ['#c9b08f', '#e6d3b8', '#b7a0c9'], glasses: true },
    { ears: 'round', topper: 'bow', coats: BEAR },
    person('bob', { glasses: true }),
  ],
  villagers: [
    { ears: 'round', topper: 'none', coats: BEAR },
    { ears: 'long', topper: 'none', coats: ['#fff1dc', '#f6dcb4'] },
    { ears: 'pointy', topper: 'none', coats: PASTEL },
  ],
  neighbours: [person('tuft'), person('bob'), person('bun'), person('pigtails', { topper: 'bow' })],
}

const EYE = '#3b2a2a'
const BLUSH = '#ff9aa8'

function EarArt({ ears, coat, edge }: { ears: Ears; coat: string; edge: string }) {
  const inner = mix(coat, BLUSH, 0.55)
  const line = { stroke: edge, strokeWidth: 1.500, strokeLinejoin: 'round' as const }
  switch (ears) {
    case 'round':
      return (
        <>
          <circle cx="11" cy="10" r="6" fill={coat} {...line} />
          <circle cx="37" cy="10" r="6" fill={coat} {...line} />
          <circle cx="11" cy="10.500" r="2.800" fill={inner} />
          <circle cx="37" cy="10.500" r="2.800" fill={inner} />
        </>
      )
    case 'pointy':
      return (
        <>
          <path d="M8 17L10 2l11 8z" fill={coat} {...line} />
          <path d="M40 17L38 2 27 10z" fill={coat} {...line} />
          <path d="M11 13l1-6 5 4z" fill={inner} />
          <path d="M37 13l-1-6-5 4z" fill={inner} />
        </>
      )
    case 'long':
      return (
        <>
          <ellipse cx="17" cy="6" rx="4.500" ry="10" fill={coat} {...line} transform="rotate(-8 17 6)" />
          <ellipse cx="31" cy="6" rx="4.500" ry="10" fill={coat} {...line} transform="rotate(8 31 6)" />
          <ellipse cx="17" cy="7" rx="2" ry="6.500" fill={inner} transform="rotate(-8 17 7)" />
          <ellipse cx="31" cy="7" rx="2" ry="6.500" fill={inner} transform="rotate(8 31 7)" />
        </>
      )
    case 'horns':
      return (
        <>
          <path d="M12 13l1-10 7 6z" fill="#fff3d6" {...line} />
          <path d="M36 13l-1-10-7 6z" fill="#fff3d6" {...line} />
          <path d="M40 41l7-3-3 8z" fill={coat} {...line} />
        </>
      )
    case 'elf':
      return (
        <>
          <path d="M10 24L0 16l11-1z" fill={coat} {...line} />
          <path d="M38 24l10-8-11-1z" fill={coat} {...line} />
        </>
      )
    case 'floppy':
      // Drawn in front of the head; see FloppyEars.
      return null
    case 'none':
      return null
  }
}

/** The part of the hair that sits behind the head. */
function HairBack({ hair, fill, edge }: { hair: Hair; fill: string; edge: string }) {
  const line = { stroke: edge, strokeWidth: 1.500 }
  switch (hair) {
    case 'bob':
      return (
        <>
          <ellipse cx="9.500" cy="25" rx="5.500" ry="10" fill={fill} {...line} />
          <ellipse cx="38.500" cy="25" rx="5.500" ry="10" fill={fill} {...line} />
        </>
      )
    case 'bun':
      return <circle cx="24" cy="4.500" r="5.500" fill={fill} {...line} />
    case 'pigtails':
      return (
        <>
          <circle cx="6.500" cy="25" r="5.500" fill={fill} {...line} />
          <circle cx="41.500" cy="25" r="5.500" fill={fill} {...line} />
        </>
      )
    case 'tuft':
      return <path d="M21 6l3-5.500 3 5.500z" fill={fill} {...line} strokeLinejoin="round" />
  }
}

/** The fringe, drawn over the top of the head. */
function HairFront({ fill, edge }: { fill: string; edge: string }) {
  return (
    <path
      d="M8 20.500a16 16 0 0 1 32 0c-2.500-3-5.500-4.800-8.500-5.300-3.500 2.300-10 3.200-14.500 1.300-3.500.6-6.800 1.800-9 4z"
      fill={fill}
      stroke={edge}
      strokeWidth="1.500"
      strokeLinejoin="round"
    />
  )
}

function Wings({ kind, coat, edge }: { kind: 'fairy' | 'dragon'; coat: string; edge: string }) {
  if (kind === 'dragon') {
    const fill = shade(coat, 0.16)
    return (
      <g fill={fill} stroke={edge} strokeWidth="1.500" strokeLinejoin="round">
        <path d="M12 33L1 24l3 7-4 1 5 3.500-3 3.500 10-1.500z" />
        <path d="M36 33l11-9-3 7 4 1-5 3.500 3 3.500-10-1.500z" />
      </g>
    )
  }
  return (
    <g className="critter__wings" fill="#e3f6ff" stroke="#7fb9e0" strokeWidth="1.200" opacity="0.92">
      <ellipse cx="8.500" cy="30" rx="7.500" ry="11" transform="rotate(-24 8.500 30)" />
      <ellipse cx="39.500" cy="30" rx="7.500" ry="11" transform="rotate(24 39.500 30)" />
      <ellipse cx="9.500" cy="43" rx="5.500" ry="6.500" transform="rotate(20 9.500 43)" fill="#f3e6ff" />
      <ellipse cx="38.500" cy="43" rx="5.500" ry="6.500" transform="rotate(-20 38.500 43)" fill="#f3e6ff" />
    </g>
  )
}

/** Something carried at the character's side. */
function HeldArt({ held, index }: { held: Held; index: number }) {
  switch (held) {
    case 'bag':
      return (
        <g stroke="#c9588a" strokeWidth="1.200" strokeLinejoin="round">
          <path d="M35.500 41c0-5.500 6-5.500 6 0" fill="none" />
          <rect x="33" y="41" width="11" height="11" rx="1.800" fill="#ff9ec4" />
          <circle cx="38.500" cy="46.500" r="1.800" fill="#fff" stroke="none" />
        </g>
      )
    case 'teddy':
      return (
        <g stroke="#8f5f38" strokeWidth="1">
          <circle cx="35" cy="40.500" r="2.300" fill="#c98f5a" />
          <circle cx="42" cy="40.500" r="2.300" fill="#c98f5a" />
          <ellipse cx="38.500" cy="50" rx="4.500" ry="3.500" fill="#c98f5a" />
          <circle cx="38.500" cy="44.500" r="5" fill="#d9a56e" />
          <circle cx="36.800" cy="43.800" r="0.800" fill={EYE} stroke="none" />
          <circle cx="40.200" cy="43.800" r="0.800" fill={EYE} stroke="none" />
          <ellipse cx="38.500" cy="46.200" rx="1.600" ry="1.200" fill="#f1d2a6" stroke="none" />
        </g>
      )
    case 'pet': {
      // Puppies and kittens take turns down the queue.
      const coat = PET[index % PET.length]
      const edge = shade(coat, 0.4)
      const kitten = index % 2 === 1
      return (
        <g stroke={edge} strokeWidth="1.100" strokeLinejoin="round">
          <ellipse cx="38.500" cy="51" rx="5" ry="3.200" fill={coat} />
          {kitten && <path d="M33.500 42l1-5 4 3zM43.500 42l-1-5-4 3z" fill={coat} />}
          <circle cx="38.500" cy="44.500" r="5.500" fill={coat} />
          {!kitten && (
            <>
              <ellipse cx="33.300" cy="44.500" rx="2" ry="4" fill={shade(coat, 0.22)} />
              <ellipse cx="43.700" cy="44.500" rx="2" ry="4" fill={shade(coat, 0.22)} />
            </>
          )}
          <circle cx="36.600" cy="44" r="0.900" fill={EYE} stroke="none" />
          <circle cx="40.400" cy="44" r="0.900" fill={EYE} stroke="none" />
          <path d="M37.700 46h1.600l-.8 1z" fill={EYE} stroke="none" />
        </g>
      )
    }
  }
}

function FloppyEars({ coat, edge }: { coat: string; edge: string }) {
  const fill = shade(coat, 0.2)
  return (
    <>
      <ellipse cx="9" cy="23" rx="5" ry="10" fill={fill} stroke={edge} strokeWidth="1.500" transform="rotate(12 9 23)" />
      <ellipse cx="39" cy="23" rx="5" ry="10" fill={fill} stroke={edge} strokeWidth="1.500" transform="rotate(-12 39 23)" />
    </>
  )
}

function TopperArt({ topper }: { topper: Topper }) {
  switch (topper) {
    case 'chef':
      return (
        <g stroke="#cfc4b8" strokeWidth="1.200">
          <circle cx="18" cy="5" r="5" fill="#fff" />
          <circle cx="30" cy="5" r="5" fill="#fff" />
          <circle cx="24" cy="3" r="5.500" fill="#fff" />
          <rect x="16" y="6" width="16" height="6" rx="2" fill="#fff" />
        </g>
      )
    case 'leaf':
      return (
        <g stroke="#3f8f52" strokeWidth="1">
          <path d="M24 9c-7-1-9-6-8-9 5 1 8 4 8 9z" fill="#7ccf86" />
          <path d="M24 9c7-1 9-6 8-9-5 1-8 4-8 9z" fill="#58b96b" />
        </g>
      )
    case 'bow':
      return (
        <g fill="#ff8fb8" stroke="#c9588a" strokeWidth="1">
          <path d="M33 9l-6-4v8zM33 9l6-4v8z" />
          <circle cx="33" cy="9" r="2.200" />
        </g>
      )
    case 'sunhat':
      return (
        <g stroke="#d39a34" strokeWidth="1.200" strokeLinejoin="round">
          <ellipse cx="24" cy="10" rx="17" ry="4" fill="#ffe9a8" />
          <path d="M14 10c0-9 20-9 20 0z" fill="#fff3c9" />
          <path d="M14.500 9h19" stroke="#ff8fb8" strokeWidth="2.400" />
        </g>
      )
    case 'crown':
      return (
        <g stroke="#c9588a" strokeWidth="0.800">
          {[
            [12.500, 11, '#ff9ec4'],
            [18, 7.500, '#fff3a0'],
            [24, 6, '#ffffff'],
            [30, 7.500, '#fff3a0'],
            [35.500, 11, '#ff9ec4'],
          ].map(([x, y, fill]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="2.800" fill={fill as string} />
              <circle cx={x} cy={y} r="0.900" fill="#ffb347" stroke="none" />
            </g>
          ))}
        </g>
      )
    case 'cap':
      return (
        <g stroke="#2f6fb0" strokeWidth="1.200" strokeLinejoin="round">
          <path d="M9 15.500a15 15 0 0 1 30 0z" fill="#5aa7ea" />
          <path d="M28 14.500c5-1 11 0 14 2.500-4.500 1-9.500.800-14-.5z" fill="#3f8ad6" />
          <circle cx="24" cy="1.800" r="1.800" fill="#ffd066" stroke="#d39a34" />
        </g>
      )
    case 'none':
      return null
  }
}

export function Critter({ cast: castId, index }: { cast: CustomerCastId; index: number }) {
  const cast = CAST[castId] ?? CAST.neighbours
  const species = cast[index % cast.length]
  // Step through the coats at a different pace from the species, so the
  // same pairing does not repeat down the queue.
  const coat = species.coats[Math.floor(index / cast.length + index) % species.coats.length]
  const edge = shade(coat, 0.4)
  const belly = mix(coat, '#ffffff', 0.55)
  // Animals have a snout; people, fairies and dragons do not.
  const snout = ['round', 'pointy', 'floppy', 'long'].includes(species.ears)
  // People and fairies wear clothes and have hair.
  const outfit = species.outfits
    ? species.outfits[(index + Math.floor(index / 2)) % species.outfits.length]
    : null
  const hairFill = species.hairs ? species.hairs[(index * 2 + 1) % species.hairs.length] : null
  const hairEdge = hairFill ? shade(hairFill, 0.35) : edge
  const body = outfit ?? coat
  const bodyEdge = outfit ? shade(outfit, 0.38) : edge

  return (
    <svg className="critter" viewBox="0 0 48 56" aria-hidden="true">
      <ellipse cx="24" cy="53" rx={species.small ? 9 : 13} ry="2.600" fill="#000" opacity="0.14" />
      <g transform={species.small ? 'translate(24 54) scale(0.72) translate(-24 -54)' : undefined}>
      {species.wings && <Wings kind={species.wings} coat={coat} edge={edge} />}
      <EarArt ears={species.ears} coat={coat} edge={edge} />
      {species.hair && hairFill && <HairBack hair={species.hair} fill={hairFill} edge={hairEdge} />}
      {/* feet, body, head */}
      <ellipse cx="17" cy="51" rx="5" ry="3" fill={shade(body, 0.18)} stroke={bodyEdge} strokeWidth="1.500" />
      <ellipse cx="31" cy="51" rx="5" ry="3" fill={shade(body, 0.18)} stroke={bodyEdge} strokeWidth="1.500" />
      <rect x="11" y="28" width="26" height="23" rx="11" fill={body} stroke={bodyEdge} strokeWidth="1.500" />
      {outfit ? (
        <path d="M18.500 36.500q5.500 4 11 0" fill="none" stroke="#fff" strokeWidth="1.800" strokeLinecap="round" opacity="0.7" />
      ) : (
        <ellipse cx="24" cy="42" rx="7.500" ry="7" fill={belly} />
      )}
      <circle cx="24" cy="22" r="16" fill={coat} stroke={edge} strokeWidth="1.500" />
      {hairFill ? (
        <HairFront fill={hairFill} edge={hairEdge} />
      ) : (
        <path d="M12 16a14 14 0 0 1 12-9" fill="none" stroke="#fff" strokeWidth="2.500" strokeLinecap="round" opacity="0.45" />
      )}
      {species.ears === 'floppy' && <FloppyEars coat={coat} edge={edge} />}
      {species.ears === 'horns' && (
        <g fill={shade(coat, 0.22)}>
          <circle cx="24" cy="9" r="2" />
          <circle cx="19" cy="11" r="1.500" />
          <circle cx="29" cy="11" r="1.500" />
        </g>
      )}
      <TopperArt topper={species.topper} />
      <ellipse cx="12.500" cy="27" rx="3.500" ry="2.200" fill={BLUSH} opacity="0.65" />
      <ellipse cx="35.500" cy="27" rx="3.500" ry="2.200" fill={BLUSH} opacity="0.65" />
      {snout && <ellipse cx="24" cy="26" rx="5" ry="3.800" fill={belly} />}

      {/* waiting */}
      <g className="critter__face critter__face--idle">
        <g className="critter__eyes">
          <circle cx="17" cy="21.500" r="2.500" fill={EYE} />
          <circle cx="31" cy="21.500" r="2.500" fill={EYE} />
          <circle cx="17.900" cy="20.600" r="0.900" fill="#fff" />
          <circle cx="31.900" cy="20.600" r="0.900" fill="#fff" />
        </g>
        {snout && <path d="M22.500 24.500h3l-1.500 1.800z" fill={EYE} />}
        <path d="M21 27.500q3 2.400 6 0" fill="none" stroke={EYE} strokeWidth="1.400" strokeLinecap="round" />
      </g>
      {/* delighted */}
      <g className="critter__face critter__face--happy">
        <path d="M14 22.500q3-4.500 6 0M28 22.500q3-4.500 6 0" fill="none" stroke={EYE} strokeWidth="1.800" strokeLinecap="round" />
        {snout && <path d="M22.500 24.500h3l-1.500 1.800z" fill={EYE} />}
        <path d="M20 26.800h8a4 4.600 0 0 1-8 0z" fill="#c2475a" stroke={EYE} strokeWidth="1" strokeLinejoin="round" />
        <path d="M22 30.200a2.400 1.600 0 0 1 4 0z" fill="#ff9aa8" />
      </g>
      {/* disappointed */}
      <g className="critter__face critter__face--sad">
        <circle cx="17" cy="22.500" r="2.300" fill={EYE} />
        <circle cx="31" cy="22.500" r="2.300" fill={EYE} />
        <path d="M13.500 18.500l6 1.800M34.500 18.500l-6 1.800" stroke={EYE} strokeWidth="1.400" strokeLinecap="round" />
        {snout && <path d="M22.500 24.500h3l-1.500 1.800z" fill={EYE} />}
        <path d="M21 30q3-2.600 6 0" fill="none" stroke={EYE} strokeWidth="1.400" strokeLinecap="round" />
        <path d="M35 24c1.500 2 1.500 3.500 0 4-1.500-.5-1.500-2 0-4z" fill="#8fd6f2" />
      </g>
      {species.glasses && (
        <g fill="none" stroke="#5a4a6a" strokeWidth="1.200">
          <circle cx="17" cy="21.800" r="4.300" />
          <circle cx="31" cy="21.800" r="4.300" />
          <path d="M21.300 21.500h5.400" />
        </g>
      )}
      {species.held && <HeldArt held={species.held} index={index} />}
      </g>
    </svg>
  )
}
