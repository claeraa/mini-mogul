import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createAiHandler } from '../server/director.ts'
import type { Provider } from '../server/director.ts'
import { SAFE_IDEA, checkIdea, ideaConcern, isSuitable } from '../src/ai/safety.ts'
import { cleanText, parseWorldRequest } from '../src/ai/schema.ts'
import { GUIDE_STEPS, guideCard, guideWanted, improveUnlocked, nextGuideStep, reportNote } from '../src/game/guide.ts'
import { PRODUCT_SHOP } from '../src/game/model.ts'
import { applyResult, newGame } from '../src/game/state.ts'
import { buyCampaign, buyUpgrade, simulateShopDay } from '../src/game/upgrades.ts'
import { EVENTS } from '../src/game/model.ts'
import { generateWorldBlueprint } from '../src/world/blueprint.ts'
import { suggestShopName } from '../src/world/names.ts'
import { parseSettings } from '../src/worlds/settings.ts'
import { parseStore } from '../src/worlds/store.ts'

describe('child-safe ideas', () => {
  test('"A smoke shop" is turned around, with friendly alternatives', () => {
    const check = checkIdea('A smoke shop')
    assert.equal(check.ok, false)
    if (check.ok) return
    assert.equal(check.concern, 'tobacco')
    assert.ok(check.suggestions.length >= 3)
    // The message does not repeat the idea or scold.
    assert.doesNotMatch(check.message, /smoke|bad|wrong|not allowed/i)
    // Every alternative is itself fine.
    for (const idea of check.suggestions) assert.equal(isSuitable(idea), true, idea)
  })

  test('businesses that are not for children are caught, by category', () => {
    const cases: [string, string][] = [
      ['Smoke shop', 'tobacco'], ['Vape store', 'tobacco'], ['Cigar lounge', 'tobacco'], ['Hookah bar', 'tobacco'],
      ['Beer garden', 'alcohol'], ['Wine bar', 'alcohol'], ['Cocktail lounge', 'alcohol'], ['My liquor store', 'alcohol'],
      ['Weed dispensary', 'drugs'], ['Casino', 'gambling'], ['Poker club', 'gambling'],
      ['Gun shop', 'weapons'], ['Bomb factory', 'weapons'], ['Adult video store', 'adult'],
    ]
    for (const [idea, concern] of cases) assert.equal(ideaConcern(idea), concern, idea)
  })

  test('harmless and imaginative ideas are never turned away', () => {
    const fine = [
      'Unicorn bakery', 'Dragon daycare', 'Space café', 'Pet sitting', 'Robot pet salon', 'A shop on the moon',
      'Seaweed snack stand', 'Smoked salmon stall', 'Smoke machine rental for parties', 'Tie-dye shop',
      'Candy bar', 'Snack bar', 'Salad bar', 'Ginger ale stand', 'Drugstore for teddy bears', 'Water balloon stand',
      'Monster truck wash', 'Pirate treasure hunt', 'Ghost tour', 'Witch hat shop', 'Zombie makeup studio',
      'Hot sauce shop', 'Slime lab', 'Foam dart arena', 'Grape juice bar', 'Potion shop', 'Sword polishing for knights',
    ]
    for (const idea of fine) assert.equal(isSuitable(idea), true, idea)
  })

  test('the same check guards the AI: an unsuitable idea is never sent to it', async () => {
    assert.equal(parseWorldRequest({ idea: 'A smoke shop', offering: '' }), null)
    assert.equal(parseWorldRequest({ idea: 'Sweet shop', offering: 'Cigars' }), null)
    assert.deepEqual(parseWorldRequest({ idea: 'Sweet shop', offering: 'Lollipops' }), { idea: 'Sweet shop', offering: 'Lollipops' })

    let asked = 0
    const provider: Provider = { name: 'fake', model: 'fake', complete: async () => { asked += 1; return {} } }
    const reply = await createAiHandler(provider)('POST', 'world', { idea: 'A smoke shop', offering: '' })
    assert.equal(reply.status, 400)
    assert.equal(asked, 0)
  })

  test('if the AI itself turns an idea away, the game is told so', async () => {
    const provider: Provider = { name: 'fake', model: 'fake', complete: async () => ({ kidSafe: false }) }
    const reply = await createAiHandler(provider)('POST', 'world', { idea: 'Something the list missed', offering: '' })
    assert.equal(reply.status, 422)
    assert.deepEqual(reply.body, { error: 'refused' })
  })

  test('AI-written text is held to the same list', () => {
    assert.equal(cleanText('Grown-ups who love a good cigar', 100), null)
    assert.equal(cleanText('A cosy vape lounge', 100), null)
    assert.equal(cleanText('Friends who love sparkly hats', 100), 'Friends who love sparkly hats')
  })

  test('an older save with an unsuitable idea keeps its progress and loses only the words', () => {
    const game = { ...newGame(PRODUCT_SHOP, 3), day: 6, cashCents: 8800, inventory: 4 }
    const direction = { summary: 'x', label: 'Old AI world' }
    const store = parseStore({
      version: 2,
      lastWorldId: 'a',
      worlds: [
        { id: 'a', createdAt: 1, updatedAt: 2, shop: { step: 'ready', playerName: 'Sam', idea: 'A smoke shop', shopName: "Sam's Smoke Shop", theme: 'cottage', offering: 'Cigars' }, direction, game },
        { id: 'b', createdAt: 1, updatedAt: 1, shop: { step: 'ready', playerName: 'Sam', idea: 'Unicorn bakery', shopName: "Sam's Unicorn Bakery", theme: 'cottage', offering: 'Rainbow cupcakes' }, direction: null, game },
      ],
    })!
    const [smoke, bakery] = store.worlds
    assert.equal(smoke.shop.idea, SAFE_IDEA)
    assert.equal(smoke.shop.shopName, SAFE_IDEA)
    assert.equal(smoke.shop.offering, '')
    assert.equal(smoke.direction, null)
    // The world, its days and its money are untouched.
    assert.equal(smoke.game?.day, 6)
    assert.equal(smoke.game?.cashCents, 8800)
    assert.equal(smoke.game?.inventory, 4)
    assert.equal(store.lastWorldId, 'a')
    // A fine world is left exactly as it was.
    assert.equal(bakery.shop.shopName, "Sam's Unicorn Bakery")
    assert.equal(bakery.shop.offering, 'Rainbow cupcakes')
    // The replacement idea builds an ordinary shop, with a fitting name.
    assert.equal(generateWorldBlueprint({ idea: SAFE_IDEA, style: 'cottage' }).theme, 'general-store')
    assert.equal(suggestShopName('Sam', SAFE_IDEA), "Sam's Surprise Shop")
  })
})

