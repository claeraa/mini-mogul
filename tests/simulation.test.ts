import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { EVENTS, PRODUCT_SHOP } from '../src/game/model.ts'
import type { DayEvent, DayPlan } from '../src/game/model.ts'
import { formatMoney, formatSigned } from '../src/game/money.ts'
import {
  clampPlan,
  demandAtPrice,
  demandForDay,
  inventoryValue,
  maxProduction,
  pickEvent,
  simulateDay,
  takeaway,
} from '../src/game/simulation.ts'
import { applyResult, newGame, parseGame } from '../src/game/state.ts'

const model = PRODUCT_SHOP

const calm: DayEvent = {
  id: 'calm',
  title: 'Calm',
  description: '',
  demandPct: 0,
  cashCents: 0,
  stockLoss: 0,
}
const withEvent = (patch: Partial<DayEvent>): DayEvent => ({ ...calm, ...patch })
const plan = (priceCents: number, produce: number, flyers = false): DayPlan => ({
  priceCents,
  produce,
  flyers,
})
const morning = (cashCents = 2000, inventory = 0, day = 1) => ({
  day,
  cashCents,
  inventory,
})

describe('customer demand', () => {
  test('the reference price brings the base number of customers', () => {
    assert.equal(demandAtPrice(model, 300), 20)
  })

  test('known points on the demand line', () => {
    assert.equal(demandAtPrice(model, 50), 30)
    assert.equal(demandAtPrice(model, 100), 28)
    assert.equal(demandAtPrice(model, 450), 14)
    assert.equal(demandAtPrice(model, 500), 12)
    assert.equal(demandAtPrice(model, 775), 1)
    assert.equal(demandAtPrice(model, 800), 0)
    assert.equal(demandAtPrice(model, 5000), 0)
  })

  test('a higher price never brings more customers', () => {
    let previous = Infinity
    for (
      let price = model.minPriceCents;
      price <= model.ceilingPriceCents;
      price += model.priceStepCents
    ) {
      const demand = demandAtPrice(model, price)
      assert.ok(Number.isInteger(demand) && demand >= 0)
      assert.ok(demand <= previous, `demand rose at ${price}`)
      previous = demand
    }
  })

  test('flyers and surprises scale demand', () => {
    assert.equal(demandForDay(model, 300, false, null), 20)
    assert.equal(demandForDay(model, 300, true, null), 25)
    assert.equal(demandForDay(model, 300, false, withEvent({ demandPct: -30 })), 14)
    assert.equal(demandForDay(model, 300, true, withEvent({ demandPct: 50 })), 35)
    assert.equal(demandForDay(model, 800, true, withEvent({ demandPct: 50 })), 0)
  })
})

