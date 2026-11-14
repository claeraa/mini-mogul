import type { JSX } from 'react'
import type {
  ProductIconId,
  PropId,
  StructureType,
  WorldColors,
} from '../world/blueprint.ts'

/**
 * Original SVG artwork for the themed worlds: product glyphs, buildings and
 * props. Each piece is drawn around its own origin so a scene can place it
 * anywhere. Buildings and props stand on (0, 0) at their bottom centre.
 */

const WOOD = '#d9a25f'
const WOOD_DARK = '#b07a45'
const GLASS = '#cfeffb'
const LEAF = '#58b96b'

// ---- Product glyphs (24 × 24) -------------------------------------------------

function GlyphArt({ icon }: { icon: ProductIconId }) {
  switch (icon) {
    case 'cupcake':
      return (
        <>
          <path d="M6.500 13h11l-1.600 8.500H8.100z" fill="#f2a93b" />
          <path d="M9.300 13.500l.7 7.500M12 13.500V21M14.700 13.500l-.7 7.500" stroke="#d98a1f" strokeWidth="1" />
          <path d="M5 13.200c-.8-3 1.200-4.600 3-4.400C8.300 6.300 10 5 12 5s3.700 1.300 4 3.800c1.800-.2 3.800 1.400 3 4.400z" fill="#ffc2d1" />
          <circle cx="12" cy="4" r="2.200" fill="#f0546a" />
        </>
      )
    case 'egg':
      return (
        <>
          <path d="M12 2.500c4 0 7 6.200 7 11a7 7 0 0 1-14 0c0-4.800 3-11 7-11z" fill="#fff7e0" stroke="#e7cfa0" strokeWidth="1" />
          <circle cx="9.500" cy="11" r="1.600" fill="#ff9a6b" />
          <circle cx="14.500" cy="15" r="2" fill="#8f7ff0" />
          <circle cx="13" cy="8" r="1.200" fill="#5cc8a8" />
        </>
      )
    case 'paw':
      return (
        <g fill="#8a5a48">
          <path d="M12 11.500c3.300 0 6 3 6 5.800 0 2-1.700 2.900-3.300 2.900-1.100 0-1.800-.5-2.700-.5s-1.600.5-2.700.5C7.700 20.200 6 19.300 6 17.300c0-2.800 2.700-5.800 6-5.800z" />
          <ellipse cx="5.500" cy="10.500" rx="2" ry="2.600" />
          <ellipse cx="9.500" cy="6.300" rx="2" ry="2.700" />
          <ellipse cx="14.500" cy="6.300" rx="2" ry="2.700" />
          <ellipse cx="18.500" cy="10.500" rx="2" ry="2.600" />
        </g>
      )
    case 'drink':
      return (
        <>
          <path d="M15 2l-2.500 8" stroke="#f0546a" strokeWidth="1.800" strokeLinecap="round" />
          <path d="M6 8.500h12l-1.500 12.500a1 1 0 0 1-1 .9h-7a1 1 0 0 1-1-.9z" fill="#fffbe0" stroke="#e9c94a" strokeWidth="1" />
          <path d="M6.900 12h10.200l-1.100 8.900H8z" fill="#ffd94a" />
          <circle cx="17.500" cy="8" r="3.200" fill="#ffe873" stroke="#e9b82a" strokeWidth="1" />
        </>
      )
    case 'flower':
      return (
        <>
          <path d="M12 13v9" stroke={LEAF} strokeWidth="2" strokeLinecap="round" />
          <path d="M12 18c-3 .5-4.500-1-5-3 2.500 0 4.200 1 5 3z" fill={LEAF} />
          <g fill="#ff8fb8">
            <circle cx="12" cy="4.500" r="3" />
            <circle cx="7.500" cy="8" r="3" />
            <circle cx="16.500" cy="8" r="3" />
            <circle cx="9.200" cy="12.500" r="3" />
            <circle cx="14.800" cy="12.500" r="3" />
          </g>
          <circle cx="12" cy="9" r="2.600" fill="#ffd94a" />
        </>
      )
    case 'palette':
      return (
        <>
          <path d="M12 3c5.500 0 9.500 3.600 9.500 8 0 3-2.400 4.200-4.600 3.800-1.600-.3-2.700.6-2.300 2.200.5 2-.9 4-3.300 4C6.200 21 2.500 17 2.500 12S6.500 3 12 3z" fill="#f6dcb4" stroke="#d9a25f" strokeWidth="1" />
          <circle cx="8" cy="8.500" r="1.800" fill="#f0546a" />
          <circle cx="13" cy="6.800" r="1.800" fill="#ffd94a" />
          <circle cx="17" cy="10" r="1.800" fill="#36bccb" />
          <circle cx="6.500" cy="13.500" r="1.800" fill="#8f7ff0" />
        </>
      )
    case 'book':
      return (
        <>
          <path d="M3 5.500c3-1.200 6-1.200 9 .5v14c-3-1.700-6-1.700-9-.5z" fill="#8f7ff0" />
          <path d="M21 5.500c-3-1.200-6-1.200-9 .5v14c3-1.700 6-1.700 9-.5z" fill="#a99cf5" />
          <path d="M5.500 9c1.500-.4 3-.3 4.300.2M5.500 12.500c1.500-.4 3-.3 4.300.2M14.200 9.200c1.300-.5 2.800-.6 4.300-.2M14.200 12.700c1.300-.5 2.800-.6 4.300-.2" stroke="#fff" strokeWidth="1.100" strokeLinecap="round" />
        </>
      )
    case 'gift':
      return (
        <>
          <rect x="4" y="10" width="16" height="11" rx="1.500" fill="#36bccb" />
          <rect x="3" y="6.500" width="18" height="4.500" rx="1.500" fill="#5fd0dc" />
          <path d="M12 6.500V21" stroke="#ffd94a" strokeWidth="2.600" />
          <path d="M12 6.500c-3-4.500-7-2-4 0zM12 6.500c3-4.500 7-2 4 0z" fill="#ffd94a" />
        </>
      )
  }
}

