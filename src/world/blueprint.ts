/**
 * World blueprints turn what the player typed (their idea, their first
 * product and the style they picked) into a description of a themed scene.
 *
 * Everything here is plain, deterministic TypeScript: keyword rules and a
 * small hash, no AI and no randomness, so the same words always build the
 * same world. The scene components only draw what a blueprint describes.
 *
 * To add a new kind of world, add one entry to ARCHETYPES (and, if it needs
 * new art, a structure or prop in components/WorldParts.tsx).
 */

export type StyleId = 'cottage' | 'forest' | 'seaside' | 'starlight'

export type WorldThemeId =
  | 'bakery'
  | 'creature-care'
  | 'pet-care'
  | 'drink-stand'
  | 'garden'
  | 'craft-studio'
  | 'book-nook'
  | 'general-store'

export type StructureType =
  | 'cottage'
  | 'cave'
  | 'pavilion'
  | 'stall'
  | 'greenhouse'
  | 'studio'
  | 'tower'

export type BiomeId = 'meadow' | 'crags' | 'park' | 'garden' | 'woods' | 'beach'

export type PropId =
  | 'cakeStand'
  | 'breadBasket'
  | 'nest'
  | 'toyBlocks'
  | 'doghouse'
  | 'ball'
  | 'pitcherTable'
  | 'lemonCrate'
  | 'flowerPots'
  | 'wateringCan'
  | 'easel'
  | 'yarnBasket'
  | 'bookStack'
  | 'lantern'
  | 'crate'
  | 'barrel'

export type DecorationId =
  | 'sparkles'
  | 'fireflies'
  | 'butterflies'
  | 'bunting'
  | 'hearts'
  | 'bubbles'
  | 'petals'
  | 'seagulls'
  | 'smoke'

export type ProductIconId =
  | 'cupcake'
  | 'egg'
  | 'paw'
  | 'drink'
  | 'flower'
  | 'palette'
  | 'book'
  | 'gift'

export type TimeOfDay = 'day' | 'night'

export type WorldColors = {
  skyTop: string
  skyBottom: string
  /** The sun by day, the moon by night. */
  glow: string
  hillFar: string
  hillNear: string
  ground: string
  groundShade: string
  wall: string
  wallShade: string
  roof: string
  trim: string
  accent: string
}

export type WorldBlueprint = {
  theme: WorldThemeId
  /** A short friendly name for the world, e.g. "Moonlit refreshment stand". */
  label: string
  structure: StructureType
  biome: BiomeId
  timeOfDay: TimeOfDay
  /** A hint for future business models; the game does not branch on it yet. */
  kind: 'product' | 'service'
  props: PropId[]
  decorations: DecorationId[]
  productIcon: ProductIconId
  colors: WorldColors
  /** Things happy customers say in this world. */
  reactions: string[]
}

export type BlueprintInput = {
  idea: string
  /** The first thing the player will sell or do. May be empty. */
  offering?: string
  style: StyleId
}

// ---- Rules ------------------------------------------------------------------

type Archetype = {
  theme: WorldThemeId
  /** Words that point to this world. A trailing * matches any ending. */
  keywords: string[]
  baseLabel: string
  structure: StructureType
  /** The setting used with the default (cottage) style. */
  biome: BiomeId
  props: PropId[]
  decorations: DecorationId[]
  productIcon: ProductIconId
  wall: string
  wallShade: string
  accent: string
  reactions: string[]
}

