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
  [
    'dragons',
    ['dragon', 'dino*', 'monster', 'creature', 'beast', 'griffin', 'phoenix', 'yeti', 'troll', 'goblin', 'unicorn', 'hatchling'],
  ],
  [
    'pet-owners',
    ['pet', 'dog', 'doggy', 'puppy', 'puppies', 'cat', 'kitten', 'kitty', 'hamster', 'pony', 'ponies', 'bunny', 'bunnies', 'rabbit', 'vet', 'kennel', 'groom*', 'animal'],
  ],
  [
    'shoppers',
    ['fashion*', 'boutique', 'cloth*', 'dress*', 'outfit', 'costume', 'hat', 'shoe', 'scarf', 'scarves', 'wardrobe', 'tailor', 'couture', 'gown', 'shirt', 'sock', 'tiara', 'accessor*', 'stylish', 'handbag', 'jewel*'],
  ],
  ['kids', ['toy', 'doll', 'teddy', 'teddies', 'puzzle', 'game', 'kite', 'robot', 'plush*', 'yoyo', 'balloon', 'slime']],
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
 * 4. the usual customers for that kind of world.
 */
export function pickCustomerCast(input: CastInput): CustomerCastId {
  return (
    fromWords(input.idea) ??
    (isCustomerCast(input.suggested) ? input.suggested : null) ??
    fromWords(`${input.offering ?? ''} ${input.audience ?? ''}`) ??
    THEME_CAST[input.theme] ??
    'neighbours'
  )
}
