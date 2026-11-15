import type { BusinessModel, Cents, DayEvent, DayPlan, DayResult } from './model.ts'
import { simulateDay } from './simulation.ts'
import type { GameState } from './state.ts'

/**
 * Business upgrades: spending the shop's cash on things that make it better.
 *
 * THE ACCOUNTING MODEL (simplified, and the same everywhere in the game)
 *
 * 1. Lasting upgrades (a bigger workshop, a prettier shop) are bought with
 *    cash and kept for good. Buying one lowers CASH straight away. It is NOT
 *    an expense and does NOT lower that day's profit: the money has been
 *    turned into something the shop owns. The game keeps a running total of
 *    cash spent this way (`investedTotalCents`). It does not wear the
 *    upgrades out over time (no depreciation): that is the simplification.
 *
 * 2. A marketing campaign is used up, so it IS an expense. Its whole cost is
 *    counted against profit on the day it is bought, like flyers, even
 *    though its extra customers arrive over several days.
 *
 * 3. So on any day:
 *      profit      = revenue - expenses            (campaign is in expenses)
 *      cash change = money in - money out          (upgrades are in money out)
 *      cash change = profit - growth in shelf value - upgrades bought
 *    Nothing is counted twice: an upgrade appears once (cash out), a
 *    campaign once as an expense and once as the matching cash out.
 *
 * 4. Upgrades change what is possible, never what is certain. They raise how
 *    many can be made or how many customers may come; price, costs and
 *    surprises still decide whether the day makes money.
 *
 * Everything here is plain arithmetic in whole cents. The day itself is
 * still worked out by simulateDay, unchanged; an upgrade only adjusts the
 * numbers that go into it.
 */

export const UPGRADE_IDS = ['production', 'shop'] as const
export type UpgradeId = (typeof UPGRADE_IDS)[number]

export type UpgradeLevels = Record<UpgradeId, number>

export const MAX_UPGRADE_LEVEL = 3

type UpgradeTrack = {
  /** What each level gives, from level 0 (no upgrade) to the top. */
  values: number[]
  /** What it costs to reach level 1, 2 and 3. */
  costsCents: Cents[]
}

export const UPGRADES: Record<UpgradeId, UpgradeTrack> = {
  /** The most items the shop can make in a day. */
  production: { values: [20, 30, 45, 60], costsCents: [1500, 3000, 5000] },
  /** Extra customers who notice the shop, as a percentage. */
  shop: { values: [0, 15, 30, 45], costsCents: [2000, 4000, 7000] },
}

/** A poster campaign: paid once, brings extra customers for a few days. */
export const CAMPAIGN = { costCents: 600, demandPct: 20, days: 3 } as const

/** The upgrade state kept with each saved world. Missing in older saves. */
export type ShopExtras = {
  upgrades: UpgradeLevels
  /** Days of the current campaign still to come, counting today. */
  campaignDaysLeft: number
  /** Cash spent this morning, waiting to be shown on today's report. */
  investedTodayCents: Cents
  campaignTodayCents: Cents
  /** All cash ever turned into lasting upgrades in this world. */
  investedTotalCents: Cents
}

export const noExtras = (): ShopExtras => ({
  upgrades: { production: 0, shop: 0 },
  campaignDaysLeft: 0,
  investedTodayCents: 0,
  campaignTodayCents: 0,
  investedTotalCents: 0,
})

const isInt = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

const level = (value: unknown) => (isInt(value) && value >= 0 && value <= MAX_UPGRADE_LEVEL ? value : 0)

const amount = (value: unknown, max: number) => (isInt(value) && value >= 0 && value <= max ? value : 0)

/** The most cash that can ever be spent on lasting upgrades. */
export const MAX_INVESTED_CENTS = UPGRADE_IDS.reduce(
  (total, id) => total + UPGRADES[id].costsCents.reduce((sum, cost) => sum + cost, 0),
  0,
)