/** Checked in order; on a tied score the earlier entry wins. */
const ARCHETYPES: Archetype[] = [
  {
    theme: 'creature-care',
    keywords: [
      'dragon', 'monster', 'dinosaur', 'dino', 'unicorn', 'creature', 'beast',
      'griffin', 'phoenix', 'yeti', 'troll', 'goblin', 'daycare', 'nursery',
      'hatch*', 'egg',
    ],
    baseLabel: 'creature nest',
    structure: 'cave',
    biome: 'crags',
    props: ['nest', 'toyBlocks', 'lantern'],
    decorations: ['sparkles'],
    productIcon: 'egg',
    wall: '#b9a6e8',
    wallShade: '#9d88d6',
    accent: '#ff9a6b',
    reactions: ['So cute!', 'Rawr!', 'Best nest ever!', 'They love it!'],
  },
  {
    theme: 'bakery',
    keywords: [
      'bak*', 'cake', 'cupcake', 'bread', 'cookie', 'pastry', 'pastries',
      'donut', 'doughnut', 'pie', 'muffin', 'bun', 'brownie', 'croissant',
      'biscuit', 'waffle', 'pancake', 'candy', 'chocolate', 'sweet', 'dessert',
      'pizza',
    ],
    baseLabel: 'bakery cottage',
    structure: 'cottage',
    biome: 'meadow',
    props: ['cakeStand', 'breadBasket', 'lantern'],
    decorations: ['smoke', 'bunting'],
    productIcon: 'cupcake',
    wall: '#fff3dc',
    wallShade: '#efd6b6',
    accent: '#ff9fb2',
    reactions: ['Yum!', 'So fluffy!', 'Smells amazing!', 'One more, please!'],
  },
  {
    theme: 'pet-care',
    keywords: [
      'pet', 'dog', 'doggy', 'puppy', 'puppies', 'cat', 'kitten', 'kitty',
      'bunny', 'rabbit', 'hamster', 'pony', 'animal', 'sitting', 'sitter',
      'walk*', 'groom*', 'vet', 'kennel', 'paw',
    ],
    baseLabel: 'pet care park',
    structure: 'pavilion',
    biome: 'park',
    props: ['doghouse', 'ball', 'flowerPots'],
    decorations: ['hearts', 'butterflies'],
    productIcon: 'paw',
    wall: '#fdf0d5',
    wallShade: '#ecd9b4',
    accent: '#5cc8a8',
    reactions: ['Woof!', 'Happy tails!', 'Such good care!', 'Purrfect!'],
  },
  {
    theme: 'drink-stand',
    keywords: [
      'lemonade', 'lemon', 'juice', 'tea', 'coffee', 'cocoa', 'smoothie',
      'milkshake', 'shake', 'soda', 'drink', 'slush*', 'punch', 'cafe',
      'stand', 'icecream', 'popsicle', 'sundae',
    ],
    baseLabel: 'refreshment stand',
    structure: 'stall',
    biome: 'meadow',
    props: ['pitcherTable', 'lemonCrate', 'barrel'],
    decorations: ['bunting', 'bubbles'],
    productIcon: 'drink',
    wall: '#fff6c9',
    wallShade: '#f2dd94',
    accent: '#ffd23f',
    reactions: ['Refreshing!', 'So zesty!', 'Ahh!', 'Another cup!'],
  },
  {
    theme: 'garden',
    keywords: [
      'flower', 'floral', 'florist', 'garden*', 'plant', 'seed', 'bouquet',
      'rose', 'tulip', 'daisy', 'daisies', 'herb', 'tree', 'bloom*',
      'blossom', 'veg*', 'fruit', 'farm*',
    ],
    baseLabel: 'flower garden',
    structure: 'greenhouse',
    biome: 'garden',
    props: ['flowerPots', 'wateringCan', 'crate'],
    decorations: ['butterflies', 'petals'],
    productIcon: 'flower',
    wall: '#e6fbf1',
    wallShade: '#bfe9d6',
    accent: '#ff8fb8',
    reactions: ['So pretty!', 'It smells lovely!', 'For my window!', 'Beautiful!'],
  },
  {
    theme: 'craft-studio',
    keywords: [
      'craft*', 'art', 'artist', 'paint*', 'draw*', 'knit*', 'sew*',
      'crochet', 'jewel*', 'bead', 'bracelet', 'necklace', 'pottery', 'clay',
      'candle', 'soap', 'toy', 'card', 'sticker', 'origami', 'handmade',
      'studio', 'slime',
    ],
    baseLabel: 'craft studio',
    structure: 'studio',
    biome: 'meadow',
    props: ['easel', 'yarnBasket', 'crate'],
    decorations: ['bunting', 'sparkles'],
    productIcon: 'palette',
    wall: '#ffe9f0',
    wallShade: '#f6c9d8',
    accent: '#8f7ff0',
    reactions: ['I love it!', 'So creative!', 'Did you make this?', 'Wow!'],
  },
  {
    theme: 'book-nook',
    keywords: [
      'book', 'library', 'story', 'stories', 'comic', 'read*', 'poem',
      'magazine', 'zine', 'tale',
    ],
    baseLabel: 'book nook',
    structure: 'tower',
    biome: 'meadow',
    props: ['bookStack', 'lantern', 'flowerPots'],
    decorations: ['fireflies'],
    productIcon: 'book',
    wall: '#f5e6ff',
    wallShade: '#dcc4f2',
    accent: '#f2a93b',
    reactions: ['What a story!', 'One more chapter!', 'A classic!', 'Ooh!'],
  },
]

