import type { GameState } from './state.ts'
import { extrasOf } from './upgrades.ts'

/**
 * The first-day guide: three short steps on the plan board and one sentence
 * on the first report. It only ever points and explains. It never blocks a
 * control, and every step can be skipped.
 *
 * What is taught, and when:
 *   day 1      make, price, open; then what profit means
 *   days 1-2   revenue, costs and profit, through the report and the coach
 *   day 3 on   saving and spending: the Improve board appears
 *   later      borrowing and expansion (not in the game yet)
 */

export const GUIDE_STEPS = ['make', 'price', 'open'] as const
export type GuideStep = (typeof GUIDE_STEPS)[number]

/** 'auto' shows the guide on a brand-new world; 'replay' shows it anywhere; 'done' never. */
export const GUIDE_MODES = ['auto', 'replay', 'done'] as const
export type GuideMode = (typeof GUIDE_MODES)[number]

/** Whether the guide should appear for this world right now. */
export function guideWanted(mode: GuideMode, game: GameState): boolean {
  if (mode === 'done') return false
  if (mode === 'replay') return true
  // Only a world that has never been played. Someone already running a shop
  // is not walked through it again.
  return game.day === 1 && game.history.length === 0
}

export type GuideWords = {
  /** What the player sells, e.g. "Petal cupcakes". Empty if they have not said. */
  product: string
  /** Who visits, e.g. "Fairy folk". */
  customers: string
}

export type GuideCard = { step: GuideStep; count: string; title: string; body: string }

/** One card of the guide, in the player's own words where it has them. */
export function guideCard(step: GuideStep, words: GuideWords): GuideCard {
  const product = words.product.trim() || 'things'
  const customers = words.customers.trim().toLowerCase() || 'customers'
  const count = `${GUIDE_STEPS.indexOf(step) + 1} of ${GUIDE_STEPS.length}`
  switch (step) {
    case 'make':
      return {
        step,
        count,
        title: 'Make something to sell',
        body: `Tap Make. How many ${product} will your ${customers} want?`,
      }
    case 'price':
      return {
        step,
        count,
        title: 'Choose a price',
        body: 'Tap Price. A lower price brings more customers. A higher price earns more each.',
      }
    case 'open':
      return {
        step,
        count,
        title: 'Open your shop!',
        body: 'Tap the big yellow button and watch who comes.',
      }
  }
}

/** The one sentence on the first report. */
export function reportNote(profitCents: number): string {
  if (profitCents > 0) return 'Your first day! Profit is the money you keep after paying to make things.'
  if (profitCents < 0) return 'Your first day! A loss means making things cost more than you earned. Try again tomorrow!'
  return 'Your first day! You earned back exactly what you spent. Profit is what is left over.'
}

export function nextGuideStep(step: GuideStep): GuideStep | null {
  const next = GUIDE_STEPS.indexOf(step) + 1
  return next < GUIDE_STEPS.length ? GUIDE_STEPS[next] : null
}

/**
 * The Improve board is for players who have seen cash and profit at work:
 * it appears on day 3. A world that already owns an upgrade keeps it open.
 */
export const IMPROVE_FROM_DAY = 3

export function improveUnlocked(game: GameState): boolean {
  const extras = extrasOf(game)
  return (
    game.day >= IMPROVE_FROM_DAY ||
    extras.upgrades.production > 0 ||
    extras.upgrades.shop > 0 ||
    extras.campaignDaysLeft > 0 ||
    extras.investedTotalCents > 0
  )
}
