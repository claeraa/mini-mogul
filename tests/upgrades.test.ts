import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { parseCoaching } from '../src/ai/schema.ts'
import { coachFacts, fallbackCoaching, mission, verifyDayResult } from '../src/game/coach.ts'
import { EVENTS, PRODUCT_SHOP } from '../src/game/model.ts'
import type { DayPlan } from '../src/game/model.ts'
import { summarizeDay } from '../src/game/report.ts'
import { clampPlan, demandForDay, inventoryValue, maxProduction, simulateDay } from '../src/game/simulation.ts'
import { applyResult, newGame, parseGame } from '../src/game/state.ts'
import type { GameState } from '../src/game/state.ts'
import {
  CAMPAIGN,
  MAX_UPGRADE_LEVEL,
  UPGRADES,
  buyCampaign,
  buyUpgrade,
  checkCampaign,
  checkUpgrade,
  effectiveModel,
  extrasOf,
  makeLimit,
  modelForGame,
  modelForResult,
  nextUpgrade,
  simulateShopDay,
} from '../src/game/upgrades.ts'
import { generateWorldBlueprint } from '../src/world/blueprint.ts'
import { CAMPAIGN_NAME, productionUpgradeName, shopUpgradeName } from '../src/world/upgradeNames.ts'
import { emptyStore, findWorld, loadStore, newWorld, putWorld, saveStore, updateWorld } from '../src/worlds/store.ts'
import type { KeyValue, Shop } from '../src/worlds/store.ts'

const base = PRODUCT_SHOP
const event = (id: string) => EVENTS.find((e) => e.id === id)!
const rich = (cashCents: number, patch: Partial<GameState> = {}): GameState => ({ ...newGame(base, 5), cashCents, ...patch })
const plan = (priceCents: number, produce: number, flyers = false): DayPlan => ({ priceCents, produce, flyers })
const day = (game: GameState, p: DayPlan, eventId = 'tip') =>
  simulateShopDay(base, game, clampPlan(modelForGame(base, game), game, p), event(eventId))

describe('buying upgrades', () => {
  test('a purchase lowers cash by exactly its cost and raises the level by one', () => {
    const before = rich(5000)
    const after = buyUpgrade(before, 'production')
    assert.equal(after.cashCents, 5000 - UPGRADES.production.costsCents[0])
    assert.equal(extrasOf(after).upgrades.production, 1)
    assert.equal(extrasOf(after).upgrades.shop, 0)
    assert.equal(extrasOf(after).investedTodayCents, 1500)
    assert.equal(extrasOf(after).investedTotalCents, 1500)
    // Nothing else moved, and the original was not changed.
    assert.equal(after.inventory, before.inventory)
    assert.equal(after.day, before.day)
    assert.equal(before.cashCents, 5000)
  })

  test('the offer shows the cost and exactly what changes', () => {
    assert.deepEqual(nextUpgrade('production', { production: 0, shop: 0 }), {
      id: 'production', level: 0, nextLevel: 1, costCents: 1500, from: 20, to: 30,
    })
    assert.deepEqual(nextUpgrade('shop', { production: 0, shop: 1 }), {
      id: 'shop', level: 1, nextLevel: 2, costCents: 4000, from: 15, to: 30,
    })
    assert.equal(nextUpgrade('shop', { production: 0, shop: MAX_UPGRADE_LEVEL }), null)
  })

  test('a shop cannot buy what it cannot afford', () => {
    const poor = rich(1499)
    assert.deepEqual(checkUpgrade(poor, 'production'), { ok: false, reason: 'cash', costCents: 1500, shortCents: 1 })
    assert.equal(buyUpgrade(poor, 'production'), poor)
    assert.equal(buyUpgrade(rich(0), 'shop').cashCents, 0)
    // Exactly enough is enough.
    assert.equal(buyUpgrade(rich(1500), 'production').cashCents, 0)
    assert.deepEqual(checkCampaign(rich(599)), { ok: false, reason: 'cash', costCents: 600, shortCents: 1 })
    assert.equal(buyCampaign(rich(599)).cashCents, 599)
  })

  test('cash never goes below zero, whatever is bought in whatever order', () => {
    let game = rich(4000)
    for (const id of ['production', 'shop', 'production', 'shop', 'production', 'shop'] as const) {
      game = buyCampaign(buyUpgrade(game, id))
      assert.ok(game.cashCents >= 0)
    }
    assert.ok(extrasOf(game).investedTotalCents <= 4000)
  })

  test('upgrades stop at the top level', () => {
    let game = rich(100000)
    for (let i = 0; i < 6; i += 1) game = buyUpgrade(game, 'production')
    assert.equal(extrasOf(game).upgrades.production, MAX_UPGRADE_LEVEL)
    assert.equal(game.cashCents, 100000 - 1500 - 3000 - 5000)
    assert.deepEqual(checkUpgrade(game, 'production'), { ok: false, reason: 'maxed', costCents: 0, shortCents: 0 })
  })

  test('only one campaign runs at a time, and it is never charged twice', () => {
    const once = buyCampaign(rich(5000))
    assert.equal(once.cashCents, 4400)
    assert.equal(extrasOf(once).campaignDaysLeft, CAMPAIGN.days)
    assert.equal(checkCampaign(once).ok, false)
    assert.equal(buyCampaign(once), once)
  })
})

