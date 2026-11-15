import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createAiHandler } from '../server/director.ts'
import type { Provider } from '../server/director.ts'
import { contradictsDay, parseCoaching, unhelpfulMission } from '../src/ai/schema.ts'
import { coachFacts, dayTruth, fallbackCoaching, mission, nextStep } from '../src/game/coach.ts'
import { EVENTS, PRODUCT_SHOP } from '../src/game/model.ts'
import type { DayResult } from '../src/game/model.ts'
import { simulateDay } from '../src/game/simulation.ts'

const model = PRODUCT_SHOP
const event = (id: string) => EVENTS.find((e) => e.id === id)!
const calm = event('tip')
const play = (priceCents: number, produce: number, o: { flyers?: boolean; eventId?: string; inventory?: number; cash?: number } = {}): DayResult =>
  simulateDay(
    model,
    { day: 1, cashCents: o.cash ?? 2000, inventory: o.inventory ?? 0 },
    { priceCents, produce, flyers: o.flyers ?? false },
    o.eventId ? event(o.eventId) : calm,
  )

/** Runs a reply through the same check the server and the browser use. */
const accepts = (r: DayResult, reply: { encouragement: string; suggestion: string; challenge: string | null }) => {
  const facts = coachFacts(model, r)
  return parseCoaching(reply, facts.allowed, facts.truth) !== null
}
const fine = { encouragement: 'What a busy day at the café!', suggestion: 'Try making a few more tomorrow.', challenge: null }