/** Used when no keyword matches; a hash of the idea picks the variation. */
const GENERAL: Archetype = {
  theme: 'general-store',
  keywords: [],
  baseLabel: 'little shop',
  structure: 'cottage',
  biome: 'meadow',
  props: ['crate', 'barrel', 'lantern'],
  decorations: ['bunting'],
  productIcon: 'gift',
  wall: '#fff3dc',
  wallShade: '#efd6b6',
  accent: '#36bccb',
  reactions: ['Just what I wanted!', 'Lovely!', 'Thank you!', 'I will be back!'],
}

const GENERAL_VARIANTS: Pick<Archetype, 'structure' | 'props'>[] = [
  { structure: 'cottage', props: ['crate', 'barrel', 'lantern'] },
  { structure: 'stall', props: ['crate', 'flowerPots', 'lantern'] },
  { structure: 'studio', props: ['barrel', 'crate', 'flowerPots'] },
]

/** The product on the sign and shelf can follow the first product instead. */
const ICON_WORDS: [ProductIconId, string[]][] = [
  ['cupcake', ['cake', 'cupcake', 'cookie', 'muffin', 'donut', 'doughnut', 'pie', 'bread', 'bun', 'brownie', 'pastry', 'pastries']],
  ['drink', ['lemonade', 'juice', 'tea', 'coffee', 'cocoa', 'smoothie', 'milkshake', 'soda', 'drink', 'punch']],
  ['flower', ['flower', 'bouquet', 'rose', 'tulip', 'daisy', 'daisies', 'plant', 'seed']],
  ['egg', ['egg']],
  ['paw', ['walk*', 'groom*', 'cuddle', 'treat', 'bone']],
  ['book', ['book', 'story', 'stories', 'comic', 'poem']],
  ['palette', ['paint*', 'drawing', 'bracelet', 'necklace', 'card', 'sticker', 'candle', 'craft*']],
]

const NIGHT_WORDS = [
  'moon*', 'night*', 'midnight', 'star', 'starry', 'starlight', 'dream*',
  'twilight', 'lunar', 'sleepy', 'bedtime',
]

const MAGIC_WORDS = [
  'magic*', 'wizard', 'witch', 'fairy', 'fairies', 'enchant*', 'spell',
  'potion', 'unicorn', 'dragon', 'mystic*', 'wand',
]

const SERVICE_WORDS = [
  'service', 'sitting', 'sitter', 'daycare', 'care', 'walk*', 'lesson',
  'class', 'wash*', 'repair*', 'tutor*', 'clean*', 'groom*', 'deliver*',
  'babysit*', 'mow*',
]

type StylePalette = {
  roof: string
  trim: string
  /** null keeps the archetype's own setting. */
  biome: BiomeId | null
  night: boolean
  sky: [string, string]
  nightSky: [string, string]
  decorations: DecorationId[]
}

export const STYLE_PALETTES: Record<StyleId, StylePalette> = {
  cottage: {
    roof: '#f0705f',
    trim: '#ffd978',
    biome: null,
    night: false,
    sky: ['#9fd8fb', '#eaf8ff'],
    nightSky: ['#2b2a6b', '#8a6fc9'],
    decorations: [],
  },
  forest: {
    roof: '#3fa56b',
    trim: '#d6f58c',
    biome: 'woods',
    night: false,
    sky: ['#a6e3d8', '#f0fbe6'],
    nightSky: ['#1f3560', '#3f7f8c'],
    decorations: ['fireflies'],
  },
  seaside: {
    roof: '#2aa9c4',
    trim: '#ffe9c2',
    biome: 'beach',
    night: false,
    sky: ['#8fd3f7', '#fff3dc'],
    nightSky: ['#22306e', '#4f86c9'],
    decorations: ['seagulls'],
  },
  starlight: {
    roof: '#7667d8',
    trim: '#ffd978',
    biome: null,
    night: true,
    sky: ['#2b2a6b', '#7a6fd0'],
    nightSky: ['#2b2a6b', '#7a6fd0'],
    decorations: ['sparkles'],
  },
}

const BIOME_COLORS: Record<
  BiomeId,
  Pick<WorldColors, 'hillFar' | 'hillNear' | 'ground' | 'groundShade'>