describe('upgrades change the simulation, not just the pictures', () => {
  test('a production upgrade raises how many can be made in a day', () => {
    const start = rich(10000)
    assert.equal(maxProduction(modelForGame(base, start), start.cashCents, false), 20)
    const better = buyUpgrade(start, 'production')
    assert.equal(maxProduction(modelForGame(base, better), better.cashCents, false), 30)
    assert.equal(day(start, plan(300, 60)).produced, 20)
    assert.equal(day(better, plan(300, 60)).produced, 30)
  })

  test('a shop improvement brings more customers at the same price', () => {
    const start = rich(10000)
    const better = buyUpgrade(start, 'shop')
    const before = demandForDay(modelForGame(base, start), 300, false, null)
    const after = demandForDay(modelForGame(base, better), 300, false, null)
    assert.equal(before, 20)
    assert.equal(after, 23)
    assert.ok(day(better, plan(300, 20)).demand > day(start, plan(300, 20)).demand)
  })

  test('a campaign brings measurably more customers for exactly three days', () => {
    let game = buyCampaign(rich(10000))
    const demands: number[] = []
    for (let i = 0; i < 5; i += 1) {
      const r = day(game, plan(300, 20))
      demands.push(r.demand)
      assert.equal(r.campaignActive, i < CAMPAIGN.days)
      game = applyResult(game, r)
    }
    assert.deepEqual(demands, [24, 24, 24, 20, 20])
    assert.equal(extrasOf(game).campaignDaysLeft, 0)
    // It can be bought again once it has run out.
    assert.equal(checkCampaign(game).ok, true)
  })

  test('the base formulas are untouched: no upgrades means the same day as before', () => {
    const game = rich(2000)
    for (const e of EVENTS) {
      for (const p of [plan(300, 10), plan(125, 20, true), plan(775, 3)]) {
        const now = simulateShopDay(base, game, p, e)
        const old = simulateDay(base, game, p, e)
        for (const key of Object.keys(old) as (keyof typeof old)[]) assert.equal(now[key], old[key], key)
      }
    }
    assert.deepEqual(effectiveModel(base, { production: MAX_UPGRADE_LEVEL, shop: 0 }, false), base)
  })

  test('an upgrade does not guarantee a profit', () => {
    // A bigger workshop, then a price below the making cost.
    const r = day(buyUpgrade(rich(4000), 'production'), plan(50, 25), 'sunny')
    assert.ok(r.operatingProfitCents < 0)
    // The best shop front, at a price nobody will pay.
    const empty = day(buyUpgrade(buyUpgrade(rich(9000), 'shop'), 'shop'), plan(base.ceilingPriceCents, 10), 'sunny')
    assert.equal(empty.sold, 0)
  })
})