describe('the Fairy Café day: sold out, four customers missed out, a profit', () => {
  // 19 came, 15 bought, 4 missed out, shelf empty, profit +$60.75, cash $80.75.
  // The engine produces exactly this day: $5.25 each, 15 made, flyers, a glowing review.
  const cafe = play(525, 15, { flyers: true, eventId: 'review' })

  test('the engine reproduces the reported numbers', () => {
    assert.deepEqual(
      [cafe.demand, cafe.sold, cafe.missedCustomers, cafe.available, cafe.endInventory, cafe.operatingProfitCents, cafe.cashEndCents],
      [19, 15, 4, 15, 0, 6075, 8075],
    )
  })

  test('the engine reads it as a profit with a stockout, not a perfect day', () => {
    assert.deepEqual(dayTruth(cafe), { outcome: 'profit', ranOut: true, leftovers: false })
    const facts = coachFacts(model, cafe).lines.join('\n')
    assert.match(facts, /SOLD OUT TOO EARLY/)
    assert.match(facts, /4 more customers wanted one but could not buy/)
    assert.match(facts, /did NOT have enough/)
  })

  test('"you had plenty to sell" is refused', () => {
    assert.equal(accepts(cafe, { ...fine, encouragement: 'Great job! You had plenty to sell and made a real profit.' }), false)
    assert.equal(accepts(cafe, { ...fine, encouragement: 'You made just the right amount today.' }), false)
    assert.equal(accepts(cafe, { ...fine, encouragement: 'Every customer got a cupcake!' }), false)
    assert.equal(accepts(cafe, { ...fine, encouragement: 'Nobody missed out today.' }), false)
    assert.equal(accepts(cafe, { ...fine, suggestion: 'You had enough for everyone, so keep it the same.' }), false)
  })

  test('"Sell out your Petal cupcakes again" is refused as a mission', () => {
    assert.equal(accepts(cafe, { ...fine, challenge: 'Challenge: Sell out your Petal cupcakes again.' }), false)
    assert.equal(unhelpfulMission('Challenge: sell out again tomorrow!', dayTruth(cafe)), true)
    assert.equal(unhelpfulMission('Challenge: serve everyone without selling out.', dayTruth(cafe)), false)
  })

  test('honest coaching about the same day is accepted', () => {
    assert.equal(
      accepts(cafe, {
        encouragement: 'You made a profit, and your cupcakes sold out! But 4 customers missed out.',
        suggestion: 'Try making a few more so everyone can buy one.',
        challenge: 'Challenge: have more than 15 ready tomorrow.',
      }),
      true,
    )
  })

  test('the built-in coach names the missed customers and sets a mission to serve them', () => {
    const coach = fallbackCoaching(model, cafe)
    assert.match(coach.suggestion, /4 more customers wanted one/)
    // A step up from the 15 that were ready; no promise of 19 customers again.
    assert.equal(coach.challenge, 'Challenge: have more than 15 ready tomorrow.')
    assert.doesNotMatch(coach.challenge, /19/)
    assert.doesNotMatch(coach.challenge, /sell out/i)
    assert.equal(accepts(cafe, coach), true)
  })

  test('when the shop is already making all it can, the mission is about price', () => {
    const busy = play(300, 20, { eventId: 'review' })
    assert.ok(busy.missedCustomers > 0 && busy.operatingProfitCents > 0)
    const full = { ...busy, available: model.maxDailyProduction }
    assert.equal(mission(model, full), 'Challenge: try a slightly higher price tomorrow.')
  })

  test('the mission stays within budget', () => {
    // Only enough cash for a few: the mission does not ask for the impossible.
    const broke = { ...cafe, cashEndCents: 300 }
    assert.equal(mission(model, broke), 'Challenge: make as many as you can afford.')
  })

  test('a contradicting AI reply never reaches the player: the server refuses it', async () => {
    const real = cafe
    const reply = (text: object): Provider => ({ name: 'fake', model: 'fake', complete: async () => text })
    const body = { idea: 'Fairy café', offering: 'Petal cupcakes', result: real }
    const bad = await createAiHandler(reply({ encouragement: 'You had plenty to sell today!', suggestion: 'Keep going.', challenge: 'Challenge: Sell out your Petal cupcakes again.' }))('POST', 'coach', body)
    assert.equal(bad.status, 502)
    assert.deepEqual(bad.body, { error: 'invalid_reply' })
    const good = await createAiHandler(reply({ encouragement: 'Your cupcakes sold out and some customers missed out.', suggestion: 'Make a few more tomorrow.', challenge: null }))('POST', 'coach', body)
    assert.equal(good.status, 200)
  })

  test('the AI is told the verified reading and the game\'s own mission', async () => {
    const real = cafe
    let prompt = ''
    const spy: Provider = {
      name: 'fake', model: 'fake',
      complete: async (request) => {
        prompt = `${request.system}\n${request.user}`
        return { encouragement: 'Nice work today.', suggestion: 'Make a few more.', challenge: null }
      },
    }
    await createAiHandler(spy)('POST', 'coach', { idea: 'Fairy café', offering: 'Petal cupcakes', result: real })
    assert.match(prompt, /SOLD OUT TOO EARLY/)
    assert.match(prompt, /The game's own mission for tomorrow: Challenge: have more than 15 ready/)
    assert.match(prompt, /do not praise selling out/i)
  })
})

describe('each kind of day gets advice and a mission that fit it', () => {
  test('surplus: plenty left over', () => {
    const r = play(775, 20, { eventId: 'tip' })
    assert.ok(r.cashEndCents < r.cashStartCents)
    assert.ok(r.endInventory > r.sold && r.operatingProfitCents > 0)
    assert.deepEqual(dayTruth(r), { outcome: 'profit', ranOut: false, leftovers: true })
    assert.equal(mission(model, r), 'Challenge: sell what is on your shelf first.')
    assert.match(coachFacts(model, r).lines.join('\n'), /NOT sold out/)
    // Cash went down although there was a profit: the facts say why.
    assert.match(coachFacts(model, r).lines.join('\n'), /cash went down/)
    assert.equal(accepts(r, { ...fine, encouragement: 'Wow, you sold out today!' }), false)
    assert.equal(accepts(r, { ...fine, encouragement: 'Some customers missed out today.' }), false)
    assert.equal(accepts(r, { ...fine, encouragement: 'You have some left on your shelf for tomorrow.' }), true)
  })

  test('a few leftovers', () => {
    const base = play(300, 20, { eventId: 'tip' })
    const r = { ...base, demand: 17, sold: 17, missedCustomers: 0, endInventory: 3 }
    assert.equal(mission(model, r), 'Challenge: sell the 3 left on your shelf.')
  })

  test('just enough: nothing left, nobody missed', () => {
    const r = play(300, 20, { eventId: 'tip' })
    assert.deepEqual([r.missedCustomers, r.endInventory], [0, 0])
    assert.match(mission(model, r), /^Challenge: beat today's profit of /)
    assert.equal(accepts(r, { ...fine, encouragement: 'You made just the right amount today.' }), true)
    assert.equal(accepts(r, { ...fine, encouragement: 'Lots stayed on your shelf.' }), false)
  })

  test('pricing loss: price below the making cost', () => {
    const r = play(50, 10, { eventId: 'sunny' })
    assert.ok(r.operatingProfitCents < 0)
    assert.match(nextStep(model, r), /price above/i)
    assert.equal(mission(model, r), 'Challenge: make a profit tomorrow.')
    assert.match(coachFacts(model, r).lines.join('\n'), /did not cover the cost/)
    assert.equal(accepts(r, { ...fine, encouragement: 'You made a nice profit today!' }), false)
  })

  test('zero sales', () => {
    const r = play(model.ceilingPriceCents, 10, { eventId: 'sunny' })
    assert.equal(r.sold, 0)
    assert.equal(mission(model, r), 'Challenge: make your first sale tomorrow.')
    assert.match(coachFacts(model, r).lines.join('\n'), /nobody wanted to buy at this price/i)
    assert.equal(accepts(r, { ...fine, encouragement: 'You sold out today!' }), false)
    assert.equal(accepts(r, fallbackCoaching(model, r)), true)
  })

  test('surprises: a repair bill and lost stock', () => {
    const repair = EVENTS.find((e) => e.cashCents < 0)!
    const bill = play(125, 1, { eventId: repair.id })
    assert.ok(bill.operatingProfitCents < 0)
    assert.match(nextStep(model, bill), /surprise/i)
    assert.equal(mission(model, bill), 'Challenge: make a profit tomorrow.')

    const spill = EVENTS.find((e) => e.stockLoss > 0)!
    const lost = play(300, 10, { eventId: spill.id })
    assert.ok(lost.stockLost > 0)
    assert.match(coachFacts(model, lost).lines.join('\n'), /Items lost to the surprise/)
    assert.equal(accepts(lost, fallbackCoaching(model, lost)), true)
  })

  test('every built-in coach passes the checks the AI must pass, on every kind of day', () => {
    let checked = 0
    for (const e of EVENTS) {
      for (let price = model.minPriceCents; price <= model.ceilingPriceCents; price += model.priceStepCents * 2) {
        for (const produce of [0, 2, 8, 20]) {
          for (const flyers of [false, true]) {
            for (const inventory of [0, 6]) {
              const r = play(price, produce, { flyers, eventId: e.id, inventory })
              const coach = fallbackCoaching(model, r)
              assert.equal(accepts(r, coach), true, JSON.stringify({ coach, r }))
              assert.ok(coach.challenge.length <= 60, coach.challenge)
              // Selling out is never the mission.
              assert.doesNotMatch(coach.challenge, /sell out|sold out/i)
              assert.equal(contradictsDay(`${coach.encouragement} ${coach.suggestion} ${coach.challenge}`, dayTruth(r)), false)
              checked += 1
            }
          }
        }
      }
    }
    assert.ok(checked > 500)
  })
})