/** Reads the upgrade state from a save, filling in anything missing or damaged. */
export function extrasOf(game: Partial<ShopExtras> | null | undefined): ShopExtras {
  const saved = game ?? {}
  const upgrades = (saved.upgrades ?? {}) as Partial<UpgradeLevels>
  return {
    upgrades: { production: level(upgrades.production), shop: level(upgrades.shop) },
    campaignDaysLeft: amount(saved.campaignDaysLeft, CAMPAIGN.days),
    investedTodayCents: amount(saved.investedTodayCents, MAX_INVESTED_CENTS),
    campaignTodayCents: saved.campaignTodayCents === CAMPAIGN.costCents ? CAMPAIGN.costCents : 0,
    investedTotalCents: amount(saved.investedTotalCents, MAX_INVESTED_CENTS),
  }
}

/**
 * The shop's numbers with its upgrades applied. Only two things change: how
 * many can be made in a day, and how many customers come at the reference
 * price. Price, costs and every formula stay exactly as they were.
 */
export function effectiveModel(
  base: BusinessModel,
  levels: UpgradeLevels,
  campaignActive: boolean,
): BusinessModel {
  const demandPct = 100 + UPGRADES.shop.values[level(levels.shop)] + (campaignActive ? CAMPAIGN.demandPct : 0)
  return {
    ...base,
    maxDailyProduction: Math.min(base.maxDailyProduction, UPGRADES.production.values[level(levels.production)]),
    baseDemand: Math.round((base.baseDemand * demandPct) / 100),
  }
}

/** The shop as it stands this morning. */
export function modelForGame(base: BusinessModel, game: GameState): BusinessModel {
  const extras = extrasOf(game)
  return effectiveModel(base, extras.upgrades, extras.campaignDaysLeft > 0)
}

/** The shop as it stood on the day a result describes. */
export function modelForResult(base: BusinessModel, r: DayResult): BusinessModel {
  return effectiveModel(
    base,
    { production: level(r.productionLevel), shop: level(r.shopLevel) },
    r.campaignActive === true,
  )
}

export type UpgradeOffer = {
  id: UpgradeId
  /** The level the shop has now and the level this purchase gives. */
  level: number
  nextLevel: number
  costCents: Cents
  /** What it gives now and what it would give. */
  from: number
  to: number
}

/** The next step up for an upgrade, or null at the top level. */
export function nextUpgrade(id: UpgradeId, levels: UpgradeLevels): UpgradeOffer | null {
  const current = level(levels[id])
  if (current >= MAX_UPGRADE_LEVEL) return null
  const track = UPGRADES[id]
  return {
    id,
    level: current,
    nextLevel: current + 1,
    costCents: track.costsCents[current],
    from: track.values[current],
    to: track.values[current + 1],
  }
}

export type PurchaseCheck =
  | { ok: true; costCents: Cents }
  | { ok: false; reason: 'maxed' | 'active' | 'cash'; costCents: Cents; shortCents: Cents }

export function checkUpgrade(game: GameState, id: UpgradeId): PurchaseCheck {
  const offer = nextUpgrade(id, extrasOf(game).upgrades)
  if (!offer) return { ok: false, reason: 'maxed', costCents: 0, shortCents: 0 }
  if (game.cashCents < offer.costCents) {
    return { ok: false, reason: 'cash', costCents: offer.costCents, shortCents: offer.costCents - game.cashCents }
  }
  return { ok: true, costCents: offer.costCents }
}

export function checkCampaign(game: GameState): PurchaseCheck {
  const costCents = CAMPAIGN.costCents
  if (extrasOf(game).campaignDaysLeft > 0) return { ok: false, reason: 'active', costCents, shortCents: 0 }
  if (game.cashCents < costCents) return { ok: false, reason: 'cash', costCents, shortCents: costCents - game.cashCents }
  return { ok: true, costCents }
}

/**
 * Buys the next level of a lasting upgrade. Cash goes down by its cost at
 * once; profit is not touched. Returns the game unchanged if the shop cannot
 * afford it or is already at the top level.
 */
