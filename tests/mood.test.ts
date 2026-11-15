import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { EVENTS, PRODUCT_SHOP } from '../src/game/model.ts'
import { contradictsOutcome, parseCoaching } from '../src/ai/schema.ts'
import { coachFacts, fallbackCoaching, nextStep } from '../src/game/coach.ts'
import { MOOD_TITLES, dayMood, reportFaces, reportTitle } from '../src/game/mood.ts'
import { simulateDay } from '../src/game/simulation.ts'

const model = PRODUCT_SHOP
const quiet = EVENTS.find((e) => e.id === 'tip')!
const day = (priceCents: number, produce: number, inventory = 0, cashCents = 2000) =>
  simulateDay(model, { day: 1, cashCents, inventory }, { priceCents, produce, flyers: false }, quiet)

describe('how a day feels on the report', () => {
  test('a profit with happy customers is a great day', () => {
    const r = day(300, 20)
    assert.ok(r.operatingProfitCents > 0)
    assert.equal(r.missedCustomers, 0)
    assert.equal(dayMood(model, r), 'great')
  })

  test('a profit with many customers missing out is good, not great', () => {
    const r = day(100, 5)
    assert.ok(r.operatingProfitCents >= 0)
    const mood = dayMood(model, day(200, 5))
    assert.equal(mood, 'good')
    assert.ok(day(200, 5).missedCustomers > day(200, 5).sold)
  })

  test('breaking even or a small loss is an okay day', () => {
    const even = { ...day(300, 10), operatingProfitCents: 0 }
    assert.equal(dayMood(model, even), 'okay')
    const small = { ...day(300, 10), operatingProfitCents: -2 * model.unitCostCents }
    assert.equal(dayMood(model, small), 'okay')
  })

  test('a bigger loss or no sales is a tough day', () => {
    const big = { ...day(300, 10), operatingProfitCents: -2 * model.unitCostCents - 1 }
    assert.equal(dayMood(model, big), 'tough')
    const nobody = day(model.ceilingPriceCents, 10)
    assert.equal(nobody.sold, 0)
    // No sales is never celebrated, even when a surprise tip made a little money.
    for (const operatingProfitCents of [-1000, 0, 200]) {
      assert.equal(dayMood(model, { ...nobody, operatingProfitCents }), 'tough')
    }
  })

  test('every mood has a short, kind headline', () => {
    for (const title of Object.values(MOOD_TITLES)) {
      assert.ok(title.length <= 24)
      assert.doesNotMatch(title, /fail|bad|terrible|lost|wrong/i)
    }
  })

  test('faces follow the real numbers', () => {
    assert.deepEqual(reportFaces(day(300, 20)), { happy: 10, sad: 0 })
    const soldOut = reportFaces(day(300, 10))
    assert.deepEqual(soldOut, { happy: 5, sad: 5 })
    assert.deepEqual(reportFaces(day(model.ceilingPriceCents, 10)), { happy: 0, sad: 0 })
    // One sale among many still shows one smile; one miss still shows one frown.
    assert.deepEqual(reportFaces({ ...day(300, 20), demand: 30, sold: 1 }), { happy: 1, sad: 9 })
    assert.deepEqual(reportFaces({ ...day(300, 20), demand: 30, sold: 29 }), { happy: 9, sad: 1 })
    assert.deepEqual(reportFaces({ ...day(300, 20), demand: 3, sold: 3 }), { happy: 3, sad: 0 })
  })
})

describe('break-even and small losses read differently', () => {
  test('exactly zero says "You broke even!"; a small loss says "So close!"', () => {
    const even = { ...day(300, 10), operatingProfitCents: 0 }
    assert.equal(reportTitle(model, even), 'You broke even!')
    assert.equal(reportTitle(model, { ...even, operatingProfitCents: -100 }), 'So close!')
    assert.equal(reportTitle(model, { ...even, operatingProfitCents: -1000 }), 'Tough day. Keep going!')
    assert.equal(reportTitle(model, day(300, 20)), 'Amazing day!')
    // No sales at exactly zero is still a tough day, not a break-even cheer.
    assert.equal(reportTitle(model, day(model.ceilingPriceCents, 0, 5)), 'Tough day. Keep going!')
  })
})