describe('the books stay right', () => {
  const invariant = (game: GameState, p: DayPlan, eventId: string) => {
    const r = day(game, p, eventId)
    const s = summarizeDay(base, r)
    // Profit is revenue minus expenses, and matches the engine.
    assert.equal(s.profitCents, r.operatingProfitCents)
    // The cash book adds up to the real change in cash.
    assert.equal(s.cashChangeCents, r.cashEndCents - r.cashStartCents)
    // Cash + shelf + upgrades bought only ever changes by the day's profit.
    assert.equal(s.cashChangeCents + s.inventoryChangeCents + s.investmentCents, s.profitCents)
    assert.equal(r.cashEndCents, applyResult(game, r).cashCents)
    return { r, s }
  }

  test('a lasting upgrade lowers cash, not profit', () => {
    const start = rich(6000)
    const plain = invariant(start, plan(300, 10), 'tip')
    const upgraded = invariant(buyUpgrade(start, 'production'), plan(300, 10), 'tip')
    assert.equal(upgraded.r.operatingProfitCents, plain.r.operatingProfitCents)
    assert.equal(upgraded.r.cashEndCents, plain.r.cashEndCents - 1500)
    assert.equal(upgraded.r.cashStartCents, 6000)
    assert.equal(upgraded.s.investmentCents, 1500)
    assert.ok(upgraded.s.cashOut.some((line) => line.id === 'upgrades' && line.cents === 1500))
    assert.equal(upgraded.s.expenses.some((line) => line.id === 'upgrades'), false)
  })

  test('a campaign is an expense on the day it is bought, once', () => {
    const start = rich(6000)
    const game = buyCampaign(start)
    const first = invariant(game, plan(300, 20), 'tip')
    assert.equal(first.r.campaignCents, 600)
    assert.equal(first.s.expenses.filter((line) => line.id === 'campaign').length, 1)
    assert.equal(first.s.cashOut.filter((line) => line.id === 'campaign').length, 1)
    const second = invariant(applyResult(game, first.r), plan(300, 20), 'tip')
    assert.equal(second.r.campaignCents, 0)
    assert.equal(second.s.expenses.some((line) => line.id === 'campaign'), false)
    // Same sales on both days: the first is poorer by exactly the campaign.
    assert.equal(first.r.operatingProfitCents, second.r.operatingProfitCents - 600)
  })

  test('the books balance on every kind of day, with every mix of purchases', () => {
    let checked = 0
    for (const e of EVENTS) {
      for (const buys of [[], ['production'], ['shop'], ['production', 'shop', 'campaign'], ['campaign'], ['production', 'production']]) {
        for (const p of [plan(300, 10), plan(100, 30), plan(525, 15, true), plan(800, 5)]) {
          let game = rich(12000, { inventory: 4 })
          for (const buy of buys) game = buy === 'campaign' ? buyCampaign(game) : buyUpgrade(game, buy as 'production')
          const { r } = invariant(game, p, e.id)
          // Inventory is still counted once, at cost.
          assert.equal(inventoryValue(base, r.endInventory), r.endInventory * base.unitCostCents)
          checked += 1
        }
      }
    }
    assert.ok(checked > 150)
  })

  test('purchases are reported on the day they are made and never again', () => {
    let game = buyUpgrade(rich(8000), 'shop')
    const first = day(game, plan(300, 10))
    assert.equal(first.investmentCents, 2000)
    game = applyResult(game, first)
    assert.equal(extrasOf(game).investedTodayCents, 0)
    assert.equal(extrasOf(game).investedTotalCents, 2000)
    assert.equal(extrasOf(game).upgrades.shop, 1) // the upgrade itself is kept
    assert.equal(day(game, plan(300, 10)).investmentCents, 0)
  })
})