> = {
  meadow: { hillFar: '#c4ecd0', hillNear: '#a9e2ab', ground: '#8fd98a', groundShade: '#6cc763' },
  park: { hillFar: '#c9efc6', hillNear: '#aee5a0', ground: '#9be08f', groundShade: '#74cc6c' },
  garden: { hillFar: '#d3f1c9', hillNear: '#b4e6a6', ground: '#a5e29a', groundShade: '#7ecf74' },
  crags: { hillFar: '#d6ccf2', hillNear: '#bdb0ea', ground: '#c9bdea', groundShade: '#ab9bdc' },
  woods: { hillFar: '#a8dcbc', hillNear: '#82caa0', ground: '#7fcf93', groundShade: '#5cb878' },
  beach: { hillFar: '#7fcfe6', hillNear: '#b6e8f1', ground: '#ffe3ad', groundShade: '#f6cf8e' },
}

const MAX_DECORATIONS = 4

// ---- Helpers ----------------------------------------------------------------

/** Lower-case words, with accents and punctuation removed. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean)
}

function matches(token: string, keyword: string): boolean {
  if (keyword.endsWith('*')) return token.startsWith(keyword.slice(0, -1))
  return token === keyword || token === `${keyword}s` || token === `${keyword}es`
}

const hits = (tokens: string[], keywords: string[]) =>
  keywords.filter((keyword) => tokens.some((token) => matches(token, keyword)))
    .length

/** A small stable string hash (FNV-1a), used only to vary the fallback. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0
  }
  return h
}

function pickArchetype(ideaTokens: string[], offeringTokens: string[]): Archetype {
  let best: Archetype | null = null
  let bestScore = 0
  for (const archetype of ARCHETYPES) {
    // The idea counts double: it names the business, the product refines it.
    const score =
      hits(ideaTokens, archetype.keywords) * 2 +
      hits(offeringTokens, archetype.keywords)
    if (score > bestScore) {
      best = archetype
      bestScore = score
    }
  }
  if (best) return best
  const variant = GENERAL_VARIANTS[hash(ideaTokens.join(' ')) % GENERAL_VARIANTS.length]
  return { ...GENERAL, ...variant }
}

function pickIcon(offeringTokens: string[], fallback: ProductIconId): ProductIconId {
  for (const [icon, words] of ICON_WORDS) {
    if (hits(offeringTokens, words) > 0) return icon
  }
  return fallback
}

// ---- The generator ----------------------------------------------------------

export function generateWorldBlueprint(input: BlueprintInput): WorldBlueprint {
  const ideaTokens = tokenize(input.idea)
  const offeringTokens = tokenize(input.offering ?? '')
  const allTokens = [...ideaTokens, ...offeringTokens]

  const archetype = pickArchetype(ideaTokens, offeringTokens)
  const style = STYLE_PALETTES[input.style] ?? STYLE_PALETTES.cottage

  const night = style.night || hits(allTokens, NIGHT_WORDS) > 0
  const magic = hits(allTokens, MAGIC_WORDS) > 0
  const biome = style.biome ?? archetype.biome
  const [skyTop, skyBottom] = night ? style.nightSky : style.sky

  // Mood first, then the world's own touches, then the style's.
  const wanted: DecorationId[] = [
    ...(magic ? (['sparkles'] as const) : []),
    ...(night ? (['fireflies'] as const) : []),
    ...archetype.decorations,
    ...style.decorations,
  ]
  // Butterflies and gulls are asleep at night.
  const awake = night
    ? wanted.filter((id) => id !== 'butterflies' && id !== 'seagulls')
    : wanted
  const decorations = [...new Set(awake)].slice(0, MAX_DECORATIONS)

  const mood = night ? 'Moonlit' : magic ? 'Enchanted' : 'Cozy'

  return {
    theme: archetype.theme,
    label: `${mood} ${archetype.baseLabel}`,
    structure: archetype.structure,
    biome,
    timeOfDay: night ? 'night' : 'day',
    kind: hits(allTokens, SERVICE_WORDS) > 0 ? 'service' : 'product',
    props: [...archetype.props],
    decorations,
    productIcon: pickIcon(offeringTokens, archetype.productIcon),
    colors: {
      skyTop,
      skyBottom,
      glow: night ? '#fdf6d8' : '#fff0a3',
      ...BIOME_COLORS[biome],
      wall: archetype.wall,
      wallShade: archetype.wallShade,
      roof: style.roof,
      trim: style.trim,
      accent: archetype.accent,
    },
    reactions: [...archetype.reactions],
  }
}

/** The heading for the player's first product or service. */
export function offeringLabel(kind: WorldBlueprint['kind']): string {
  return kind === 'service' ? 'First service' : 'First on the shelf'
}
