import type { DayTruth } from '../ai/schema.ts'
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
  /** The facts no coaching may contradict. */
  truth: DayTruth
}

/** The engine's own reading of the day, in the terms coaching is checked against. */
export function dayTruth(r: DayResult): DayTruth {
  return {
    outcome: dayOutcome(r),
    ranOut: r.missedCustomers > 0,
    leftovers: r.endInventory > 0,
  }
}

/**
 * The day in plain statements, worked out from the result. Given to the AI
 * coach so it explains what happened instead of guessing; every statement
 * here is also what its reply is checked against.
 */
function readingLines(model: BusinessModel, r: DayResult, cashChangeCents: number): string[] {
  const lines: string[] = []
  if (r.available === 0) {
    lines.push('Stock: there was nothing on the shelf to sell.')
  } else if (r.missedCustomers > 0) {
    lines.push(
      `Stock: SOLD OUT TOO EARLY. All ${r.sold} sold, the shelf was empty, and ${r.missedCustomers} more ${
        r.missedCustomers === 1 ? 'customer' : 'customers'
      } wanted one but could not buy. The player did NOT have enough to sell. Those were missed sales.`,
    )
  } else if (r.endInventory === 0) {
    lines.push('Stock: just enough. Every customer who came bought one and nothing was left over.')
  } else {
    lines.push(
      `Stock: NOT sold out. Every customer who wanted one got one, and ${r.endInventory} ${
        r.endInventory === 1 ? 'was' : 'were'
      } left over for tomorrow.${r.endInventory > r.sold ? ' More was left than was sold: too many were made for this price.' : ''}`,
    )
  }
  if (r.sold === 0 && r.available > 0) {
    lines.push(r.demand === 0 ? 'Price: nobody wanted to buy at this price.' : 'Sales: nothing was sold.')
  } else if (r.priceCents <= model.unitCostCents) {
    lines.push('Price: the price did not cover the cost of making each item, so each sale earned nothing or lost money.')
  } else {
    lines.push('Price: each sale earned more than the item cost to make.')
  }
  if (r.operatingProfitCents > 0 && cashChangeCents < 0) {
    lines.push('Cash: there was a profit, but cash went down, because money was spent making items that are still on the shelf.')
  } else if (r.operatingProfitCents <= 0 && cashChangeCents > 0) {
    lines.push('Cash: cash went up without a profit, because items made on an earlier day were sold today.')
  }
  return lines
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

  lines.push(...readingLines(model, r, s.cashChangeCents))

  return { outcome: dayOutcome(r), lines, allowed, truth: dayTruth(r) }
}

/**
 * One simple thing to try tomorrow, chosen by what actually caused today's
 * result. A lower price is suggested only when the price really was the
 * problem; a day spoiled by flyers, a surprise or a short shelf gets advice
 * about that instead.
 */
export function nextStep(model: BusinessModel, r: DayResult): string {
  const profit = r.operatingProfitCents
  if (profit > 0) return takeaway(model, r)

  if (r.available === 0) return 'Make a few before you open tomorrow.'
  if (r.priceCents <= model.unitCostCents) {
    return `Each one costs ${formatMoney(model.unitCostCents)} to make. Pick a price above that.`
  }
  if (r.demand === 0) return 'That price was too high for today. Try a lower one.'

  // From here on the price itself earned money on every sale, so something
  // else used it up.
  const extras = r.marketingCents + r.spoilageCents - Math.min(0, r.eventCashCents)
  const biggest = Math.max(r.marketingCents, r.spoilageCents, -r.eventCashCents)
  if (extras > 0 && biggest === r.marketingCents) {
    return r.missedCustomers > 0
      ? 'Flyers brought more customers than you could serve. Make more on a flyer day.'
      : 'Flyers cost more than they brought in today. Try a day without them.'
  }
  if (extras > 0 && biggest === -r.eventCashCents) {
    return 'The surprise cost you money today. Your plan was fine, so try it again.'
  }
  if (extras > 0 && biggest === r.spoilageCents) {
    return 'Some items were lost today. That was bad luck, so try your plan again.'
  }
  if (r.missedCustomers > 0) return 'You sold everything! Make more so more customers can buy.'
  return 'Open "See how it adds up" to find the biggest cost, then change one thing.'
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
    loss: `Today cost ${formatMoney(-profit)} more than it earned. That happens to every shop, and tomorrow is a new day!`,
    'break-even':
      'You covered your costs exactly today. That means you are right on the edge of making a profit.',
  }[outcome]

  return { encouragement, suggestion: nextStep(model, r), challenge: mission(model, r) }
}

/**
 * One short goal for tomorrow, chosen from what actually happened. Selling
 * out is never the goal: when customers missed out, the mission is to have
 * more ready than today, within what the till can pay for. It never promises
 * how many customers will come tomorrow.
 */
export function mission(model: BusinessModel, r: DayResult): string {
  if (r.sold === 0) return 'Challenge: make your first sale tomorrow.'
  // On a day without a profit the goal is simply a profit: "serve everyone"
  // would be the wrong aim if each sale was losing money.
  if (r.operatingProfitCents <= 0) return 'Challenge: make a profit tomorrow.'
  if (r.missedCustomers > 0) {
    // Today's crowd is a clue, not a promise: tomorrow may bring more or
    // fewer. So the goal is a step up from what was ready today, not an
    // exact number of customers to plan for.
    const affordable = Math.floor(r.cashEndCents / model.unitCostCents) + r.endInventory
    // Already making all the shop can: more customers than items means the
    // price has room to rise.
    if (r.available >= model.maxDailyProduction) return 'Challenge: try a slightly higher price tomorrow.'
    const canStepUp = affordable > r.available
    return canStepUp
      ? `Challenge: have more than ${r.available} ready tomorrow.`
      : 'Challenge: make as many as you can afford.'
  }
  if (r.endInventory > r.sold) return 'Challenge: sell what is on your shelf first.'
  if (r.endInventory > 0) {
    return `Challenge: sell the ${r.endInventory} left on your shelf.`
  }
  return `Challenge: beat today's profit of ${formatSigned(r.operatingProfitCents)}.`

}
