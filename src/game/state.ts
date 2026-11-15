import type { BusinessModel, Cents, DayPlan, DayResult } from './model.ts'
import { extrasAfterDay, extrasOf, noExtras } from './upgrades.ts'
import type { ShopExtras } from './upgrades.ts'

/** The saved game: where the shop stands at the start of `day`. */
export type GameState = {
  version: 1
  modelId: string
  seed: number
  day: number
  cashCents: Cents
  inventory: number
  /** The player's last choices, used as tomorrow's starting plan. */
  lastPlan: DayPlan
  /** Most recent days, oldest first. */
  history: DayResult[]
} & Partial<ShopExtras>
// The upgrade fields are optional so that saves made before upgrades existed
// load unchanged; extrasOf() fills in "no upgrades" wherever they are missing.

const HISTORY_LIMIT = 14

export function newGame(model: BusinessModel, seed: number): GameState {
  return {
    version: 1,
    modelId: model.id,
    seed: seed >>> 0,
    day: 1,
    cashCents: model.startingCashCents,
    inventory: 0,
    lastPlan: {
      priceCents: model.referencePriceCents,
      produce: model.defaultProduce,
      flyers: false,
    },
    history: [],
    ...noExtras(),
  }
}

/** Moves the game on to the next morning. */
export function applyResult(state: GameState, result: DayResult): GameState {
  return {
    ...state,
    ...extrasAfterDay(state),
    day: result.day + 1,
    cashCents: result.cashEndCents,
    inventory: result.endInventory,
    lastPlan: {
      priceCents: result.priceCents,
      produce: result.produced,
      flyers: false,
    },
    history: [...state.history, result].slice(-HISTORY_LIMIT),
  }
}

const isInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value)

/** Accepts only a well-formed save; anything else starts a fresh game. */
export function parseGame(value: unknown): GameState | null {
  if (typeof value !== 'object' || value === null) return null
  const game = value as Partial<GameState>
  const plan = game.lastPlan
  if (
    game.version !== 1 ||
    typeof game.modelId !== 'string' ||
    !isInt(game.seed) ||
    !isInt(game.day) ||
    game.day < 1 ||
    !isInt(game.cashCents) ||
    !isInt(game.inventory) ||
    game.inventory < 0 ||
    typeof plan !== 'object' ||
    plan === null ||
    !isInt(plan.priceCents) ||
    !isInt(plan.produce) ||
    !Array.isArray(game.history)
  ) {
    return null
  }
  // Upgrade fields are tidied rather than trusted: anything damaged becomes
  // "no upgrade", and the rest of the save is kept.
  return { ...(game as GameState), ...extrasOf(game) }
}
