import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { generateWorldBlueprint, tokenize } from '../src/world/blueprint.ts'
import type { StyleId } from '../src/world/blueprint.ts'
import { crowdNote, shelfDuring, stageVisitors } from '../src/world/stage.ts'
import { PRODUCT_SHOP } from '../src/game/model.ts'
import { demandForDay } from '../src/game/simulation.ts'

const world = (idea: string, offering = '', style: StyleId = 'cottage') =>
  generateWorldBlueprint({ idea, offering, style })

describe('world blueprint: reading the idea', () => {
  test('magical bakery becomes an enchanted bakery cottage', () => {
    const b = world('Magical bakery')
    assert.equal(b.theme, 'bakery')
    assert.equal(b.structure, 'cottage')
    assert.equal(b.label, 'Enchanted bakery cottage')
    assert.ok(b.decorations.includes('sparkles'))
    assert.equal(b.productIcon, 'cupcake')
  })

  test('dragon daycare becomes a creature nest in a cave', () => {
    const b = world('Dragon daycare')
    assert.equal(b.theme, 'creature-care')
    assert.equal(b.structure, 'cave')
    assert.equal(b.biome, 'crags')
    assert.ok(b.props.includes('nest'))
    assert.equal(b.kind, 'service')
  })

  test('pet-sitting service becomes a pet care park', () => {
    const b = world('Pet-sitting service')
    assert.equal(b.theme, 'pet-care')
    assert.equal(b.structure, 'pavilion')
    assert.equal(b.biome, 'park')
    assert.equal(b.kind, 'service')
  })

  test('moonlight lemonade stand becomes a moonlit stand', () => {
    const b = world('Moonlight lemonade stand')
    assert.equal(b.theme, 'drink-stand')
    assert.equal(b.structure, 'stall')
    assert.equal(b.timeOfDay, 'night')
    assert.equal(b.label, 'Moonlit refreshment stand')
  })

  test('flower and craft businesses get a garden and a studio', () => {
    assert.equal(world('A flower shop').structure, 'greenhouse')
    assert.equal(world('A flower shop').biome, 'garden')
    assert.equal(world('Handmade bracelet crafts').structure, 'studio')
  })

  test('short words only match whole words', () => {
    // "pet" must not match "petals", "art" must not match "party".
    assert.equal(world('Petals and party hats').theme, 'general-store')
    assert.equal(world('Catering team').theme, 'general-store')
  })

  test('an unknown idea still gets a world, the same one every time', () => {
    const a = world('Zebra umbrella rental')
    assert.equal(a.theme, 'general-store')
    assert.deepEqual(a, world('Zebra umbrella rental'))
    assert.ok(a.props.length > 0)
  })
})