describe('the first-day guide', () => {
  const fresh = newGame(PRODUCT_SHOP, 1)
  const played = applyResult(fresh, simulateShopDay(PRODUCT_SHOP, fresh, { priceCents: 300, produce: 10, flyers: false }, EVENTS[0]))

  test('it appears on a brand-new world only, and never once finished', () => {
    assert.equal(guideWanted('auto', fresh), true)
    assert.equal(guideWanted('auto', played), false) // someone already running a shop
    assert.equal(guideWanted('done', fresh), false)
    assert.equal(guideWanted('done', played), false)
  })

  test('it can be replayed on any day', () => {
    assert.equal(guideWanted('replay', fresh), true)
    assert.equal(guideWanted('replay', played), true)
  })

  test('three steps, one idea each: make, price, open', () => {
    assert.deepEqual([...GUIDE_STEPS], ['make', 'price', 'open'])
    assert.equal(nextGuideStep('make'), 'price')
    assert.equal(nextGuideStep('price'), 'open')
    assert.equal(nextGuideStep('open'), null)
    const words = { product: 'Petal cupcakes', customers: 'Fairy folk' }
    assert.deepEqual(GUIDE_STEPS.map((step) => guideCard(step, words).count), ['1 of 3', '2 of 3', '3 of 3'])
    for (const step of GUIDE_STEPS) {
      const card = guideCard(step, words)
      assert.ok(card.title.length <= 28, card.title)
      assert.ok(card.body.length <= 90, card.body)
      // No jargon on day one.
      assert.doesNotMatch(`${card.title} ${card.body}`, /revenue|expense|inventory|margin|upgrade|loan|interest|profit/i)
    }
  })

  test('tips use the player\'s own product and customers, with plain fallbacks', () => {
    assert.equal(guideCard('make', { product: 'Petal cupcakes', customers: 'Fairy folk' }).body, 'Tap Make. How many Petal cupcakes will your fairy folk want?')
    assert.equal(guideCard('make', { product: 'Dragon naps', customers: 'Dragon families' }).body, 'Tap Make. How many Dragon naps will your dragon families want?')
    assert.equal(guideCard('make', { product: '', customers: '' }).body, 'Tap Make. How many things will your customers want?')
  })

  test('the first report explains profit in one kind sentence, whatever happened', () => {
    for (const profit of [2300, 0, -500]) {
      const note = reportNote(profit)
      assert.ok(note.length <= 100, note)
      assert.match(note, /^Your first day!/)
    }
    assert.match(reportNote(2300), /money you keep/)
    assert.match(reportNote(-500), /Try again tomorrow/)
  })

  test('the guide preference is saved with settings, not with a world', () => {
    assert.equal(parseSettings({}).guide, 'auto')
    assert.equal(parseSettings({ guide: 'done' }).guide, 'done')
    assert.equal(parseSettings({ guide: 'replay' }).guide, 'replay')
    assert.equal(parseSettings({ guide: 'whatever' }).guide, 'auto')
    assert.equal('guide' in fresh, false)
  })
})