export function buyUpgrade(game: GameState, id: UpgradeId): GameState {
  const check = checkUpgrade(game, id)
  if (!check.ok) return game
  const extras = extrasOf(game)
  return {
    ...game,
    cashCents: game.cashCents - check.costCents,
    upgrades: { ...extras.upgrades, [id]: extras.upgrades[id] + 1 },
    campaignDaysLeft: extras.campaignDaysLeft,
    investedTodayCents: extras.investedTodayCents + check.costCents,
    campaignTodayCents: extras.campaignTodayCents,
    investedTotalCents: extras.investedTotalCents + check.costCents,
  }
}

/**
 * Starts a poster campaign. Cash goes down by its cost at once, and the
 * whole cost is an expense on today's report.
 */
export function buyCampaign(game: GameState): GameState {
  const check = checkCampaign(game)
  if (!check.ok) return game
  const extras = extrasOf(game)
  return {
    ...game,
    cashCents: game.cashCents - check.costCents,
    upgrades: extras.upgrades,
    campaignDaysLeft: CAMPAIGN.days,
    investedTodayCents: extras.investedTodayCents,
    campaignTodayCents: check.costCents,
    investedTotalCents: extras.investedTotalCents,
  }
}

/**
 * One day in an upgraded shop. simulateDay does the day exactly as before,
 * using the shop's upgraded numbers; this then puts the morning's purchases
 * on the record so the report can show them.
 *
 * `game.cashCents` is the cash left after this morning's purchases. The
 * result's cashStartCents is the cash before them, so the day's cash change
 * includes everything that was spent.
 */
export function simulateShopDay(
  base: BusinessModel,
  game: GameState,
  plan: DayPlan,
  event: DayEvent,
): DayResult {
  const extras = extrasOf(game)
  const campaignActive = extras.campaignDaysLeft > 0
  const day = simulateDay(
    effectiveModel(base, extras.upgrades, campaignActive),
    { day: game.day, cashCents: game.cashCents, inventory: game.inventory },
    plan,
    event,
  )
  return {
    ...day,
    cashStartCents: day.cashStartCents + extras.investedTodayCents + extras.campaignTodayCents,
    // The campaign is an expense; the lasting upgrades are not.
    operatingProfitCents: day.operatingProfitCents - extras.campaignTodayCents,
    productionLevel: extras.upgrades.production,
    shopLevel: extras.upgrades.shop,
    campaignActive,
    investmentCents: extras.investedTodayCents,
    campaignCents: extras.campaignTodayCents,
  }
}

/** After a day closes: the campaign has one day less, and the morning's purchases are on the books. */
export function extrasAfterDay(game: GameState): ShopExtras {
  const extras = extrasOf(game)
  return {
    ...extras,
    campaignDaysLeft: Math.max(0, extras.campaignDaysLeft - 1),
    investedTodayCents: 0,
    campaignTodayCents: 0,
  }
}

/** What stops the shop making more today: the size of its workshop, or its cash. */
export type MakeLimit = {
  /** The most that can be made today. */
  limit: number
  /** The workshop's own daily limit at its current level. */
  capacity: number
  /** 'workshop' when a bigger workshop would allow more; 'cash' when only more cash would. */
  reason: 'workshop' | 'cash'
  /** True while there is still a workshop upgrade to buy. */
  canGrow: boolean
}

export function makeLimit(model: BusinessModel, game: GameState, flyers: boolean): MakeLimit {
  const spendable = game.cashCents - (flyers ? model.flyerCostCents : 0)
  const affordable = Math.floor(Math.max(0, spendable) / model.unitCostCents)
  const capacity = model.maxDailyProduction
  return {
    limit: Math.min(capacity, affordable),
    capacity,
    reason: affordable >= capacity ? 'workshop' : 'cash',
    canGrow: extrasOf(game).upgrades.production < MAX_UPGRADE_LEVEL,
  }
}
