/**
 * What the AI Imagination Director is allowed to say.
 *
 * The LLM never draws anything and never does sums. It only chooses from
 * the lists below (everything the renderer can actually draw) and writes a
 * few short sentences. Every reply is checked here, on the server and again
 * in the browser, before the game uses it. Anything that fails is thrown
 * away and the built-in rules take over.
 *
 * This file is plain TypeScript with no browser or server dependencies, so
 * both sides and the tests share exactly the same checks.
 */

import type {
  BiomeId,
  DecorationId,
  ProductIconId,
  PropId,
  StructureType,
  TimeOfDay,
  WorldThemeId,
} from '../world/blueprint.ts'

// ---- What the renderer can draw ---------------------------------------------

export const WORLD_THEMES = [
  'bakery', 'creature-care', 'pet-care', 'drink-stand', 'garden',
  'craft-studio', 'book-nook', 'general-store',
] as const satisfies readonly WorldThemeId[]

export const STRUCTURES = [
  'cottage', 'cave', 'pavilion', 'stall', 'greenhouse', 'studio', 'tower',
] as const satisfies readonly StructureType[]

export const BIOMES = [
  'meadow', 'crags', 'park', 'garden', 'woods', 'beach',
] as const satisfies readonly BiomeId[]

export const TIMES = ['day', 'night'] as const satisfies readonly TimeOfDay[]

export const PROPS = [
  'cakeStand', 'breadBasket', 'nest', 'toyBlocks', 'doghouse', 'ball',
  'pitcherTable', 'lemonCrate', 'flowerPots', 'wateringCan', 'easel',
  'yarnBasket', 'bookStack', 'lantern', 'crate', 'barrel',
] as const satisfies readonly PropId[]

export const DECORATIONS = [
  'sparkles', 'fireflies', 'butterflies', 'bunting', 'hearts', 'bubbles',
  'petals', 'seagulls', 'smoke',
] as const satisfies readonly DecorationId[]

export const PRODUCT_ICONS = [
  'cupcake', 'egg', 'paw', 'drink', 'flower', 'palette', 'book', 'gift',
] as const satisfies readonly ProductIconId[]

export const BUSINESS_KINDS = ['product', 'service'] as const

/** Wall colours, from soft pastels to warmer and deeper tones. */
export const WALL_COLORS = {
  cream: { wall: '#fff3dc', wallShade: '#efd6b6' },
  lilac: { wall: '#b9a6e8', wallShade: '#9d88d6' },
  lavender: { wall: '#f5e6ff', wallShade: '#dcc4f2' },
  mint: { wall: '#e6fbf1', wallShade: '#bfe9d6' },
  lemon: { wall: '#fff6c9', wallShade: '#f2dd94' },
  blush: { wall: '#ffe9f0', wallShade: '#f6c9d8' },
  sky: { wall: '#e3f3ff', wallShade: '#bcdcf5' },
  peach: { wall: '#ffe6d2', wallShade: '#f4c6a4' },
  butter: { wall: '#ffe9a6', wallShade: '#f0cf78' },
  honey: { wall: '#ffd98a', wallShade: '#eebc5a' },
  terracotta: { wall: '#f2b48c', wallShade: '#dc9366' },
  rosewood: { wall: '#f4b8b0', wallShade: '#e09a92' },
  seafoam: { wall: '#cfeee4', wallShade: '#a3d9c8' },
  sage: { wall: '#d5e6c2', wallShade: '#b3cf98' },
  periwinkle: { wall: '#c9d4ff', wallShade: '#a4b3f0' },
  plum: { wall: '#d9b8e6', wallShade: '#bf94d2' },
} as const

export const ACCENT_COLORS = {
  rose: '#ff9fb2',
  coral: '#ff9a6b',
  teal: '#5cc8a8',
  sunshine: '#ffd23f',
  pink: '#ff8fb8',
  violet: '#8f7ff0',
  amber: '#f2a93b',
  aqua: '#36bccb',
  crimson: '#e85d75',
  tangerine: '#ff8a3d',
  gold: '#e8b422',
  lime: '#8fce3f',
  forest: '#3fa56b',
  ocean: '#2f8fd6',
  indigo: '#5a5fd6',
  magenta: '#d65bb5',
} as const