/** A product glyph centred on (x, y) inside another SVG. */
export function Glyph({
  icon,
  x,
  y,
  size,
}: {
  icon: ProductIconId
  x: number
  y: number
  size: number
}) {
  const scale = size / 24
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}>
      <GlyphArt icon={icon} />
    </g>
  )
}

/** A product glyph as a stand-alone icon for HTML layouts. */
export function ProductIcon({ icon }: { icon: ProductIconId }) {
  return (
    <svg className="product-icon" viewBox="0 0 24 24" aria-hidden="true">
      <GlyphArt icon={icon} />
    </svg>
  )
}

function Emblem({
  icon,
  x,
  y,
  r,
  colors,
}: {
  icon: ProductIconId
  x: number
  y: number
  r: number
  colors: WorldColors
}) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="#fffaf0" stroke={colors.trim} strokeWidth="3" />
      <Glyph icon={icon} x={x} y={y} size={r * 1.350} />
    </>
  )
}

// ---- Buildings ----------------------------------------------------------------

type StructureProps = { colors: WorldColors; icon: ProductIconId }

function Cottage({ colors: c, icon }: StructureProps) {
  return (
    <>
      <rect x="32" y="-116" width="14" height="34" rx="3" fill={c.wallShade} />
      <rect x="29" y="-120" width="20" height="7" rx="3" fill={c.roof} />
      <rect x="-56" y="-74" width="112" height="74" rx="8" fill={c.wall} />
      <path d="M30 -74h18a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8H30z" fill={c.wallShade} />
      <path d="M-66 -70L0 -120l66 50z" fill={c.roof} stroke={c.roof} strokeWidth="10" strokeLinejoin="round" />
      <path d="M-40 -84L0 -114l40 30" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <Emblem icon={icon} x={0} y={-90} r={13} colors={c} />
      <rect x="-46" y="-44" width="44" height="28" rx="5" fill={GLASS} stroke={c.trim} strokeWidth="3" />
      <path d="M-24 -44v28M-46 -30h44" stroke="#fff" strokeWidth="2" opacity="0.8" />
      <path d="M-50 -58h52v9a6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0z" fill="#fff" />
      <path d="M-37 -58h13v9a6.500 6.500 0 0 1-13 0zM-11 -58h13v9a6.500 6.500 0 0 1-13 0z" fill={c.accent} />
      <rect x="-48" y="-16" width="48" height="6" rx="3" fill={c.accent} />
      <path d="M14 0v-34a13 13 0 0 1 26 0V0z" fill={c.roof} />
      <circle cx="33" cy="-20" r="2.500" fill={c.trim} />
    </>
  )
}

