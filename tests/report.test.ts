import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { EVENTS, PRODUCT_SHOP } from '../src/game/model.ts'
import type { DayEvent } from '../src/game/model.ts'
import { summarizeDay } from '../src/game/report.ts'
import { simulateDay } from '../src/game/simulation.ts'

const model = PRODUCT_SHOP
const event = (id: string): DayEvent => EVENTS.find((e) => e.id === id)!

describe('day report summary', () => {
  test('unsold items lower cash but not profit', () => {
    // Roadworks: 20% fewer customers. $4.50 -> 14 want one, x0.8 = 11.
    const r = simulateDay(model, { day: 1, cashCents: 2000, inventory: 0 }, { priceCents: 450, produce: 14, flyers: false }, event('roadworks'))
    const s = summarizeDay(model, r)
    assert.equal(r.sold, 11)
    assert.equal(s.revenueTotalCents, 4950)
    assert.equal(s.expensesTotalCents, 1100)
    assert.equal(s.profitCents, 3850)
    assert.equal(s.cashOutTotalCents, 1400)
    assert.equal(s.cashChangeCents, 3550)
    assert.equal(s.inventoryEndValueCents, 300)
    assert.equal(s.inventoryChangeCents, 300)
    assert.equal(s.inventoryChangeItems, 3)
    // The gap between profit and cash is exactly the stock still on the shelf.
    assert.equal(s.profitCents - s.cashChangeCents, 300)
  })

  test('selling earlier stock raises cash more than profit', () => {
    const r = simulateDay(model, { day: 2, cashCents: 1000, inventory: 10 }, { priceCents: 300, produce: 0, flyers: false }, event('tip'))
    const s = summarizeDay(model, r)
    assert.equal(r.sold, 10)
    assert.equal(s.cashOutTotalCents, 0)
    assert.equal(s.cashChangeCents, 3300)
    assert.equal(s.profitCents, 2300)
    assert.equal(s.inventoryChangeCents, -1000)
    assert.deepEqual(s.revenue.map((l) => l.id), ['sales', 'bonus'])
  })

  test('flyers, losses and surprise costs are listed as expenses', () => {
    const spill = summarizeDay(model, simulateDay(model, { day: 1, cashCents: 2000, inventory: 0 }, { priceCents: 300, produce: 10, flyers: true }, event('spill')))
    assert.deepEqual(spill.expenses.map((l) => l.id), ['cost-of-sales', 'lost', 'flyers'])
    assert.deepEqual(spill.cashOut.map((l) => l.id), ['production', 'flyers'])
    const repair = summarizeDay(model, simulateDay(model, { day: 1, cashCents: 2000, inventory: 0 }, { priceCents: 300, produce: 10, flyers: false }, event('repair')))
    assert.ok(repair.expenses.some((l) => l.id === 'surprise-cost' && l.cents === 200))
    assert.ok(repair.cashOut.some((l) => l.id === 'surprise-cost' && l.cents === 200))
  })

  test('the three views always agree with the simulation', () => {
    let seed = 7
    const next = (n: number) => {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
      return seed % n
    }
    for (let i = 0; i < 2000; i += 1) {
      const r = simulateDay(
        model,
        { day: i + 1, cashCents: next(6000), inventory: next(30) },
        { priceCents: 50 + 25 * next(31), produce: next(61), flyers: next(2) === 1 },
        EVENTS[next(EVENTS.length)],
      )
      const s = summarizeDay(model, r)
      assert.equal(s.profitCents, r.operatingProfitCents)
      assert.equal(s.cashChangeCents, r.cashEndCents - r.cashStartCents)
      assert.equal(s.profitCents - s.cashChangeCents, s.inventoryChangeCents)
      for (const line of [...s.revenue, ...s.expenses, ...s.cashIn, ...s.cashOut]) {
        assert.ok(Number.isInteger(line.cents) && line.cents >= 0)
      }
    }
  })
})
