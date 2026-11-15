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

export type CrowdNote = {
  /** Shown where there is room, e.g. "+12 more potential customers". */
  text: string
  /** Shown on narrow screens. */
  short: string
  /** The whole picture in one sentence, for a tooltip. */
  detail: string
}

/**
 * Words for the customers who do not fit on screen. Before the shop opens
 * the crowd is only an estimate ('expected'); once it is open they are the
 * customers who really came ('arrived'). Null when everyone is on screen,
 * so the scene never hints at customers who are not in the numbers.
 */
export function crowdNote(
  kind: 'expected' | 'arrived',
  total: number,
  shown: number,
): CrowdNote | null {
  const extra = total - shown
  if (!Number.isInteger(extra) || extra <= 0 || shown < 0) return null
  if (kind === 'expected') {
    return {
      text: `+${extra} more potential ${extra === 1 ? 'customer' : 'customers'}`,
      short: `+${extra} more may visit`,
      detail: `About ${total} customers may visit today. This is an estimate; ${shown} are shown.`,
    }
  }
  return {
    text: `+${extra} more ${extra === 1 ? 'customer' : 'customers'}`,
    short: `+${extra} more came`,
    detail: `${total} customers came today. ${shown} are shown.`,
  }
}