function Stall({ colors: c, icon }: StructureProps) {
  const scallops = Array.from({ length: 7 }, (_, i) => -70 + i * 20)
  return (
    <>
      <rect x="-56" y="-76" width="5" height="76" fill={WOOD_DARK} />
      <rect x="51" y="-76" width="5" height="76" fill={WOOD_DARK} />
      <rect x="-48" y="-70" width="96" height="40" fill={c.wallShade} opacity="0.55" />
      <path d="M-62 -96H62l8 24H-70z" fill={c.roof} />
      <path d="M-36 -96l-6 24h14l3-24zM-8 -96l-2 24h20l-2-24zM22 -96l4 24h16l-7-24z" fill="#fff" opacity="0.85" />
      {scallops.map((x, i) => (
        <path
          key={x}
          d={`M${x} -72h20v5a10 10 0 0 1-20 0z`}
          fill={i % 2 === 0 ? c.roof : '#fff'}
        />
      ))}
      <rect x="-60" y="-36" width="120" height="36" rx="6" fill={c.wall} />
      <rect x="-60" y="-36" width="120" height="9" rx="4" fill={c.accent} />
      <path d="M-40 -22v18M-20 -22v18M20 -22v18M40 -22v18" stroke={c.wallShade} strokeWidth="2" strokeLinecap="round" />
      <Glyph icon={icon} x={-32} y={-46} size={18} />
      <Glyph icon={icon} x={32} y={-46} size={18} />
      <Emblem icon={icon} x={0} y={-14} r={12} colors={c} />
    </>
  )
}

function Cave({ colors: c, icon }: StructureProps) {
  return (
    <>
      <path d="M-34 -84l7-20 9 16zM-6 -98l8-22 8 21zM24 -92l10-18 6 22z" fill={c.roof} />
      <path d="M-72 0C-78 -52-52 -98-8 -102 38 -106 76 -64 72 0z" fill={c.wall} />
      <path d="M40 -88C66 -70 74 -36 72 0H44c6-30 4-62-4-88z" fill={c.wallShade} />
      <circle cx="-48" cy="-44" r="6" fill={c.wallShade} />
      <circle cx="-36" cy="-70" r="4" fill={c.wallShade} />
      <circle cx="50" cy="-26" r="5" fill={c.wall} opacity="0.6" />
      <path d="M-27 0v-30a27 30 0 0 1 54 0V0z" fill="#3e2f6e" />
      <ellipse cx="0" cy="-5" rx="17" ry="5" fill={c.accent} opacity="0.55" />
      <g className="w-blink">
        <ellipse cx="-8" cy="-30" rx="3.500" ry="4.500" fill={c.trim} />
        <ellipse cx="8" cy="-30" rx="3.500" ry="4.500" fill={c.trim} />
        <circle cx="-8" cy="-29" r="1.500" fill="#3e2f6e" />
        <circle cx="8" cy="-29" r="1.500" fill="#3e2f6e" />
      </g>
      <Emblem icon={icon} x={0} y={-76} r={12} colors={c} />
    </>
  )
}

function Pavilion({ colors: c, icon }: StructureProps) {
  return (
    <>
      <rect x="-62" y="-60" width="124" height="60" rx="8" fill={c.wall} />
      <path d="M38 -60h16a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H38z" fill={c.wallShade} />
      <rect x="-72" y="-76" width="144" height="20" rx="10" fill={c.roof} />
      <rect x="-72" y="-62" width="144" height="6" rx="3" fill={c.trim} />
      <path d="M-52 -76v-22" stroke={WOOD_DARK} strokeWidth="3" strokeLinecap="round" />
      <path className="w-sway" d="M-52 -98l18 5-18 6z" fill={c.accent} />
      <Emblem icon={icon} x={0} y={-84} r={17} colors={c} />
      <rect x="-54" y="-44" width="30" height="24" rx="6" fill={GLASS} stroke={c.trim} strokeWidth="3" />
      <rect x="24" y="-44" width="30" height="24" rx="6" fill={GLASS} stroke={c.trim} strokeWidth="3" />
      <path d="M-39 -44v24M39 -44v24" stroke="#fff" strokeWidth="2" opacity="0.8" />
      <path d="M-14 0v-30a14 14 0 0 1 28 0V0z" fill={c.accent} />
      <path d="M0 -42V0" stroke="#fff" strokeWidth="2" opacity="0.6" />
      <circle cx="-4" cy="-18" r="2" fill="#fff" />
      <circle cx="4" cy="-18" r="2" fill="#fff" />
    </>
  )
}

