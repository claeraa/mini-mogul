import type { BusinessModel, DayResult } from './model.ts'

/**
 * How a day felt, for the report's pictures and animations. It reads the
 * engine's result and decides nothing about money: the same numbers always
 * give the same mood.
 *
 * - great: a profit, and most customers went home happy
 * - good:  a profit, though many customers missed out
 * - okay:  broke even, or lost no more than two items' worth while selling
 * - tough: a bigger loss, or no sales at all (shown calmly, never harshly)
 */
export type DayMood = 'great' | 'good' | 'okay' | 'tough'

export function dayMood(model: BusinessModel, r: DayResult): DayMood {
  const profit = r.operatingProfitCents
  // No sales is never a celebration, even if a surprise brought in a little money.
  if (r.sold === 0) return 'tough'
  if (profit > 0) return r.sold * 4 >= r.demand * 3 ? 'great' : 'good'
  if (r.sold > 0 && profit >= -2 * model.unitCostCents) return 'okay'
  return 'tough'
}

/** The report's headline: short, and kind on a bad day. */
export const MOOD_TITLES: Record<DayMood, string> = {
  great: 'Amazing day!',
  good: 'You made a profit!',
  okay: 'So close!',
  tough: 'Tough day. Keep going!',
}

/**
 * The headline for one day. An okay day that came out at exactly zero says
 * so; "So close!" is kept for a small loss.
 */
export function reportTitle(model: BusinessModel, r: DayResult): string {
  const mood = dayMood(model, r)
  if (mood === 'okay' && r.operatingProfitCents === 0) return 'You broke even!'
  return MOOD_TITLES[mood]
}

/**
 * How many of `shown` little customers smile. Buyers smile, customers who
 * missed out do not; any sale shows at least one smile and any miss at least
 * one frown, when there is room for both.
 */
export function reportFaces(r: DayResult, max = 10): { happy: number; sad: number } {
  const shown = Math.max(0, Math.min(r.demand, max))
  if (shown === 0) return { happy: 0, sad: 0 }
  const missed = r.demand - r.sold
  let happy = Math.round((shown * r.sold) / r.demand)
  if (r.sold > 0) happy = Math.max(1, happy)
  if (missed > 0 && shown > 1) happy = Math.min(happy, shown - 1)
  if (missed === 0) happy = shown
  return { happy, sad: shown - happy }
}