export type WallColorId = keyof typeof WALL_COLORS
export type AccentColorId = keyof typeof ACCENT_COLORS

export const WALL_COLOR_IDS = Object.keys(WALL_COLORS) as [WallColorId, ...WallColorId[]]
export const ACCENT_COLOR_IDS = Object.keys(ACCENT_COLORS) as [AccentColorId, ...AccentColorId[]]

// ---- What the game can teach -------------------------------------------------

/** Only ideas the simulation really demonstrates. */
export const CONCEPTS = {
  pricing: 'Pricing',
  demand: 'Supply and demand',
  revenue: 'Revenue',
  costs: 'Costs',
  profit: 'Profit and loss',
  'cash-flow': 'Cash flow',
  inventory: 'Inventory',
  marketing: 'Marketing',
  risk: 'Surprises and risk',
} as const

export type ConceptId = keyof typeof CONCEPTS
export const CONCEPT_IDS = Object.keys(CONCEPTS) as [ConceptId, ...ConceptId[]]

// ---- The Director's two kinds of reply ---------------------------------------

export type WorldDirection = {
  /** One friendly sentence about the business. */
  summary: string
  /** A short name for the world, e.g. "Sleepy dragon nursery". */
  label: string
  theme: WorldThemeId
  kind: 'product' | 'service'
  structure: StructureType
  biome: BiomeId
  timeOfDay: TimeOfDay
  props: PropId[]
  decorations: DecorationId[]
  productIcon: ProductIconId
  wallColor: WallColorId
  accentColor: AccentColorId
  /** Who comes to visit, e.g. "Sleepy dragon parents". */
  customers: string
  /** Short things happy customers say (speech bubbles). */
  reactions: string[]
  /** Ideas for the first thing to sell or do. */
  offerings: string[]
  concepts: { id: ConceptId; why: string }[]
}

export type Coaching = {
  encouragement: string
  suggestion: string
  /** An optional goal for tomorrow. */
  challenge: string | null
}

export const LIMITS = {
  idea: 120,
  offering: 50,
  summary: 170,
  label: 36,
  customers: 70,
  reaction: 24,
  offeringIdea: 40,
  conceptWhy: 150,
  coachLine: 260,
  challenge: 190,
} as const

// ---- Checking text -----------------------------------------------------------

/**
 * A small second line of defence behind the model's own instructions: words
 * that have no place in a children's shop game. A match discards the reply.
 */
const UNSUITABLE =
  /\b(kill|killing|murder|gun|guns|weapon|blood|bloody|sex|sexy|drug|drugs|beer|wine|vodka|whisky|whiskey|cigarette|vape|gamble|gambling|casino|hate|stupid|idiot|dumb|damn|hell|crap|suicide|die|dead)\b/i

/** Tidies a string, or returns null if it is not usable. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text || text.length > max) return null
  // No markup, links or contact details; this is display text only.
  if (/[<>{}\\]|https?:|www\.|@/i.test(text)) return null
  if (UNSUITABLE.test(text)) return null
  return text
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null
}

/** Keeps the allowed, distinct entries of a list, in order. */
function pickMany<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return []
  const kept: T[] = []
  for (const entry of value) {
    const item = pick(entry, allowed)
    if (item && !kept.includes(item)) kept.push(item)
  }
  return kept
}

function texts(value: unknown, max: number, limit: number): string[] {
  if (!Array.isArray(value)) return []
  const kept: string[] = []
  for (const entry of value) {
    const text = cleanText(entry, max)
    if (text && !kept.includes(text)) kept.push(text)
  }
  return kept.slice(0, limit)
}

// ---- Checking a world ---------------------------------------------------------

/**
 * Accepts a world direction only if every part of it is something the game
 * supports. Unknown props or decorations are dropped; a missing or unknown
 * essential (structure, biome, text that fails the checks) rejects it all.
 */
