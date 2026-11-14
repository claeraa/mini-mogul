/**
 * Decides which little customers appear on screen for a day. The scene can
 * only fit a handful, so they stand in for the real numbers; the report
 * always shows the exact figures.
 */

export type StageVisitor = { id: number; buys: boolean }

export const MAX_STAGE_VISITORS = 8

export function stageVisitors(
  demand: number,
  sold: number,
  max: number = MAX_STAGE_VISITORS,
): StageVisitor[] {
  const shown = Math.max(0, Math.min(demand, max))
  if (shown === 0) return []
  const missed = demand - sold

  let buyers = Math.round((shown * sold) / demand)
  // Any sale shows at least one happy customer; any miss shows at least one
  // disappointed one, when there is room for both.
  if (sold > 0) buyers = Math.max(1, buyers)
  if (missed > 0 && shown > 1) buyers = Math.min(buyers, shown - 1)
  if (missed === 0) buyers = shown

  // Buyers come first: the shelf runs out for the latecomers.
  return Array.from({ length: shown }, (_, id) => ({ id, buys: id < buyers }))
}

/** Items left on the shelf after `served` of `buyers` on-screen sales. */
export function shelfDuring(
  available: number,
  sold: number,
  served: number,
  buyers: number,
): number {
  if (buyers <= 0) return available
  return available - Math.round((sold * Math.min(served, buyers)) / buyers)
}