describe('upgrades wait until the basics are learned', () => {
  const day = (n: number) => ({ ...newGame(PRODUCT_SHOP, 1), day: n, cashCents: 9000 })

  test('Improve is hidden on days 1 and 2 and appears on day 3', () => {
    assert.equal(improveUnlocked(day(1)), false)
    assert.equal(improveUnlocked(day(2)), false)
    assert.equal(improveUnlocked(day(3)), true)
    assert.equal(improveUnlocked(day(40)), true)
  })

  test('a world that already owns an upgrade or campaign keeps Improve open', () => {
    assert.equal(improveUnlocked(buyUpgrade(day(1), 'production')), true)
    assert.equal(improveUnlocked(buyUpgrade(day(2), 'shop')), true)
    assert.equal(improveUnlocked(buyCampaign(day(1))), true)
  })

  test('the "New!" tag is remembered per device', () => {
    assert.equal(parseSettings({}).improveSeen, false)
    assert.equal(parseSettings({ improveSeen: true }).improveSeen, true)
  })
})

describe('the idea shapes the world, not just its name', () => {
  test('a space café is a drinks stand under a starry sky', () => {
    const b = generateWorldBlueprint({ idea: 'Space café', style: 'cottage' })
    assert.equal(b.theme, 'drink-stand')
    assert.equal(b.timeOfDay, 'night')
    assert.match(b.label, /Moonlit/)
  })

  test('the three homepage examples give three different worlds', () => {
    const worlds = ['Unicorn bakery', 'Dragon daycare', 'Space café'].map((idea) => generateWorldBlueprint({ idea, style: 'cottage' }))
    assert.equal(new Set(worlds.map((w) => w.theme)).size, 3)
    assert.equal(new Set(worlds.map((w) => w.structure)).size, 3)
    assert.equal(new Set(worlds.map((w) => w.customers)).size, 3)
    assert.equal(new Set(worlds.map((w) => w.productIcon)).size, 3)
  })
})