function Greenhouse({ colors: c, icon }: StructureProps) {
  return (
    <>
      <path d="M-58 -12V-48A58 52 0 0 1 58 -48v36z" fill="#dcf7f4" stroke={c.roof} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-29 -93v81M29 -93v81M-58 -48H58M0 -100v20" stroke={c.roof} strokeWidth="3" strokeLinecap="round" />
      <path d="M-46 -56c6-12 14-20 24-26" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <circle cx="-43" cy="-24" r="10" fill={LEAF} />
      <circle cx="-34" cy="-32" r="7" fill="#7ccf86" />
      <circle cx="42" cy="-26" r="11" fill={LEAF} />
      <circle cx="46" cy="-66" r="6" fill="#7ccf86" />
      <circle cx="-44" cy="-30" r="3" fill={c.accent} />
      <circle cx="38" cy="-32" r="3" fill={c.trim} />
      <circle cx="47" cy="-24" r="3" fill={c.accent} />
      <rect x="-62" y="-14" width="124" height="14" rx="5" fill={c.wallShade} />
      <rect x="-13" y="-44" width="26" height="44" rx="5" fill={c.wall} stroke={c.roof} strokeWidth="3" />
      <circle cx="7" cy="-20" r="2" fill={c.roof} />
      <Emblem icon={icon} x={0} y={-66} r={12} colors={c} />
    </>
  )
}

function Studio({ colors: c, icon }: StructureProps) {
  return (
    <>
      <path d="M-56 -8a8 8 0 0 0 8 8h96a8 8 0 0 0 8-8v-78L-56 -58z" fill={c.wall} />
      <path d="M32 -80l24-6v78a8 8 0 0 1-8 8H32z" fill={c.wallShade} />
      <path d="M-64 -58L64 -90" stroke={c.roof} strokeWidth="13" strokeLinecap="round" />
      <path d="M-50 -64L20 -82" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <circle cx="-26" cy="-30" r="16" fill={GLASS} stroke={c.trim} strokeWidth="4" />
      <path d="M-26 -46v32M-42 -30h32" stroke="#fff" strokeWidth="2" opacity="0.8" />
      <rect x="12" y="-40" width="26" height="40" rx="5" fill={c.accent} />
      <circle cx="32" cy="-20" r="2.200" fill="#fff" />
      <Emblem icon={icon} x={25} y={-58} r={11} colors={c} />
      <circle cx="-48" cy="-8" r="4" fill={c.accent} />
      <circle cx="-40" cy="-4" r="2.500" fill={c.roof} />
      <circle cx="-46" cy="-62" r="3" fill={c.trim} />
    </>
  )
}

function Tower({ colors: c, icon }: StructureProps) {
  return (
    <>
      <rect x="22" y="-42" width="42" height="42" rx="6" fill={c.wallShade} />
      <path d="M18 -42h50l-7-13H25z" fill={c.roof} />
      <rect x="32" y="-32" width="24" height="20" rx="3" fill="#fffaf0" />
      <path d="M36 -30v16M41 -30v16M46 -30v16M51 -30v16" stroke={c.accent} strokeWidth="3" />
      <path d="M41 -30v16M51 -30v16" stroke={c.roof} strokeWidth="3" />
      <rect x="-30" y="-98" width="60" height="98" rx="10" fill={c.wall} />
      <path d="M12 -98h8a10 10 0 0 1 10 10v78a10 10 0 0 1-10 10h-8z" fill={c.wallShade} />
      <path d="M0 -134v-14" stroke={WOOD_DARK} strokeWidth="2.500" strokeLinecap="round" />
      <path className="w-sway" d="M0 -148l14 4-14 5z" fill={c.accent} />
      <path d="M-36 -96L0 -132l36 36z" fill={c.roof} stroke={c.roof} strokeWidth="8" strokeLinejoin="round" />
      <path d="M-8 -64v-10a8 8 0 0 1 16 0v10z" fill={GLASS} stroke={c.trim} strokeWidth="3" />
      <Emblem icon={icon} x={0} y={-44} r={10} colors={c} />
      <path d="M-10 0v-22a10 10 0 0 1 20 0V0z" fill={c.roof} />
      <circle cx="5" cy="-12" r="1.800" fill={c.trim} />
    </>
  )
}

