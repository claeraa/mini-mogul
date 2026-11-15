/**
 * Tidy names for shops and products. Plain text rules, no AI: they only
 * shorten and trim what the player typed, never add to it.
 */

/** Words a name should not end on: "Luxury Fashion Boutique For" reads broken. */
const DANGLING = new Set([
  'for', 'of', 'and', 'the', 'with', 'a', 'an', 'to', 'in', 'that', 'who', 'where',
  'which', 'on', 'at', 'by', 'from', 'or', 'but', 'my', 'our', 'your', 'their',
  'is', 'are', 'selling', 'serving', 'called',
])

/** Words that start a description, not a name: "...boutique for sleepy dragons". */
const CLAUSE = new Set(['for', 'that', 'who', 'where', 'which', 'with', 'selling', 'serving', 'called'])

/** Small words stay lower-case in the middle of a name. */
const SMALL = new Set(['of', 'and', 'the', 'for', 'in', 'on', 'at', 'to', 'a', 'an', 'with', 'by'])

const MAX_WORDS = 4

function dropDangling(words: string[]): string[] {
  const kept = [...words]
  while (kept.length > 1 && DANGLING.has(kept.at(-1)!.toLowerCase())) kept.pop()
  return kept
}

function titleCase(words: string[]): string {
  return words
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (i > 0 && SMALL.has(lower)) return lower
      // Leave words the player capitalised themselves (e.g. "DIY", "McCake").
      return /[A-Z]/.test(word.slice(1)) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * A shop name suggested from the player's name and idea, at most `max`
 * characters, always ending on a whole, sensible word.
 */
export function suggestShopName(playerName: string, idea: string, max = 40): string {
  let words = idea
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(a|an|the|my|our)\s+/i, '')
    .split(' ')
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean)

  // Keep the name, not the description that follows it.
  const clause = words.findIndex((word, i) => i >= 2 && CLAUSE.has(word.toLowerCase()))
  if (clause !== -1) words = words.slice(0, clause)
  words = dropDangling(words.slice(0, MAX_WORDS))
  if (words.length === 0) words = ['Shop']

  const owner = playerName.replace(/\s+/g, ' ').trim()
  const prefix = owner ? `${owner}${/s$/i.test(owner) ? "'" : "'s"} ` : ''

  // Too long: shed words from the end, then the owner's name, never half a word.
  // With the owner's name in front, at least two words of the idea must fit.
  for (const lead of prefix ? [prefix, ''] : ['']) {
    const least = lead ? Math.min(2, words.length) : 1
    for (let count = words.length; count >= least; count -= 1) {
      const kept = dropDangling(words.slice(0, count))
      if (kept.length < least) continue
      const name = lead + titleCase(kept)
      if (name.length <= max) return name
    }
  }
  return titleCase(words.slice(0, 1)).slice(0, max).trim()
}

/**
 * The thing being sold, without the "I sell" in front: "Sell clothes" and
 * "we make cloud cupcakes!" become "clothes" and "cloud cupcakes", so labels
 * such as "Selling clothes" read properly.
 */
export function offeringName(text: string): string {
  const tidy = text.replace(/\s+/g, ' ').trim().replace(/[.!?,;:]+$/, '')
  const stripped = tidy.replace(
    /^(?:(?:i|we)\s+(?:will\s+|am\s+|are\s+)?)?(?:sell(?:ing)?|mak(?:e|ing)|bak(?:e|ing)|offer(?:ing)?|do(?:ing)?|provid(?:e|ing)|giv(?:e|ing))\s+(?=\S)/i,
    '',
  )
  return stripped || tidy
}

/** Shortens text to `max` characters at a whole word, with an ellipsis. */
export function shorten(text: string, max: number): string {
  const tidy = text.replace(/\s+/g, ' ').trim()
  if (tidy.length <= max) return tidy
  const space = tidy.lastIndexOf(' ', max - 1)
  const cut = space >= max * 0.4 ? space : max - 1
  return `${tidy.slice(0, cut).replace(/[\s,;:.!?'"-]+$/, '')}…`
}
