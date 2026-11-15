import type { WorldThemeId } from './blueprint.ts'
import { hits, tokenize } from './words.ts'

/**
 * Who comes to the shop. Each id is a cast of little characters the game can
 * draw (components/Critter.tsx); nothing outside this list can be shown.
 *
 * The choice is plain keyword rules, so the same business always gets the
 * same customers, with or without the AI Director.
 */
export const CUSTOMER_CASTS = [
  'fairies',
  'dragons',
  'pet-owners',
  'shoppers',
  'kids',
  'bakers',
  'gardeners',
  'crafters',
  'readers',
  'villagers',
  'neighbours',
] as const

export type CustomerCastId = (typeof CUSTOMER_CASTS)[number]

/** A short name for each cast, for labels and screen readers. */
export const CAST_NAMES: Record<CustomerCastId, string> = {
  fairies: 'Fairy folk',
  dragons: 'Dragon families',
  'pet-owners': 'Pet owners',
  shoppers: 'Stylish shoppers',
  kids: 'Playful kids',
  bakers: 'Hungry villagers',
  gardeners: 'Garden lovers',
  crafters: 'Crafty makers',
  readers: 'Book lovers',
  villagers: 'Thirsty villagers',
  neighbours: 'Friendly neighbours',
}

/**
 * Checked in order, so the most particular audience wins: a "fairy fashion
 * boutique" has fairy customers, not ordinary shoppers.
 */
const RULES: [CustomerCastId, string[]][] = [
  ['fairies', ['fairy', 'fairies', 'faerie', 'pixie', 'elf', 'elves', 'elven', 'sprite']],
  // Scaly, horned creatures only. A unicorn, mermaid or robot is not a
  // dragon: sharing a magical theme is not a reason to show one.
  [
    'dragons',
    ['dragon', 'dino*', 'monster', 'creature', 'beast', 'griffin', 'phoenix', 'yeti', 'troll', 'goblin', 'hatchling'],
  ],
  [
    'pet-owners',
    ['pet', 'dog', 'doggy', 'puppy', 'puppies', 'cat', 'kitten', 'kitty', 'hamster', 'pony', 'ponies', 'bunny', 'bunnies', 'rabbit', 'vet', 'kennel', 'animal'],
  ],
  [
    'shoppers',
    ['fashion*', 'boutique', 'cloth*', 'dress*', 'outfit', 'costume', 'hat', 'shoe', 'scarf', 'scarves', 'wardrobe', 'tailor', 'couture', 'gown', 'shirt', 'sock', 'tiara', 'accessor*', 'stylish', 'handbag', 'jewel*'],
  ],
  ['kids', ['toy', 'doll', 'teddy', 'teddies', 'puzzle', 'game', 'kite', 'plush*', 'yoyo', 'balloon', 'slime']],
  ['gardeners', ['flower', 'floral', 'florist', 'garden*', 'plant', 'seed', 'bouquet', 'herb']],
  ['readers', ['book', 'library', 'story', 'stories', 'comic', 'read*']],
  ['bakers', ['bak*', 'cake', 'cupcake', 'bread', 'cookie', 'pastry', 'pastries', 'donut', 'pie']],
]

/** The cast each kind of world falls back on. Never an unrelated group. */
const THEME_CAST: Record<WorldThemeId, CustomerCastId> = {
  bakery: 'bakers',
  'creature-care': 'dragons',
  'pet-care': 'pet-owners',
  'drink-stand': 'villagers',
  garden: 'gardeners',
  'craft-studio': 'crafters',
  'book-nook': 'readers',
  'general-store': 'neighbours',
}

/**
 * Casts that are one particular kind of character. They are only ever shown
 * when the player's idea, the first product or the description of the
 * customers actually mentions that kind; otherwise a neutral cast is used.
 */
const SPECIES_CASTS: CustomerCastId[] = ['fairies', 'dragons', 'pet-owners']

/** Ordinary people: right for any business, and never the wrong creature. */
const NEUTRAL_CAST: CustomerCastId = 'neighbours'

function mentions(cast: CustomerCastId, text: string): boolean {
  const words = RULES.find(([id]) => id === cast)?.[1] ?? []
  return hits(tokenize(text), words) > 0
}

function fromWords(text: string): CustomerCastId | null {
  const tokens = tokenize(text)
  if (tokens.length === 0) return null
  for (const [cast, words] of RULES) {
    if (hits(tokens, words) > 0) return cast
  }
  return null
}

export function isCustomerCast(value: unknown): value is CustomerCastId {
  return typeof value === 'string' && (CUSTOMER_CASTS as readonly string[]).includes(value)
}

export type CastInput = {
  theme: WorldThemeId
  idea: string
  offering?: string
  /** Extra words about the audience, e.g. the AI Director's description. */
  audience?: string
  /** A cast picked by the AI Director, already checked against the list. */
  suggested?: CustomerCastId | null
}

/**
 * Picks the customers for a business:
 * 1. what the player's own idea says (a fairy shop gets fairies);
 * 2. the AI Director's pick, if there is one;
 * 3. what the first product or the audience description says;
 * 4. the usual customers for that kind of world;
 * 5. ordinary neighbours.
 *
 * Fairies, dragons and pet owners are only chosen at steps 2 and 4 when
 * something written actually mentions them. Customers the game cannot draw
 * (unicorns, mermaids, robots) fall through to the kind of business instead:
 * a unicorn bakery gets bakery customers, not another magical creature.
 */
export function pickCustomerCast(input: CastInput): CustomerCastId {
  const everything = `${input.idea} ${input.offering ?? ''} ${input.audience ?? ''}`
  // A species cast needs its own words somewhere in what was written. This
  // stops, say, dragons standing in for unicorns because both are magical.
  const supported = (cast: CustomerCastId | null | undefined): CustomerCastId | null =>
    cast && (!SPECIES_CASTS.includes(cast) || mentions(cast, everything)) ? cast : null

  return (
    fromWords(input.idea) ??
    supported(isCustomerCast(input.suggested) ? input.suggested : null) ??
    fromWords(`${input.offering ?? ''} ${input.audience ?? ''}`) ??
    supported(THEME_CAST[input.theme]) ??
    NEUTRAL_CAST
  )
}

/**
 * The name shown for a cast. It only ever names what the characters look
 * like: the horned, scaly cast is "Dragon families" when the idea is about
 * dragons and "Creature families" for monsters, dinosaurs and the like.
 */
export function castLabel(cast: CustomerCastId, idea: string): string {
  if (cast === 'dragons' && hits(tokenize(idea), ['dragon']) === 0) return 'Creature families'
  return CAST_NAMES[cast]
}