const STRUCTURES: Record<StructureType, (props: StructureProps) => JSX.Element> = {
  cottage: Cottage,
  stall: Stall,
  cave: Cave,
  pavilion: Pavilion,
  greenhouse: Greenhouse,
  studio: Studio,
  tower: Tower,
}

export function Structure({
  type,
  colors,
  icon,
}: StructureProps & { type: StructureType }) {
  const Art = STRUCTURES[type]
  return <Art colors={colors} icon={icon} />
}

// ---- Props --------------------------------------------------------------------

type PropArtProps = { colors: WorldColors; icon: ProductIconId }

function PropArt({ id, colors: c, icon }: PropArtProps & { id: PropId }) {
  switch (id) {
    case 'cakeStand':
      return (
        <>
          <ellipse cx="0" cy="-1.500" rx="8" ry="2.500" fill="#e9eef5" />
          <rect x="-2" y="-14" width="4" height="13" fill="#e9eef5" />
          <ellipse cx="0" cy="-14" rx="15" ry="3" fill="#fff" />
          <rect x="-10" y="-27" width="20" height="13" rx="3" fill="#ffd0dc" />
          <path d="M-10 -24a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2c-2 2-4 2-5 0-1 2-4 2-5 0-1 2-4 2-5 0-1 2-3 2-5 0z" fill="#fff" />
          <circle cx="0" cy="-29.500" r="3" fill="#f0546a" />
        </>
      )
    case 'breadBasket':
      return (
        <>
          <ellipse cx="-6" cy="-14" rx="8" ry="5.500" fill="#e8b56b" />
          <ellipse cx="7" cy="-15" rx="8" ry="6" fill="#f0c27d" />
          <path d="M-9 -15l3-2M-5 -13l3-2M4 -16l3-2M8 -14l3-2" stroke="#c98f45" strokeWidth="1.500" strokeLinecap="round" />
          <path d="M-16 -12h32l-4 12h-24z" fill={WOOD} />
          <path d="M-14 -8h28M-13 -4h26" stroke={WOOD_DARK} strokeWidth="1.500" />
        </>
      )
    case 'nest':
      return (
        <>
          <ellipse cx="-8" cy="-12" rx="5.500" ry="7.500" fill="#fff7e0" />
          <ellipse cx="8" cy="-12" rx="5.500" ry="7.500" fill="#fff7e0" />
          <ellipse className="w-wobble" cx="0" cy="-15" rx="6" ry="8" fill="#fffaf0" />
          <circle cx="-9" cy="-14" r="1.600" fill={c.accent} />
          <circle cx="9" cy="-13" r="1.600" fill={c.roof} />
          <circle cx="1" cy="-17" r="1.800" fill={c.trim} />
          <path d="M-20 -8c2 10 38 10 40 0-4 3-36 3-40 0z" fill={WOOD_DARK} />
          <ellipse cx="0" cy="-5" rx="20" ry="6" fill={WOOD} />
          <path d="M-14 -5l8 3M-2 -3l9-3M8 -2l8-4M-18 -7l6-2" stroke={WOOD_DARK} strokeWidth="1.500" strokeLinecap="round" />
        </>
      )
    case 'toyBlocks':
      return (
        <>
          <rect x="-14" y="-13" width="13" height="13" rx="2.500" fill={c.accent} />
          <rect x="1" y="-13" width="13" height="13" rx="2.500" fill={c.trim} />
          <rect x="-7" y="-26" width="13" height="13" rx="2.500" fill={c.roof} />
          <circle cx="-7.500" cy="-6.500" r="2.500" fill="#fff" opacity="0.7" />
          <path d="M5 -4l2.500-5 2.500 5z" fill="#fff" opacity="0.7" />
          <rect x="-3" y="-22" width="5" height="5" rx="1" fill="#fff" opacity="0.7" />
        </>
      )
    case 'doghouse':
      return (
        <>
          <rect x="-14" y="-18" width="28" height="18" rx="3" fill="#f6c98a" />
          <path d="M-17 -17L0 -31l17 14z" fill={c.roof} stroke={c.roof} strokeWidth="4" strokeLinejoin="round" />
          <path d="M-6 0v-8a6 6 0 0 1 12 0v8z" fill="#7a5540" />
          <circle cx="0" cy="-22" r="2.500" fill={c.trim} />
        </>
      )
    case 'ball':
      return (
        <>
          <circle className="w-bounce" cx="-4" cy="-8" r="8" fill={c.accent} />
          <path d="M8 -3h9" stroke="#fff7e0" strokeWidth="4" strokeLinecap="round" />
          <circle cx="8" cy="-4.500" r="2.200" fill="#fff7e0" />
          <circle cx="8" cy="-1.500" r="2.200" fill="#fff7e0" />
          <circle cx="17" cy="-4.500" r="2.200" fill="#fff7e0" />
          <circle cx="17" cy="-1.500" r="2.200" fill="#fff7e0" />
        </>
      )
    case 'pitcherTable':
      return (
        <>
          <path d="M-13 -12V0M13 -12V0" stroke={WOOD_DARK} strokeWidth="3" strokeLinecap="round" />
          <rect x="-17" y="-15" width="34" height="5" rx="2" fill={WOOD} />
          <path d="M-10 -34h13l-1 19h-11z" fill="#fffbe0" stroke="#e9c94a" strokeWidth="1" />
          <path d="M-9.500 -28h12l-.7 12.500h-10.600z" fill="#ffd94a" />
          <path d="M3 -31c5 0 5 9 0 9" fill="none" stroke="#e9c94a" strokeWidth="2" />
          <rect x="7" y="-23" width="7" height="8" rx="1.500" fill="#ffd94a" />
          <circle cx="-3" cy="-25" r="2.500" fill="#fff3a0" />
        </>
      )
    case 'lemonCrate':
      return (
        <>
          <circle cx="-8" cy="-14" r="5.500" fill="#ffdf4a" />
          <circle cx="8" cy="-14" r="5.500" fill="#ffdf4a" />
          <circle cx="0" cy="-17" r="5.500" fill="#ffe873" />
          <path d="M2 -22c2-3 5-3 6-2-1 3-4 3-6 2z" fill={LEAF} />
          <rect x="-15" y="-13" width="30" height="13" rx="2" fill={WOOD} />
          <path d="M-15 -8.500h30M-15 -4h30" stroke={WOOD_DARK} strokeWidth="1.500" />
        </>
      )
    case 'flowerPots':
      return (
        <>
          <path d="M-10 -10v-10M9 -9v-13" stroke={LEAF} strokeWidth="2" strokeLinecap="round" />
          <path d="M-10 -15c-4 0-5-3-5-4 3 0 5 1 5 4zM9 -14c4 0 5-3 5-4-3 0-5 1-5 4z" fill={LEAF} />
          <circle className="w-nod" cx="-10" cy="-22" r="5" fill={c.accent} />
          <circle cx="-10" cy="-22" r="2" fill="#fff3a0" />
          <circle className="w-nod" cx="9" cy="-25" r="5.500" fill={c.trim} />
          <circle cx="9" cy="-25" r="2.200" fill="#fff" />
          <path d="M-16 -10h12l-2 10h-8zM3 -9h12l-2 9H5z" fill="#e08a5b" />
          <path d="M-17 -11h14M2 -10h14" stroke="#c96f43" strokeWidth="2.500" strokeLinecap="round" />
        </>
      )
    case 'wateringCan':
      return (
        <>
          <path d="M8 -10l10-10" stroke="#5aaed6" strokeWidth="3.500" strokeLinecap="round" />
          <circle cx="19" cy="-21" r="3.500" fill="#5aaed6" />
          <path d="M-9 -15c-9-2-9 12 0 10" fill="none" stroke="#5aaed6" strokeWidth="2.500" />
          <rect x="-10" y="-18" width="19" height="18" rx="4" fill="#7fc7e8" />
          <rect x="-10" y="-18" width="19" height="4" rx="2" fill="#a6dcf2" />
          <path className="w-drip" d="M22 -16v2M25 -14v2M19 -14v2" stroke="#9fdcf2" strokeWidth="1.500" strokeLinecap="round" />
        </>
      )
    case 'easel':
      return (
        <>
          <path d="M0 -36L-12 0M0 -36L12 0M0 -36V-2" stroke={WOOD_DARK} strokeWidth="2.500" strokeLinecap="round" />
          <rect x="-12" y="-32" width="24" height="20" rx="2" fill="#fffdf7" stroke={WOOD} strokeWidth="2" />
          <circle cx="-4" cy="-24" r="4" fill={c.accent} />
          <circle cx="4" cy="-20" r="3.500" fill={c.roof} />
          <circle cx="5" cy="-27" r="2.500" fill={c.trim} />
          <rect x="-13" y="-12" width="26" height="3" rx="1.500" fill={WOOD} />
        </>
      )
    case 'yarnBasket':
      return (
        <>
          <circle cx="-7" cy="-15" r="7" fill={c.accent} />
          <circle cx="7" cy="-15" r="7" fill={c.roof} />
          <circle cx="0" cy="-20" r="6.500" fill={c.trim} />
          <path d="M-11 -17c3-3 6-3 8 0M4 -18c3-3 6-2 8 1M-4 -22c3-3 6-2 8 0" fill="none" stroke="#fff" strokeWidth="1.300" opacity="0.7" strokeLinecap="round" />
          <path d="M-16 -12h32l-4 12h-24z" fill={WOOD} />
          <path d="M-14 -8h28M-13 -4h26" stroke={WOOD_DARK} strokeWidth="1.500" />
        </>
      )
    case 'bookStack':
      return (
        <>
          <rect x="-13" y="-7" width="26" height="7" rx="1.500" fill={c.roof} />
          <rect x="-11" y="-14" width="23" height="7" rx="1.500" fill={c.accent} />
          <rect x="-14" y="-21" width="25" height="7" rx="1.500" fill={c.trim} />
          <path d="M-10 -3.500h8M-8 -10.500h8M-11 -17.500h8" stroke="#fff" strokeWidth="1.500" strokeLinecap="round" opacity="0.8" />
          <rect x="-8" y="-29" width="20" height="6" rx="1.500" fill="#5cc8a8" transform="rotate(-8 2 -26)" />
        </>
      )
    case 'lantern':
      return (
        <>
          <rect x="-1.500" y="-34" width="3" height="34" fill="#7a5540" />
          <ellipse cx="0" cy="-1" rx="6" ry="2" fill="#7a5540" />
          <path d="M0 -34h9" stroke="#7a5540" strokeWidth="3" strokeLinecap="round" />
          <circle className="w-glow" cx="9" cy="-25" r="11" fill="#fff3a0" opacity="0.45" />
          <rect x="4" y="-32" width="10" height="13" rx="3" fill={c.trim} stroke="#7a5540" strokeWidth="1.500" />
        </>
      )
    case 'crate':
      return (
        <>
          <Glyph icon={icon} x={-5} y={-21} size={14} />
          <Glyph icon={icon} x={6} y={-22} size={14} />
          <rect x="-14" y="-16" width="28" height="16" rx="2" fill={WOOD} />
          <path d="M-14 -10.500h28M-14 -5h28" stroke={WOOD_DARK} strokeWidth="1.500" />
          <path d="M-9 -16v16M9 -16v16" stroke={WOOD_DARK} strokeWidth="2" />
        </>
      )
    case 'barrel':
      return (
        <>
          <rect x="-11" y="-24" width="22" height="24" rx="7" fill="#c98f5a" />
          <path d="M-11 -17h22M-11 -7h22" stroke="#8a5a48" strokeWidth="2.500" />
          <path d="M-4 -24v24M4 -24v24" stroke="#b07a45" strokeWidth="1.200" />
          <ellipse cx="0" cy="-24" rx="9" ry="2.500" fill="#dba872" />
        </>
      )
  }
}

export function WorldProp({
  id,
  x,
  y,
  scale = 1,
  colors,
  icon,
}: PropArtProps & { id: PropId; x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <PropArt id={id} colors={colors} icon={icon} />
    </g>
  )
}
