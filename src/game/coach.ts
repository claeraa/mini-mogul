import { EVENTS } from './model.ts'
import type { BusinessModel, DayResult } from './model.ts'
import { formatMoney, formatSigned } from './money.ts'
import { summarizeDay } from './report.ts'
import { eventById, simulateDay, takeaway } from './simulation.ts'

/**
 * Everything the after-day coach works from. The numbers all come from the
 * financial engine; the coach (AI or built-in) only puts them into words.
 */

export type DayOutcome = 'profit' | 'loss' | 'break-even' | 'no-sales'

export function dayOutcome(r: DayResult): DayOutcome {
  if (r.sold === 0) return 'no-sales'
  if (r.operatingProfitCents > 0) return 'profit'
  if (r.operatingProfitCents < 0) return 'loss'
  return 'break-even'
}

export type CoachFacts = {
  outcome: DayOutcome
  /** Plain-language facts, one per line, with the engine's exact figures. */
  lines: string[]
  /** Every number the coach may mention, as written. */
  allowed: Set<string>
}

const isInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value)

/**
 * Rebuilds the day from its own inputs and accepts it only if the engine
 * produces exactly the same result. A report that has been altered, or that
 * the engine could not have produced, is rejected.
 */
export function verifyDayResult(model: BusinessModel, value: unknown): DayResult | null {
  if (typeof value !== 'object' || value === null) return null
  const r = value as Partial<DayResult>
  if (
    !isInt(r.day) || r.day < 1 || r.day > 100000 ||
    !isInt(r.priceCents) || !isInt(r.produced) || !isInt(r.startInventory) ||
    !isInt(r.cashStartCents) || typeof r.flyers !== 'boolean' ||
    typeof r.eventId !== 'string' ||
    r.startInventory < 0 || r.produced < 0 ||
    Math.abs(r.cashStartCents) > 100_000_000 || r.startInventory > 1_000_000
  ) {
    return null
  }
  const event = EVENTS.find((e) => e.id === r.eventId)
  if (!event) return null

  const replay = simulateDay(
    model,
    { day: r.day, cashCents: r.cashStartCents, inventory: r.startInventory },
    { priceCents: r.priceCents, produce: r.produced, flyers: r.flyers },
    event,
  )
  const keys = Object.keys(replay) as (keyof DayResult)[]
  return keys.every((key) => replay[key] === r[key]) ? replay : null
}

export function coachFacts(model: BusinessModel, r: DayResult): CoachFacts {
  const s = summarizeDay(model, r)
  const event = eventById(r.eventId)
  const allowed = new Set<string>()
  const money = (cents: number) => {
    const text = formatMoney(Math.abs(cents))
    allowed.add(text)
    // Also as "4.50" and, for whole amounts, "$4" and "4".
    allowed.add(text.slice(1))
    if (text.endsWith('.00')) {
      allowed.add(text.slice(0, -3))
      allowed.add(text.slice(1, -3))
    }
    return formatMoney(cents)
  }
  const count = (n: number) => {
    allowed.add(String(Math.abs(n)))
    return String(n)
  }

  const lines = [
    `Day ${count(r.day)}. Tomorrow is day ${count(r.day + 1)}.`,
    `Selling price: ${money(r.priceCents)} each. Each item costs ${money(model.unitCostCents)} to make.`,
    `Shelf this morning: ${count(r.startInventory)}. Made today: ${count(r.produced)}. On the shelf at opening: ${count(r.available)}.`,
    `Customers who wanted to buy: ${count(r.demand)}. Sold: ${count(r.sold)}. Customers who left empty-handed: ${count(r.missedCustomers)}.`,
    `Left on the shelf for tomorrow: ${count(r.endInventory)} items worth ${money(s.inventoryEndValueCents)}.`,
    `Revenue: ${money(s.revenueTotalCents)}. Expenses: ${money(s.expensesTotalCents)}.`,
    `${s.profitCents < 0 ? 'Loss' : 'Profit'} today: ${money(Math.abs(s.profitCents))}.`,
    `Cash at start: ${money(r.cashStartCents)}. Cash at end: ${money(r.cashEndCents)}. Cash change: ${
      s.cashChangeCents < 0 ? 'down' : 'up'
    } ${money(Math.abs(s.cashChangeCents))}.`,
    `Flyers handed out: ${r.flyers ? `yes, costing ${money(r.marketingCents)}` : 'no'}. Flyers cost ${money(model.flyerCostCents)} and bring about ${count(model.flyerDemandPct)}% more customers.`,
  ]
  allowed.add(`${model.flyerDemandPct}%`)
  if (event) {
    lines.push(`Today's surprise: ${event.title}. ${event.description}`)
    if (event.demandPct !== 0) {
      allowed.add(String(Math.abs(event.demandPct)))
      allowed.add(`${Math.abs(event.demandPct)}%`)
    }
    if (r.stockLost > 0) lines.push(`Items lost to the surprise: ${count(r.stockLost)}.`)
    if (r.eventCashCents !== 0) {
      lines.push(
        `The surprise ${r.eventCashCents > 0 ? 'added' : 'cost'} ${money(Math.abs(r.eventCashCents))}.`,
      )
    }
  }

  // The coach may suggest any price on the dial or any amount to make.
  for (
    let price = model.minPriceCents;
    price <= model.ceilingPriceCents;
    price += model.priceStepCents
  ) {
    money(price)
  }
  for (let n = 0; n <= model.maxDailyProduction; n += 1) allowed.add(String(n))

  return { outcome: dayOutcome(r), lines, allowed }
}

/** The built-in coach, used whenever the AI is unavailable or its reply fails a check. */
export function fallbackCoaching(model: BusinessModel, r: DayResult) {
  const outcome = dayOutcome(r)
  const profit = r.operatingProfitCents

  const encouragement = {
    'no-sales':
      r.available === 0
        ? 'Every shop owner forgets something once. Today showed that a shop needs something on the shelf before it opens.'
        : 'A quiet day is not a failure. You just found out what price is too high for your customers, and that is useful to know.',
    profit: `Well done! You earned ${formatMoney(profit)} more than you spent on what you sold. That is a real profit.`,
    loss: `Today cost ${formatMoney(-profit)} more than it earned, and that happens to every business. What matters is what you try next.`,
    'break-even':
      'You covered your costs exactly today. That means you are right on the edge of making a profit.',
  }[outcome]

  const challenge =
    outcome === 'no-sales'
      ? 'Challenge: make your very first sale tomorrow.'
      : r.missedCustomers > 0
        ? 'Challenge: serve every customer tomorrow without running out.'
        : r.endInventory > r.sold
          ? 'Challenge: sell what is already on your shelf before making lots more.'
          : profit <= 0
            ? 'Challenge: finish tomorrow with a profit.'
            : `Challenge: beat today's profit of ${formatSigned(profit)}.`

  return { encouragement, suggestion: takeaway(model, r), challenge }
}