describe('the coach and the checks understand upgrades', () => {
  test('an upgraded day is verified by re-simulation; a faked one is refused', () => {
    const game = buyCampaign(buyUpgrade(buyUpgrade(rich(9000), 'production'), 'shop'))
    const r = day(game, plan(300, 28))
    assert.deepEqual(verifyDayResult(base, JSON.parse(JSON.stringify(r))), r)
    assert.equal(verifyDayResult(base, { ...r, productionLevel: 9 }), null)
    assert.equal(verifyDayResult(base, { ...r, shopLevel: 2 }), null) // would have brought more customers
    assert.equal(verifyDayResult(base, { ...r, investmentCents: 0 }), null)
    assert.equal(verifyDayResult(base, { ...r, campaignCents: 100 }), null)
    assert.equal(verifyDayResult(base, { ...r, operatingProfitCents: r.operatingProfitCents + 600 }), null)
    // Making more than the workshop allows is impossible.
    assert.equal(verifyDayResult(base, { ...day(rich(9000), plan(300, 20)), produced: 40 }), null)
  })

  test('the coach is told an upgrade is not an expense, and may mention its cost', () => {
    const r = day(buyUpgrade(rich(6000), 'production'), plan(300, 10))
    const facts = coachFacts(modelForResult(base, r), r)
    const text = facts.lines.join('\n')
    assert.match(text, /\$15\.00 of cash was spent this morning on lasting shop upgrades/)
    assert.match(text, /NOT an expense/)
    assert.ok(facts.allowed.has('$15.00'))
    const coach = fallbackCoaching(modelForResult(base, r), r)
    assert.ok(parseCoaching(coach, facts.allowed, facts.truth))
  })

  test('selling out at full capacity points to more room or a higher price', () => {
    const r = day(rich(9000), plan(200, 20), 'review')
    assert.ok(r.missedCustomers > 0 && r.available === 20)
    assert.equal(mission(modelForResult(base, r), r), 'Challenge: make more room, or raise the price.')
  })
})

describe('upgrades are saved with their own world', () => {
  const fakeStorage = () => {
    const data = new Map<string, string>()
    const storage: KeyValue = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
    return storage
  }
  const shop = (idea: string): Shop => ({ step: 'ready', playerName: '', idea, shopName: idea, theme: 'cottage', offering: '' })

  test('a save and reload keeps levels, the campaign and cash exactly', () => {
    const game = buyCampaign(buyUpgrade(buyUpgrade(rich(9000), 'production'), 'shop'))
    const loaded = parseGame(JSON.parse(JSON.stringify(game)))
    assert.deepEqual(loaded, game)
    assert.deepEqual(extrasOf(loaded).upgrades, { production: 1, shop: 1 })
    assert.equal(loaded?.cashCents, 9000 - 1500 - 2000 - 600)
  })

  test('a save from before upgrades existed loads with no upgrades and the same money', () => {
    const old = { version: 1, modelId: 'product-basic', seed: 3, day: 6, cashCents: 7350, inventory: 4, lastPlan: { priceCents: 300, produce: 10, flyers: false }, history: [] }
    const loaded = parseGame(old)!
    assert.equal(loaded.cashCents, 7350)
    assert.equal(loaded.day, 6)
    assert.equal(loaded.inventory, 4)
    assert.deepEqual(extrasOf(loaded).upgrades, { production: 0, shop: 0 })
    assert.equal(extrasOf(loaded).campaignDaysLeft, 0)
  })

  test('damaged upgrade fields become "no upgrade"; the rest of the save is kept', () => {
    const damaged = { ...rich(5000), upgrades: { production: 99, shop: 'lots' }, campaignDaysLeft: -4, investedTodayCents: 1.5, campaignTodayCents: 123 }
    const loaded = parseGame(JSON.parse(JSON.stringify(damaged)))!
    assert.equal(loaded.cashCents, 5000)
    assert.deepEqual(extrasOf(loaded), { upgrades: { production: 0, shop: 0 }, campaignDaysLeft: 0, investedTodayCents: 0, campaignTodayCents: 0, investedTotalCents: 0 })
  })

  test('buying in one world changes nothing in another', () => {
    let store = emptyStore()
    store = putWorld(store, { ...newWorld('a', shop('Fairy café'), 1), game: rich(6000) })
    store = putWorld(store, { ...newWorld('b', shop('Dragon daycare'), 2), game: rich(6000) })
    const before = structuredClone(findWorld(store, 'b'))
    store = updateWorld(store, 'a', (w) => ({ ...w, game: buyCampaign(buyUpgrade(w.game!, 'production')) }), 3)

    assert.equal(findWorld(store, 'a')?.game?.cashCents, 6000 - 1500 - 600)
    assert.deepEqual(findWorld(store, 'b'), before)
    assert.equal(extrasOf(findWorld(store, 'b')?.game).upgrades.production, 0)

    // And it all survives being written to storage and read back.
    const storage = fakeStorage()
    saveStore(storage, store)
    const loaded = loadStore(storage, () => 'x', 9)
    assert.deepEqual(loaded, store)
    assert.equal(extrasOf(findWorld(loaded, 'a')?.game).upgrades.production, 1)
    assert.equal(extrasOf(findWorld(loaded, 'a')?.game).campaignDaysLeft, CAMPAIGN.days)
  })
})

