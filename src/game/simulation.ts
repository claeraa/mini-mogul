import { EVENTS } from './model.ts'
import type { BusinessModel, Cents, DayEvent, DayPlan, DayResult } from './model.ts'

/**
 * Pure, deterministic rules for one shop day. Nothing here reads the clock,
 * storage or Math.random: the same inputs always give the same answer.
 */

type DayStart = { day: number; cashCents: Cents; inventory: number }

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Customers who want to buy at a price, before any surprise. A straight
 * line: `baseDemand` at the reference price, falling to zero at the ceiling.
 */
export function demandAtPrice(model: BusinessModel, priceCents: Cents): number {
  if (priceCents >= model.ceilingPriceCents) return 0
  const span = model.ceilingPriceCents - model.referencePriceCents
  return Math.max(
    0,
    Math.round((model.baseDemand * (model.ceilingPriceCents - priceCents)) / span),
  )
}

/** Demand after flyers and the day's surprise are applied. */
export function demandForDay(
  model: BusinessModel,
  priceCents: Cents,
  flyers: boolean,
  event: DayEvent | null,
): number {
  const pct =
    100 + (flyers ? model.flyerDemandPct : 0) + (event ? event.demandPct : 0)
  return Math.max(0, Math.round((demandAtPrice(model, priceCents) * pct) / 100))
}

/** The most items the player can pay to make today. */
export function maxProduction(
  model: BusinessModel,
  cashCents: Cents,
  flyers: boolean,
): number {
  const spendable = cashCents - (flyers ? model.flyerCostCents : 0)
  const affordable = Math.floor(Math.max(0, spendable) / model.unitCostCents)
  return Math.min(model.maxDailyProduction, affordable)
}

/** Forces a plan into what the model and the player's cash allow. */
export function clampPlan(
  model: BusinessModel,
  start: Pick<DayStart, 'cashCents'>,
  plan: DayPlan,
): DayPlan {
  const steps = Math.round(plan.priceCents / model.priceStepCents)
  const priceCents = clamp(
    steps * model.priceStepCents,
    model.minPriceCents,
    model.ceilingPriceCents,
  )
  const flyers = plan.flyers && start.cashCents >= model.flyerCostCents
  const produce = clamp(
    Math.floor(plan.produce) || 0,
    0,
    maxProduction(model, start.cashCents, flyers),
  )
  return { priceCents, produce, flyers }
}

export function simulateDay(
  model: BusinessModel,
  start: DayStart,
  rawPlan: DayPlan,
  event: DayEvent,
): DayResult {
  const plan = clampPlan(model, start, rawPlan)

  const marketingCents = plan.flyers ? model.flyerCostCents : 0
  const productionSpendCents = plan.produce * model.unitCostCents

  const stocked = start.inventory + plan.produce
  const stockLost = Math.min(event.stockLoss, stocked)
  const available = stocked - stockLost

  const demand = demandForDay(model, plan.priceCents, plan.flyers, event)
  const sold = Math.min(available, demand)

  const revenueCents = sold * plan.priceCents
  const costOfSalesCents = sold * model.unitCostCents
  const spoilageCents = stockLost * model.unitCostCents

  return {
    day: start.day,
    eventId: event.id,
    priceCents: plan.priceCents,
    flyers: plan.flyers,

    startInventory: start.inventory,
    produced: plan.produce,
    stockLost,
    available,
    demand,
    sold,
    missedCustomers: demand - sold,
    endInventory: available - sold,

    revenueCents,
    costOfSalesCents,
    spoilageCents,
    marketingCents,
    eventCashCents: event.cashCents,
    operatingProfitCents:
      revenueCents -
      costOfSalesCents -
      spoilageCents -
      marketingCents +
      event.cashCents,

    productionSpendCents,
    cashStartCents: start.cashCents,
    cashEndCents:
      start.cashCents -
      productionSpendCents -
      marketingCents +
      revenueCents +
      event.cashCents,
  }
}

/** What the shelf is worth: each item counted at what it cost to make. */
export function inventoryValue(model: BusinessModel, items: number): Cents {
  return items * model.unitCostCents
}

/**
 * Chooses the day's surprise from the game's seed, so a saved game always
 * replays the same way. (A small integer hash, not Math.random.)
 */
export function pickEvent(seed: number, day: number): DayEvent {
  let h = (seed ^ Math.imul(day, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  h = (h ^ (h >>> 16)) >>> 0
  return EVENTS[h % EVENTS.length]
}

export function eventById(id: string): DayEvent | undefined {
  return EVENTS.find((event) => event.id === id)
}

/** One short lesson, chosen by plain rules from the day's numbers. */
export function takeaway(model: BusinessModel, result: DayResult): string {
  if (result.available === 0) {
    return 'There was nothing on the shelf to sell. Make some items before you open.'
  }
  if (result.priceCents <= model.unitCostCents) {
    return 'Your price was no higher than the cost of making each item, so sales could not earn a profit. Try a price above the making cost.'
  }
  if (result.demand === 0) {
    return 'Nobody wanted to buy at that price. A lower price brings customers back.'
  }
  if (result.missedCustomers > 0) {
    return `You sold out, and ${result.missedCustomers} more ${
      result.missedCustomers === 1 ? 'customer' : 'customers'
    } wanted one. Making more, or charging a little more, could earn extra.`
  }
  if (result.endInventory > result.sold) {
    return 'More stayed on the shelf than you sold. A lower price brings more customers, or you could make fewer tomorrow.'
  }
  if (result.operatingProfitCents < 0) {
    return 'Today cost more than it earned. Check that your price covers your costs with room to spare.'
  }
  return 'Nicely balanced: you made about as many as customers wanted. Try a slightly different price to see if profit grows.'
}