describe('one day of trading', () => {
  test('selling everything that was made', () => {
    const r = simulateDay(model, morning(), plan(300, 20), calm)
    assert.equal(r.demand, 20)
    assert.equal(r.sold, 20)
    assert.equal(r.endInventory, 0)
    assert.equal(r.missedCustomers, 0)
    assert.equal(r.revenueCents, 6000)
    assert.equal(r.productionSpendCents, 2000)
    assert.equal(r.costOfSalesCents, 2000)
    assert.equal(r.operatingProfitCents, 4000)
    assert.equal(r.cashEndCents, 6000)
  })

  test('unsold items stay on the shelf and are not an expense yet', () => {
    const r = simulateDay(model, morning(), plan(500, 20), calm)
    assert.equal(r.demand, 12)
    assert.equal(r.sold, 12)
    assert.equal(r.endInventory, 8)
    assert.equal(r.revenueCents, 6000)
    assert.equal(r.costOfSalesCents, 1200)
    assert.equal(r.operatingProfitCents, 4800)
    // Cash still paid for all 20: 2000 - 2000 + 6000
    assert.equal(r.cashEndCents, 6000)
    assert.equal(inventoryValue(model, r.endInventory), 800)
  })

  test('selling out leaves customers waiting', () => {
    const r = simulateDay(model, morning(), plan(300, 5), calm)
    assert.equal(r.sold, 5)
    assert.equal(r.missedCustomers, 15)
    assert.equal(r.endInventory, 0)
    assert.equal(r.revenueCents, 1500)
    assert.equal(r.operatingProfitCents, 1000)
    assert.equal(r.cashEndCents, 3000)
  })

  test("yesterday's leftovers sell without new production", () => {
    const r = simulateDay(model, morning(500, 8, 2), plan(300, 0), calm)
    assert.equal(r.available, 8)
    assert.equal(r.sold, 8)
    assert.equal(r.productionSpendCents, 0)
    assert.equal(r.revenueCents, 2400)
    assert.equal(r.costOfSalesCents, 800)
    assert.equal(r.operatingProfitCents, 1600)
    assert.equal(r.cashEndCents, 2900)
  })

  test('pricing below cost makes a loss on every sale', () => {
    const r = simulateDay(model, morning(), plan(50, 20), calm)
    assert.equal(r.sold, 20)
    assert.equal(r.revenueCents, 1000)
    assert.equal(r.operatingProfitCents, -1000)
    assert.equal(r.cashEndCents, 1000)
  })

  test('flyers cost money and bring more customers', () => {
    const r = simulateDay(model, morning(), plan(300, 17, true), calm)
    assert.equal(r.marketingCents, 300)
    assert.equal(r.produced, 17)
    assert.equal(r.demand, 25)
    assert.equal(r.sold, 17)
    assert.equal(r.revenueCents, 5100)
    assert.equal(r.operatingProfitCents, 5100 - 1700 - 300)
    assert.equal(r.cashEndCents, 2000 - 1700 - 300 + 5100)
  })

  test('a cash surprise changes profit and cash by the same amount', () => {
    const gain = simulateDay(model, morning(), plan(300, 20), withEvent({ cashCents: 300 }))
    assert.equal(gain.operatingProfitCents, 4300)
    assert.equal(gain.cashEndCents, 6300)
    const cost = simulateDay(model, morning(), plan(300, 20), withEvent({ cashCents: -200 }))
    assert.equal(cost.operatingProfitCents, 3800)
    assert.equal(cost.cashEndCents, 5800)
  })

  test('lost stock is an expense and cannot be sold', () => {
    const r = simulateDay(model, morning(), plan(300, 20), withEvent({ stockLoss: 3 }))
    assert.equal(r.stockLost, 3)
    assert.equal(r.available, 17)
    assert.equal(r.sold, 17)
    assert.equal(r.missedCustomers, 3)
    assert.equal(r.spoilageCents, 300)
    assert.equal(r.revenueCents, 5100)
    assert.equal(r.operatingProfitCents, 5100 - 1700 - 300)
    assert.equal(r.cashEndCents, 2000 - 2000 + 5100)
  })

  test('stock loss never takes more than is on the shelf', () => {
    const r = simulateDay(model, morning(), plan(300, 2), withEvent({ stockLoss: 3 }))
    assert.equal(r.stockLost, 2)
    assert.equal(r.available, 0)
    assert.equal(r.sold, 0)
    assert.equal(r.endInventory, 0)
    assert.equal(r.operatingProfitCents, -200)
  })
})

describe('plans are limited by cash and the model', () => {
  test('cannot make more than cash allows', () => {
    assert.equal(maxProduction(model, 2000, false), 20)
    assert.equal(maxProduction(model, 2000, true), 17)
    assert.equal(maxProduction(model, 99, false), 0)
    assert.equal(maxProduction(model, -500, false), 0)
    assert.equal(maxProduction(model, 1_000_000, false), model.maxDailyProduction)
    const r = simulateDay(model, morning(700), plan(300, 50), calm)
    assert.equal(r.produced, 7)
    assert.equal(r.productionSpendCents, 700)
  })

  test('flyers are dropped when unaffordable', () => {
    const fixed = clampPlan(model, { cashCents: 250 }, plan(300, 5, true))
    assert.deepEqual(fixed, { priceCents: 300, produce: 2, flyers: false })
  })

  test('prices snap to the step and stay in range', () => {
    assert.equal(clampPlan(model, { cashCents: 2000 }, plan(310, 1)).priceCents, 300)
    assert.equal(clampPlan(model, { cashCents: 2000 }, plan(0, 1)).priceCents, 50)
    assert.equal(clampPlan(model, { cashCents: 2000 }, plan(99999, 1)).priceCents, 800)
    assert.equal(clampPlan(model, { cashCents: 2000 }, plan(300, -4)).produce, 0)
    assert.equal(clampPlan(model, { cashCents: 2000 }, plan(300, NaN)).produce, 0)
  })
})