describe('world blueprint: first product and style', () => {
  test('the first product can decide the world when the idea does not', () => {
    assert.equal(world('Sunny corner shop', 'cupcakes').theme, 'bakery')
  })

  test('the idea outweighs the product', () => {
    const b = world('Dragon daycare', 'cookies')
    assert.equal(b.theme, 'creature-care')
    assert.equal(b.productIcon, 'cupcake')
  })

  test('style changes the setting and colours but not the theme', () => {
    const meadow = world('Magical bakery', '', 'cottage')
    const beach = world('Magical bakery', '', 'seaside')
    const woods = world('Magical bakery', '', 'forest')
    assert.equal(beach.theme, meadow.theme)
    assert.equal(meadow.biome, 'meadow')
    assert.equal(beach.biome, 'beach')
    assert.equal(woods.biome, 'woods')
    assert.notEqual(beach.colors.roof, meadow.colors.roof)
    assert.ok(beach.decorations.includes('seagulls'))
  })

  test('starlight style is always night, and night creatures stay asleep', () => {
    const b = world('Pet-sitting service', '', 'starlight')
    assert.equal(b.timeOfDay, 'night')
    assert.ok(!b.decorations.includes('butterflies'))
    assert.ok(b.decorations.includes('fireflies'))
  })

  test('every combination is complete and deterministic', () => {
    const ideas = ['Magical bakery', 'Dragon daycare', 'Pet-sitting service', 'Moonlight lemonade stand', 'Robot repair', '']
    const styles: StyleId[] = ['cottage', 'forest', 'seaside', 'starlight']
    for (const idea of ideas) {
      for (const style of styles) {
        const b = world(idea, 'things', style)
        assert.deepEqual(b, world(idea, 'things', style))
        assert.ok(b.label.length > 0)
        assert.ok(b.props.length >= 2 && b.props.length <= 3)
        assert.ok(b.decorations.length <= 4)
        assert.equal(new Set(b.decorations).size, b.decorations.length)
        assert.ok(b.reactions.length > 0)
        for (const colour of Object.values(b.colors)) assert.match(colour, /^#[0-9a-f]{6}$/)
      }
    }
  })

  test('tokenize strips case, accents and punctuation', () => {
    assert.deepEqual(tokenize("Zoë's Café-Bakery!"), ['zoe', 's', 'cafe', 'bakery'])
  })
})

describe('on-screen customers', () => {
  test('never more than fit, never more than came', () => {
    assert.equal(stageVisitors(40, 40).length, 8)
    assert.equal(stageVisitors(3, 3).length, 3)
    assert.equal(stageVisitors(0, 0).length, 0)
  })

  test('buyers and missed customers are both represented', () => {
    const v = stageVisitors(20, 19)
    assert.equal(v.filter((x) => x.buys).length, 7)
    assert.equal(v.filter((x) => !x.buys).length, 1)
    assert.equal(stageVisitors(20, 1).filter((x) => x.buys).length, 1)
    assert.ok(stageVisitors(20, 0).every((x) => !x.buys))
    assert.ok(stageVisitors(20, 20).every((x) => x.buys))
  })

  test('the shelf empties from what was available to what is left', () => {
    assert.equal(shelfDuring(14, 11, 0, 6), 14)
    assert.equal(shelfDuring(14, 11, 6, 6), 3)
    assert.equal(shelfDuring(5, 0, 0, 0), 5)
  })
})

describe('words for customers who do not fit on screen', () => {
  test('an estimate and real arrivals are worded differently', () => {
    const expected = crowdNote('expected', 28, 8)!
    const arrived = crowdNote('arrived', 28, 8)!
    assert.equal(expected.text, '+20 more potential customers')
    assert.equal(arrived.text, '+20 more customers')
    assert.notEqual(expected.short, arrived.short)
    assert.match(expected.detail, /estimate/)
    assert.match(arrived.detail, /^28 customers came today/)
    assert.equal(crowdNote('arrived', 9, 8)!.text, '+1 more customer')
  })

  test('nothing is said when everyone is on screen or nobody is coming', () => {
    for (const kind of ['expected', 'arrived'] as const) {
      assert.equal(crowdNote(kind, 0, 0), null)
      assert.equal(crowdNote(kind, 5, 5), null)
      assert.equal(crowdNote(kind, 8, 8), null)
      assert.equal(crowdNote(kind, 3, 8), null)
      assert.equal(crowdNote(kind, Number.NaN, 0), null)
    }
  })

  test('the count always matches the simulation at every price', () => {
    const m = PRODUCT_SHOP
    let checked = 0
    for (let price = m.minPriceCents; price <= m.ceilingPriceCents; price += m.priceStepCents) {
      for (const flyers of [false, true]) {
        const demand = demandForDay(m, price, flyers, null)
        const shown = stageVisitors(demand, demand).length
        const note = crowdNote('expected', demand, shown)
        if (demand <= shown) assert.equal(note, null)
        else assert.equal(note!.text.startsWith(`+${demand - shown} more potential`), true)
        checked += 1
      }
    }
    assert.ok(checked > 20)
    // At the price where nobody buys, nothing hints at a waiting crowd.
    assert.equal(demandForDay(m, m.ceilingPriceCents, false, null), 0)
  })
})