describe('upgrades are named for the business', () => {
  const names = (idea: string) => {
    const b = generateWorldBlueprint({ idea, offering: '', style: 'cottage' })
    return [productionUpgradeName(b.productIcon), shopUpgradeName(b.structure)]
  }

  test('each kind of shop gets fitting names, with a plain fallback', () => {
    assert.deepEqual(names('Magical bakery'), ['Bigger oven', 'Prettier shop'])
    assert.deepEqual(names('Lemonade stand'), ['Bigger juicer', 'Brighter stall'])
    assert.deepEqual(names('Dragon daycare'), ['More cosy nests', 'Cosier cave'])
    assert.deepEqual(names('Fairy fashion boutique'), ['Sewing machine', 'Prettier shop'])
    assert.equal(names('Something nobody has a word for')[0], 'Bigger workshop')
    assert.equal(CAMPAIGN_NAME, 'Poster campaign')
  })

  test('names stay short enough for a card', () => {
    for (const idea of ['Bakery', 'Lemonade stand', 'Flower shop', 'Craft studio', 'Book nook', 'Toy shop', 'Pet sitting', 'Dragon daycare', 'Hat shop', 'Car wash']) {
      for (const name of names(idea)) assert.ok(name.length > 0 && name.length <= 22, name)
    }
  })
})

describe('the make limit is explained, and old worlds are handled', () => {
  test('a new shop is limited by its workshop at 20, not by cash', () => {
    const game = rich(8000)
    assert.deepEqual(makeLimit(modelForGame(base, game), game, false), { limit: 20, capacity: 20, reason: 'workshop', canGrow: true })
  })

  test('with little cash, cash is the limit', () => {
    const game = rich(700)
    assert.deepEqual(makeLimit(modelForGame(base, game), game, false), { limit: 7, capacity: 20, reason: 'cash', canGrow: true })
    assert.equal(makeLimit(modelForGame(base, game), game, true).limit, 4) // flyers use some of the cash
  })

  test('each workshop upgrade raises the limit: 20, 30, 45, 60', () => {
    let game = rich(100000)
    const limits = [makeLimit(modelForGame(base, game), game, false).limit]
    for (let i = 0; i < 3; i += 1) {
      game = buyUpgrade(game, 'production')
      limits.push(makeLimit(modelForGame(base, game), game, false).limit)
    }
    assert.deepEqual(limits, [20, 30, 45, 60])
    assert.equal(makeLimit(modelForGame(base, game), game, false).canGrow, false)
  })

  test('an older world that used to make 40 a day keeps its money and is asked for 20', () => {
    const old = parseGame({ version: 1, modelId: 'product-basic', seed: 3, day: 9, cashCents: 9000, inventory: 6, lastPlan: { priceCents: 250, produce: 40, flyers: false }, history: [] })!
    assert.equal(old.cashCents, 9000)
    assert.equal(old.inventory, 6)
    const planned = clampPlan(modelForGame(base, old), old, old.lastPlan)
    assert.deepEqual(planned, { priceCents: 250, produce: 20, flyers: false })
    // One workshop upgrade later it can make 30 again.
    const upgraded = buyUpgrade(old, 'production')
    assert.equal(clampPlan(modelForGame(base, upgraded), upgraded, old.lastPlan).produce, 30)
  })
})

