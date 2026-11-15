/**
 * Keeping business ideas suitable for children.
 *
 * Mini Mogul welcomes strange, silly and magical ideas. The only ideas it
 * turns away are businesses built around things that are not for children:
 * tobacco and vaping, alcohol, drugs, gambling, weapons and adult content.
 * Those are not refused with an error; the player is offered nearby ideas
 * that are fine.
 *
 * This is one plain list, used everywhere: when the idea is typed, when a
 * shop is named, before anything is sent to the AI Director, and when an
 * older save is loaded. So the game behaves the same with the AI on or off,
 * and a world can never keep an unsuitable name over a harmless picture.
 *
 * The patterns match whole words and whole phrases, so harmless ideas that
 * merely contain similar letters are left alone ("seaweed snacks", "smoked
 * salmon stall", "tie-dye shop", "root beer float stand" is caught by design:
 * it still says beer).
 */

export type IdeaConcern = 'tobacco' | 'alcohol' | 'drugs' | 'gambling' | 'weapons' | 'adult' | 'unkind'

const CONCERNS: [IdeaConcern, RegExp][] = [
  [
    'tobacco',
    /\bsmok(e|ing|ers?) (shop|store|lounge|bar|room)\b|\btobacco\b|\bcigar(s|ette|ettes)?\b|\bvap(e|es|ing)\b|\bhookah\b|\bnicotine\b|\be-?cig/i,
  ],
  [
    'alcohol',
    /\balcohol(ic)?\b|\bliquor\b|\bbeer(s)?\b|\bwine(s|ry)?\b|\bvodka\b|\bwhisk(e)?y\b|\bbrewery\b|\bcocktail(s)?\b|\bpub\b|\bbooze\b|\btavern\b|\bchampagne\b/i,
  ],
  ['drugs', /\bdrugs?\b|\bweed\b|\bmarijuana\b|\bcannabis\b|\bdispensary\b|\bcocaine\b|\bheroin\b|\bpills?\b/i],
  ['gambling', /\bgambl(e|ing|er|ers)\b|\bcasino\b|\bpoker\b|\bbetting\b|\blottery\b|\bslot machines?\b/i],
  ['weapons', /\bguns?\b|\bweapons?\b|\bpistols?\b|\brifles?\b|\bammo\b|\bammunition\b|\bbombs?\b|\bexplosives?\b/i],
  ['adult', /\bsex(y|ual)?\b|\bporn\w*\b|\bnude\b|\bstrip club\b|\badult (shop|store|videos?)\b/i],
  ['unkind', /\bkill(s|ing|er)?\b|\bmurder\w*\b|\bhate\b|\bsuicide\b|\btorture\b/i],
]

/** What is wrong with a piece of text, or null if it is fine. */
export function ideaConcern(text: string): IdeaConcern | null {
  const tidy = text.replace(/\s+/g, ' ').trim()
  if (!tidy) return null
  for (const [concern, pattern] of CONCERNS) {
    if (pattern.test(tidy)) return concern
  }
  return null
}

export const isSuitable = (text: string) => ideaConcern(text) === null

/** Ideas with a similar feel that are fine for everyone. */
const ALTERNATIVES: Record<IdeaConcern, string[]> = {
  tobacco: ['Bubble shop', 'Scented candle shop', 'Cosy tea shop'],
  alcohol: ['Fizzy lemonade stand', 'Fruit smoothie bar', 'Hot cocoa café'],
  drugs: ['Herb garden shop', 'Magic potion stand', 'Flower shop'],
  gambling: ['Board game café', 'Puzzle shop', 'Arcade prize stand'],
  weapons: ['Toy shop', 'Kite shop', 'Water balloon stand'],
  adult: ['Fancy dress boutique', 'Dance studio', 'Magical bakery'],
  unkind: ['Kindness card shop', 'Pet sitting', 'Superhero cape shop'],
}

export type IdeaCheck =
  | { ok: true }
  | {
      ok: false
      concern: IdeaConcern
      /** Said to the player: friendly, and never repeats the idea back. */
      message: string
      suggestions: string[]
    }

/** Checks an idea, a shop name or a product, and offers alternatives. */
export function checkIdea(text: string): IdeaCheck {
  const concern = ideaConcern(text)
  if (!concern) return { ok: true }
  return {
    ok: false,
    concern,
    message: 'Mini Mogul is for everyone, so let\'s pick a different idea. How about one of these?',
    suggestions: ALTERNATIVES[concern],
  }
}

/** The idea a world falls back on when an older save holds an unsuitable one. */
export const SAFE_IDEA = 'Surprise shop'
