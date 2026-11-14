import type { WorldThemeId } from '../world/blueprint.ts'
import { mix, shade } from '../world/color.ts'

/**
 * The little customers. Each world has its own cast (bear bakers, puppies
 * and kittens, baby dragons, bunnies), drawn from one set of parts so a new
 * world only needs a new line in CAST. Every critter carries three faces:
 * waiting, delighted and disappointed; the street's styles choose which shows.
 */

type Ears = 'round' | 'pointy' | 'floppy' | 'long' | 'horns'
type Topper = 'chef' | 'leaf' | 'bow' | 'none'

type Species = { ears: Ears; topper: Topper; coats: string[] }

const BEAR = ['#e9b98a', '#f6dcb4', '#c99872', '#ffd3c2']
const PET = ['#f2c38a', '#fff1dc', '#b98f6c', '#d8d2cd', '#ffd9a8']
const PASTEL = ['#ffc9d6', '#c9d4ff', '#c8efd4', '#ffe3a6']

const CAST: Record<WorldThemeId, Species[]> = {
  bakery: [
    { ears: 'round', topper: 'chef', coats: BEAR },
    { ears: 'round', topper: 'none', coats: BEAR },
    { ears: 'long', topper: 'none', coats: ['#fff1dc', '#f6dcb4'] },
  ],
  'pet-care': [
    { ears: 'floppy', topper: 'none', coats: PET },
    { ears: 'pointy', topper: 'none', coats: PET },
    { ears: 'long', topper: 'bow', coats: ['#fff1dc', '#d8d2cd'] },
  ],
  'creature-care': [{ ears: 'horns', topper: 'none', coats: ['#9fe0c0', '#c3b2f0', '#ffb89a', '#9ad8f2'] }],
  'drink-stand': [
    { ears: 'round', topper: 'none', coats: BEAR },
    { ears: 'pointy', topper: 'none', coats: PET },
  ],
  garden: [
    { ears: 'long', topper: 'leaf', coats: ['#fff1dc', '#f6dcb4', '#d8d2cd'] },
    { ears: 'round', topper: 'leaf', coats: BEAR },
  ],
  'craft-studio': [
    { ears: 'pointy', topper: 'bow', coats: PASTEL },
    { ears: 'round', topper: 'none', coats: PASTEL },
  ],
  'book-nook': [
    { ears: 'pointy', topper: 'none', coats: ['#c9b08f', '#e6d3b8', '#b7a0c9'] },
    { ears: 'round', topper: 'bow', coats: BEAR },
  ],
  'general-store': [
    { ears: 'round', topper: 'none', coats: BEAR },
    { ears: 'floppy', topper: 'none', coats: PET },
    { ears: 'pointy', topper: 'none', coats: PASTEL },
  ],
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
    case 'floppy':
      // Drawn in front of the head; see FloppyEars.
      return null
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
    case 'none':
      return null
  }
}

export function Critter({ theme, index }: { theme: WorldThemeId; index: number }) {
  const cast = CAST[theme] ?? CAST['general-store']
  const species = cast[index % cast.length]
  // Step through the coats at a different pace from the species, so the
  // same pairing does not repeat down the queue.
  const coat = species.coats[Math.floor(index / cast.length + index) % species.coats.length]
  const edge = shade(coat, 0.4)
  const belly = mix(coat, '#ffffff', 0.55)
  const snout = species.ears !== 'horns'

  return (
    <svg className="critter" viewBox="0 0 48 56" aria-hidden="true">
      <ellipse cx="24" cy="53" rx="13" ry="2.600" fill="#000" opacity="0.14" />
      <EarArt ears={species.ears} coat={coat} edge={edge} />
      {/* feet, body, head */}
      <ellipse cx="17" cy="51" rx="5" ry="3" fill={shade(coat, 0.18)} stroke={edge} strokeWidth="1.500" />
      <ellipse cx="31" cy="51" rx="5" ry="3" fill={shade(coat, 0.18)} stroke={edge} strokeWidth="1.500" />
      <rect x="11" y="28" width="26" height="23" rx="11" fill={coat} stroke={edge} strokeWidth="1.500" />
      <ellipse cx="24" cy="42" rx="7.500" ry="7" fill={belly} />
      <circle cx="24" cy="22" r="16" fill={coat} stroke={edge} strokeWidth="1.500" />
      <path d="M12 16a14 14 0 0 1 12-9" fill="none" stroke="#fff" strokeWidth="2.500" strokeLinecap="round" opacity="0.45" />
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
    </svg>
  )
}