describe('the worked example: +$17 profit, $2 from the shelf, $35 of upgrades, cash down $16', () => {
  // Day 4 of an older save: $40.00 in the till and 2 items already on the
  // shelf, made (and paid for) on an earlier day at $1.00 each.
  const morning = rich(4000, { day: 4, inventory: 2, seed: 9 })
  const afterShopping = buyUpgrade(buyUpgrade(morning, 'production'), 'shop')
  const r = day(afterShopping, plan(300, 10), 'tip')
  const s = summarizeDay(base, r)

  test('the day itself', () => {
    assert.equal(afterShopping.cashCents, 500) // $40 - $15 - $20
    assert.equal(r.produced, 5) // all the cash left would pay for
    assert.equal(r.available, 7) // 2 on the shelf + 5 made
    assert.equal(r.sold, 7)
    assert.equal(r.endInventory, 0)
  })

  test('profit: money from sales minus what those sales cost', () => {
    assert.equal(s.revenueTotalCents, 2400) // 7 x $3.00, plus a $3.00 tip
    assert.equal(s.expensesTotalCents, 700) // making the 7 that sold, at $1.00 each
    assert.equal(s.profitCents, 1700)
    // The upgrades are nowhere in the expenses.
    assert.equal(s.expenses.some((line) => line.id === 'upgrades'), false)
  })

  test('cash: every coin in and out', () => {
    assert.equal(s.cashInTotalCents, 2400)
    assert.equal(s.cashOutTotalCents, 4000) // $5.00 making today's 5, plus $35.00 of upgrades
    assert.equal(s.cashChangeCents, -1600)
    assert.equal(r.cashStartCents, 4000)
    assert.equal(r.cashEndCents, 2400)
  })

  test('the shelf: 2 items worth $2.00 this morning, none tonight', () => {
    assert.equal(s.inventoryStartValueCents, 200)
    assert.equal(s.inventoryEndValueCents, 0)
    assert.equal(s.inventoryChangeCents, -200) // $2.00 was taken from the shelf
    // Those 2 are in today's expenses ($7.00) but cost no cash today ($5.00).
    assert.equal(s.expenses.find((line) => line.id === 'cost-of-sales')?.cents, 700)
    assert.equal(s.cashOut.find((line) => line.id === 'production')?.cents, 500)
  })

  test('the sum on the report: profit + taken from the shelf - upgrades = cash change', () => {
    const takenFromShelf = -s.inventoryChangeCents
    assert.equal(s.profitCents + takenFromShelf - s.investmentCents, s.cashChangeCents)
    assert.equal(1700 + 200 - 3500, -1600)
  })
})

describe('a purchase is charged once', () => {
  test('buying from the same morning twice gives the same result, not two charges', () => {
    const morning = rich(9000)
    const once = buyUpgrade(morning, 'production')
    const again = buyUpgrade(morning, 'production')
    assert.deepEqual(again, once)
    assert.equal(once.cashCents, 7500)
  })

  test('after a day and a reload the records still add up', () => {
    let game = buyCampaign(buyUpgrade(buyUpgrade(rich(9000), 'production'), 'shop'))
    const spent = 1500 + 2000 + 600
    const r = day(game, plan(300, 20))
    game = parseGame(JSON.parse(JSON.stringify(applyResult(game, r))))!
    assert.equal(game.cashCents, r.cashEndCents)
    assert.equal(r.cashStartCents, 9000)
    assert.equal(r.cashEndCents, 9000 - spent - r.productionSpendCents + r.revenueCents + r.eventCashCents)
    assert.equal(game.history.at(-1)?.investmentCents, 3500)
    assert.equal(game.history.at(-1)?.campaignCents, 600)
    assert.equal(extrasOf(game).investedTotalCents, 3500)
    assert.equal(extrasOf(game).investedTodayCents, 0)
    // The next day charges nothing more.
    const next = day(game, plan(300, 20))
    assert.equal(next.investmentCents, 0)
    assert.equal(next.campaignCents, 0)
    assert.equal(next.cashStartCents, game.cashCents)
  })
})