describe('the next step fits what caused the loss', () => {
  const plan = (priceCents: number, produce: number, flyers: boolean, eventId: string, inventory = 0) =>
    simulateDay(model, { day: 1, cashCents: 2000, inventory }, { priceCents, produce, flyers }, EVENTS.find((e) => e.id === eventId)!)
  const calm = EVENTS.find((e) => e.cashCents === 0 && e.stockLoss === 0 && e.demandPct === 0)?.id ?? 'sunny'

  test('price at or below cost: raise it, never lower it', () => {
    const r = plan(50, 10, false, calm)
    assert.ok(r.operatingProfitCents < 0)
    assert.match(nextStep(model, r), /price above/i)
    assert.doesNotMatch(nextStep(model, r), /lower/i)
    assert.match(fallbackCoaching(model, r).challenge, /^Challenge: make a profit tomorrow\.$/)
  })

  test('price too high for anyone: a lower price is right here', () => {
    const r = plan(model.ceilingPriceCents, 10, false, calm)
    assert.equal(r.demand, 0)
    assert.match(nextStep(model, r), /lower/i)
  })

  test('flyers that cost more than they earned: about flyers, not price', () => {
    const r = plan(125, 3, true, calm)
    assert.ok(r.operatingProfitCents < 0 && r.priceCents > model.unitCostCents)
    assert.match(nextStep(model, r), /flyer/i)
    assert.doesNotMatch(nextStep(model, r), /lower/i)
  })

  test('a costly surprise: the plan was fine', () => {
    const repair = EVENTS.find((e) => e.cashCents < 0)!
    const r = plan(125, 1, false, repair.id)
    assert.ok(r.operatingProfitCents < 0)
    assert.match(nextStep(model, r), /surprise/i)
    assert.doesNotMatch(nextStep(model, r), /lower/i)
  })

  test('an empty shelf: make some', () => {
    assert.match(nextStep(model, plan(300, 0, false, calm)), /make a few/i)
  })

  test('across every plan and surprise, advice never says lower unless nobody came', () => {
    let checked = 0
    for (const event of EVENTS) {
      for (let price = model.minPriceCents; price <= model.ceilingPriceCents; price += model.priceStepCents * 3) {
        for (const produce of [0, 3, 10, 20]) {
          for (const flyers of [false, true]) {
            const r = plan(price, produce, flyers, event.id)
            const step = nextStep(model, r)
            const coach = fallbackCoaching(model, r)
            assert.ok(step.length > 0 && step.length <= 140, step)
            assert.ok(coach.challenge.length <= 50, coach.challenge)
            if (r.operatingProfitCents <= 0 && r.demand > 0) assert.doesNotMatch(step, /lower/i, step)
            // The built-in coach passes the same checks the AI must pass.
            const facts = coachFacts(model, r)
            assert.ok(parseCoaching(coach, facts.allowed, facts.outcome), JSON.stringify(coach))
            // Faces and celebrations follow the result.
            const faces = reportFaces(r)
            assert.equal(faces.happy > 0, r.sold > 0)
            assert.equal(faces.sad > 0, r.missedCustomers > 0 && Math.min(r.demand, 10) > 1)
            const mood = dayMood(model, r)
            if (r.operatingProfitCents <= 0 || r.sold === 0) assert.ok(mood === 'okay' || mood === 'tough')
            else assert.ok(mood === 'great' || mood === 'good')
            checked += 1
          }
        }
      }
    }
    assert.ok(checked > 200)
  })
})

describe('AI coaching may not contradict the engine', () => {
  test('claims of profit or loss must match the day', () => {
    assert.equal(contradictsOutcome('You made a great profit today!', 'loss'), true)
    assert.equal(contradictsOutcome('You earned a profit.', 'break-even'), true)
    assert.equal(contradictsOutcome('You made a loss today.', 'profit'), true)
    assert.equal(contradictsOutcome('You lost money today.', 'profit'), true)
    assert.equal(contradictsOutcome('You made a profit!', 'profit'), false)
    assert.equal(contradictsOutcome('You did not make a profit yet. Keep going!', 'loss'), false)
    assert.equal(contradictsOutcome('Today was a loss, and that is okay.', 'loss'), false)
    assert.equal(contradictsOutcome('Try to make a profit tomorrow.', 'loss'), false)
  })

  test('a contradicting reply is refused, so the built-in coach is used', () => {
    const loss = simulateDay(model, { day: 1, cashCents: 2000, inventory: 0 }, { priceCents: 50, produce: 10, flyers: false }, quiet)
    const facts = coachFacts(model, loss)
    assert.equal(facts.outcome, 'loss')
    const wrong = { encouragement: 'You made a profit today!', suggestion: 'Keep going.', challenge: null }
    const right = { encouragement: 'Today was a loss, but you learned a lot.', suggestion: 'Try a higher price.', challenge: null }
    assert.equal(parseCoaching(wrong, facts.allowed, facts.outcome), null)
    assert.ok(parseCoaching(right, facts.allowed, facts.outcome))
  })
})