export function parseWorldDirection(value: unknown): WorldDirection | null {
  if (!isRecord(value)) return null
  // The model flags ideas that are not right for a children's game.
  if (value.kidSafe === false) return null

  const summary = cleanText(value.summary, LIMITS.summary)
  const label = cleanText(value.label, LIMITS.label)
  const customers = cleanText(value.customers, LIMITS.customers)
  const theme = pick(value.theme, WORLD_THEMES)
  const kind = pick(value.kind, BUSINESS_KINDS)
  const structure = pick(value.structure, STRUCTURES)
  const biome = pick(value.biome, BIOMES)
  const timeOfDay = pick(value.timeOfDay, TIMES)
  const productIcon = pick(value.productIcon, PRODUCT_ICONS)
  const wallColor = pick(value.wallColor, WALL_COLOR_IDS)
  const accentColor = pick(value.accentColor, ACCENT_COLOR_IDS)

  const props = pickMany(value.props, PROPS).slice(0, 3)
  const decorations = pickMany(value.decorations, DECORATIONS).slice(0, 4)
  const reactions = texts(value.reactions, LIMITS.reaction, 4)
  const offerings = texts(value.offerings, LIMITS.offeringIdea, 3)

  const concepts: WorldDirection['concepts'] = []
  if (Array.isArray(value.concepts)) {
    for (const entry of value.concepts) {
      if (!isRecord(entry)) continue
      const id = pick(entry.id, CONCEPT_IDS)
      const why = cleanText(entry.why, LIMITS.conceptWhy)
      if (id && why && !concepts.some((c) => c.id === id)) concepts.push({ id, why })
    }
  }

  if (
    !summary || !label || !customers || !theme || !kind || !structure ||
    !biome || !timeOfDay || !productIcon || !wallColor || !accentColor ||
    props.length < 2 || reactions.length < 2 || concepts.length < 2
  ) {
    return null
  }

  return {
    summary, label, theme, kind, structure, biome, timeOfDay, props,
    decorations, productIcon, wallColor, accentColor, customers, reactions,
    offerings, concepts: concepts.slice(0, 3),
  }
}

// ---- Checking coaching --------------------------------------------------------

/** Every number-like token in a sentence: "$4.50", "12", "25%". */
export function numbersIn(text: string): string[] {
  return text.match(/\$?\d+(?:[.,]\d+)*%?/g) ?? []
}

/**
 * Accepts coaching only if every number it mentions is one the game gave it.
 * `allowed` holds those numbers as written ("$4.50", "11", "25%"), so the
 * coach can repeat the day's real figures but cannot invent new ones.
 */
export function parseCoaching(
  value: unknown,
  allowed: ReadonlySet<string>,
): Coaching | null {
  if (!isRecord(value)) return null
  const encouragement = cleanText(value.encouragement, LIMITS.coachLine)
  const suggestion = cleanText(value.suggestion, LIMITS.coachLine)
  if (!encouragement || !suggestion) return null

  let challenge: string | null = null
  if (value.challenge !== null && value.challenge !== undefined && value.challenge !== '') {
    challenge = cleanText(value.challenge, LIMITS.challenge)
    if (!challenge) return null
  }

  for (const line of [encouragement, suggestion, challenge ?? '']) {
    for (const token of numbersIn(line)) {
      if (!allowed.has(token.replace(/,/g, ''))) return null
    }
  }
  return { encouragement, suggestion, challenge }
}

// ---- Checking what the player sends -------------------------------------------

/** The only player text that ever leaves the browser: the idea and product. */
export function parseWorldRequest(
  value: unknown,
): { idea: string; offering: string } | null {
  if (!isRecord(value)) return null
  const idea = typeof value.idea === 'string' ? value.idea.replace(/\s+/g, ' ').trim() : ''
  const offering =
    typeof value.offering === 'string' ? value.offering.replace(/\s+/g, ' ').trim() : ''
  if (idea.length < 3 || idea.length > LIMITS.idea || offering.length > LIMITS.offering) {
    return null
  }
  return { idea, offering }
}