describe('the books always balance', () => {
  test('cash plus shelf value changes by exactly the operating profit', () => {
    // A tiny fixed-sequence generator so the test itself is deterministic.
    let n = 12345
    const next = (limit: number) => {
      n = (Math.imul(n, 1103515245) + 12345) >>> 0
      return n % limit
    }
    let game = newGame(model, 42)
    for (let i = 0; i < 2000; i++) {
      const event = EVENTS[next(EVENTS.length)]
      const r = simulateDay(
        model,
        game,
        plan(50 + 25 * next(31), next(70), next(3) === 0),
        event,
      )
      for (const value of Object.values(r)) {
        if (typeof value === 'number') assert.ok(Number.isInteger(value))
      }
      assert.ok(r.sold >= 0 && r.sold <= r.demand && r.sold <= r.available)
      assert.ok(r.endInventory >= 0 && r.stockLost >= 0 && r.missedCustomers >= 0)
      assert.equal(
        r.endInventory,
        r.startInventory + r.produced - r.stockLost - r.sold,
      )
      const wealthBefore = r.cashStartCents + inventoryValue(model, r.startInventory)
      const wealthAfter = r.cashEndCents + inventoryValue(model, r.endInventory)
      assert.equal(wealthAfter - wealthBefore, r.operatingProfitCents)

      const after = applyResult(game, r)
      assert.equal(after.day, game.day + 1)
      assert.equal(after.cashCents, r.cashEndCents)
      assert.equal(after.inventory, r.endInventory)
      // Keep the run going if a string of bad days empties the till.
      game =
        after.cashCents < model.unitCostCents && after.inventory === 0
          ? newGame(model, i)
          : after
    }
  })
})

describe('surprises', () => {
  test('the same seed and day always give the same surprise', () => {
    for (let day = 1; day <= 50; day++) {
      assert.equal(pickEvent(987654, day).id, pickEvent(987654, day).id)
      assert.ok(EVENTS.includes(pickEvent(987654, day)))
    }
  })

  test('every surprise can turn up', () => {
    const seen = new Set<string>()
    for (let day = 1; day <= 400; day++) seen.add(pickEvent(2024, day).id)
    assert.equal(seen.size, EVENTS.length)
  })
})

describe('saved games', () => {
  test('a new game starts on day one with the starting cash', () => {
    const game = newGame(model, 7)
    assert.equal(game.day, 1)
    assert.equal(game.cashCents, 2000)
    assert.equal(game.inventory, 0)
    assert.deepEqual(parseGame(JSON.parse(JSON.stringify(game))), game)
  })

  test('history keeps only recent days', () => {
    let game = newGame(model, 7)
    for (let i = 0; i < 30; i++) {
      game = applyResult(game, simulateDay(model, game, plan(300, 5), calm))
    }
    assert.equal(game.day, 31)
    assert.equal(game.history.length, 14)
    assert.equal(game.history.at(-1)?.day, 30)
  })

  test('broken saves are rejected', () => {
    assert.equal(parseGame(null), null)
    assert.equal(parseGame({ version: 2 }), null)
    assert.equal(parseGame({ ...newGame(model, 1), cashCents: 'lots' }), null)
    assert.equal(parseGame({ ...newGame(model, 1), inventory: -1 }), null)
  })
})

describe('lessons and money text', () => {
  test('the lesson matches what happened', () => {
    const soldOut = simulateDay(model, morning(), plan(300, 5), calm)
    assert.match(takeaway(model, soldOut), /sold out, and 15 more customers/)
    const leftovers = simulateDay(model, morning(), plan(700, 20), calm)
    assert.match(takeaway(model, leftovers), /stayed on the shelf/)
    const cheap = simulateDay(model, morning(), plan(100, 20), calm)
    assert.match(takeaway(model, cheap), /no higher than the cost/)
    const empty = simulateDay(model, morning(), plan(300, 0), calm)
    assert.match(takeaway(model, empty), /nothing on the shelf/)
    const balanced = simulateDay(model, morning(), plan(300, 20), calm)
    assert.match(takeaway(model, balanced), /Nicely balanced/)
  })

  test('money formatting', () => {
    assert.equal(formatMoney(0), '$0.00')
    assert.equal(formatMoney(5), '$0.05')
    assert.equal(formatMoney(1250), '$12.50')
    assert.equal(formatMoney(-300), '-$3.00')
    assert.equal(formatSigned(300), '+$3.00')
    assert.equal(formatSigned(-300), '-$3.00')
    assert.equal(formatSigned(0), '$0.00')
  })
})
