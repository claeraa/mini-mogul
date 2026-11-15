import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CUSTOMER_CASTS, PRODUCT_ICONS, PROPS, parseWorldDirection } from '../src/ai/schema.ts'
import { buildWorld } from '../src/ai/world.ts'
import { generateWorldBlueprint } from '../src/world/blueprint.ts'
import { CAST_NAMES, castLabel, pickCustomerCast } from '../src/world/customers.ts'
import { offeringName, shorten, suggestShopName } from '../src/world/names.ts'

const world = (idea: string, offering = '') => generateWorldBlueprint({ idea, offering, style: 'cottage' })

describe('customers match the business (built-in rules)', () => {
  test('each kind of business gets a fitting, supported cast', () => {
    const expected: [string, string][] = [
      ['Fairy fashion boutique', 'fairies'],
      ['Fairy clothing shop', 'fairies'],
      ['Dragon daycare', 'dragons'],
      ['Pet-sitting service', 'pet-owners'],
      ['Dog walking', 'pet-owners'],
      ['Magical bakery', 'bakers'],
      ['High-end fashion boutique', 'shoppers'],
      ['Toy shop', 'kids'],
      ['Doll shop', 'kids'],
      ['Flower shop', 'gardeners'],
      ['Plant shop', 'gardeners'],
      ['Book nook', 'readers'],
      ['Lemonade stand', 'villagers'],
      ['Something nobody has a word for', 'neighbours'],
    ]
    for (const [idea, cast] of expected) {
      assert.equal(world(idea).customers, cast, idea)
    }
  })

  test('a shop that is not about animals never shows pets or creatures', () => {
    const animalCasts = ['pet-owners', 'dragons', 'bakers', 'villagers', 'gardeners', 'crafters']
    for (const idea of ['Fashion boutique', 'Hat shop', 'Toy shop', 'Shoe store', 'Phone repair', 'Car wash']) {
      assert.equal(animalCasts.includes(world(idea).customers), false, idea)
    }
  })

  test('every cast has a name, and the same idea always gets the same cast', () => {
    for (const cast of CUSTOMER_CASTS) assert.ok(CAST_NAMES[cast])
    assert.deepEqual(world('Fairy fashion boutique'), world('Fairy fashion boutique'))
  })

  test('the player\'s idea outranks the AI\'s pick, which outranks other hints', () => {
    const base = { theme: 'general-store' as const, idea: 'Sparkle shop' }
    assert.equal(pickCustomerCast({ ...base, idea: 'Fairy hat shop', suggested: 'pet-owners' }), 'fairies')
    assert.equal(pickCustomerCast({ ...base, suggested: 'kids', audience: 'dragon parents' }), 'kids')
    assert.equal(pickCustomerCast({ ...base, audience: 'Friends who love dressing up' }), 'shoppers')
    assert.equal(pickCustomerCast({ ...base, offering: 'Teddy bears' }), 'kids')
    assert.equal(pickCustomerCast(base), 'neighbours')
    // An unknown suggestion is ignored, never drawn.
    assert.equal(pickCustomerCast({ ...base, suggested: 'robots' as never }), 'neighbours')
  })
})

describe('icons and props match the business', () => {
  test('fashion and toy shops have their own look', () => {
    const boutique = world('Fairy clothing shop', 'Sell clothes')
    assert.equal(boutique.productIcon, 'dress')
    assert.ok(boutique.props.includes('clothesRack'))
    assert.match(boutique.label, /fashion boutique/)
    assert.ok(boutique.decorations.includes('sparkles'))

    const toys = world('Toy shop')
    assert.equal(toys.productIcon, 'toy')
    assert.ok(toys.props.includes('toyChest'))
    // No dog ball and bone in a toy shop.
    assert.equal(toys.props.includes('ball'), false)
  })

  test('the first product can still pick the icon', () => {
    assert.equal(world('My shop', 'Party hats').productIcon, 'dress')
    assert.equal(world('My shop', 'Teddy bears').productIcon, 'toy')
    assert.equal(world('Magical bakery', 'Cloud cupcakes').productIcon, 'cupcake')
  })

  test('everything new is on the AI\'s allowed lists', () => {
    for (const prop of ['clothesRack', 'mannequin', 'toyChest']) assert.ok((PROPS as readonly string[]).includes(prop))
    for (const icon of ['dress', 'toy']) assert.ok((PRODUCT_ICONS as readonly string[]).includes(icon))
  })
})

describe('customers match the business (AI worlds)', () => {
  const reply = {
    kidSafe: true,
    summary: 'A bright little boutique where outfits are dreamed up.',
    label: 'Sparkle Style Boutique',
    theme: 'general-store', kind: 'product', structure: 'stall', biome: 'park', timeOfDay: 'day',
    props: ['clothesRack', 'mannequin'], decorations: ['bunting'],
    productIcon: 'dress', wallColor: 'blush', accentColor: 'magenta',
    customers: 'Friends and families who love dressing up.',
    customerCast: 'shoppers',
    reactions: ['So stylish!', 'I love it!'],
    offerings: ['Sparkly scarves'],
    concepts: [
      { id: 'pricing', why: 'Set a fair price.' },
      { id: 'marketing', why: 'Show off your outfits.' },
    ],
  }
  const build = (idea: string, patch: object = {}) => {
    const direction = parseWorldDirection({ ...reply, ...patch })
    assert.ok(direction)
    return buildWorld({ idea, offering: '', style: 'cottage' }, direction).blueprint
  }

  test('the Director\'s cast is used', () => {
    const blueprint = build('High-end style house')
    assert.equal(blueprint.customers, 'shoppers')
    assert.equal(blueprint.productIcon, 'dress')
    assert.deepEqual(blueprint.props, ['clothesRack', 'mannequin'])
  })

  test('an unsupported or missing cast falls back to a themed one, not a random one', () => {
    assert.equal(build('High-end style house', { customerCast: 'wizards' }).customers, 'shoppers')
    // A world saved before casts existed: no field at all.
    const old: Record<string, unknown> = { ...reply }
    delete old.customerCast
    const direction = parseWorldDirection(old)
    assert.equal(direction?.customerCast, null)
    assert.equal(buildWorld({ idea: 'Sparkle shop', offering: '', style: 'cottage' }, direction!).blueprint.customers, 'shoppers')
  })

  test('a fairy idea shows fairies even if the Director picked something else', () => {
    assert.equal(build('Fairy fashion boutique', { customerCast: 'pet-owners' }).customers, 'fairies')
  })
})

describe('tidy names', () => {
  test('a suggested shop name never ends on a dangling word', () => {
    assert.equal(suggestShopName('Clara', 'Luxury fashion boutique for fairies'), "Clara's Luxury Fashion Boutique")
    assert.equal(suggestShopName('Clara', 'a luxury fashion boutique for'), "Clara's Luxury Fashion Boutique")
    assert.equal(suggestShopName('', 'Star-polishing service for sleepy comets'), 'Star-polishing Service')
    assert.equal(suggestShopName('James', 'the dragon daycare'), "James' Dragon Daycare")
    assert.equal(suggestShopName('Clara', 'Shop of wonders and'), "Clara's Shop of Wonders")
    assert.equal(suggestShopName('', ''), 'Shop')
  })

  test('long names are cut at whole words and always fit', () => {
    const ideas = [
      'Extraordinary international chocolate emporium',
      'supercalifragilisticexpialidocious-superextraordinary thing',
      'The very best and most wonderful of all the shops in the world',
      'x',
    ]
    for (const idea of ideas) {
      for (const name of ['', 'Jo', 'Maximilian Alexander']) {
        const shop = suggestShopName(name, idea)
        assert.ok(shop.length > 0 && shop.length <= 40, shop)
        assert.doesNotMatch(shop, /\b(for|of|and|the|with|to)$/i, shop)
      }
    }
    assert.equal(
      suggestShopName('Maximilian Alexander', 'Extraordinary international chocolate emporium'),
      'Extraordinary International Chocolate',
    )
  })

  test('"Sell clothes" is shown as "clothes"', () => {
    assert.equal(offeringName('Sell clothes'), 'clothes')
    assert.equal(offeringName('we make cloud cupcakes!'), 'cloud cupcakes')
    assert.equal(offeringName('I will sell fancy hats.'), 'fancy hats')
    assert.equal(offeringName('Dragon naps'), 'Dragon naps')
    assert.equal(offeringName('selling'), 'selling')
    assert.equal(offeringName(''), '')
  })

  test('shorten keeps whole words', () => {
    assert.equal(shorten('one two three four five six seven', 20), 'one two three four…')
    assert.equal(shorten('short', 20), 'short')
    assert.ok(shorten('a'.repeat(60), 20).length <= 20)
  })
})

describe('magical ideas do not borrow the wrong creatures', () => {
  // The Director's reading of "Magical unicorn bakery", as reported.
  const unicornBakery = {
    kidSafe: true,
    summary: 'A sparkly bakery where unicorns and friends buy magical treats.',
    label: 'Rainbow Unicorn Bakery',
    theme: 'bakery', kind: 'product', structure: 'cottage', biome: 'meadow', timeOfDay: 'day',
    props: ['cakeStand', 'breadBasket'], decorations: ['sparkles'],
    productIcon: 'cupcake', wallColor: 'blush', accentColor: 'magenta',
    customers: 'Unicorns and their friends who love magical treats.',
    reactions: ['So sparkly!', 'Yum!'],
    offerings: ['Rainbow cupcakes'],
    concepts: [
      { id: 'pricing', why: 'Set a fair price.' },
      { id: 'inventory', why: 'Bake enough for everyone.' },
    ],
  }
  const ai = (idea: string, reply: object) => {
    const direction = parseWorldDirection(reply)
    assert.ok(direction)
    return buildWorld({ idea, offering: '', style: 'cottage' }, direction).blueprint
  }

  test('unicorn bakery (built-in rules): a bakery with bakery customers, not dragons', () => {
    const b = world('Magical unicorn bakery')
    assert.equal(b.theme, 'bakery')
    assert.equal(b.customers, 'bakers')
    assert.equal(b.productIcon, 'cupcake')
    assert.equal(castLabel(b.customers, 'Magical unicorn bakery'), 'Hungry villagers')
  })

  test('unicorn bakery (AI world): bakery customers whatever cast the Director picked', () => {
    for (const customerCast of ['dragons', 'bakers', 'fairies', 'pet-owners', 'neighbours', 'wizards']) {
      const b = ai('Magical unicorn bakery', { ...unicornBakery, customerCast })
      assert.equal(b.customers, 'bakers', customerCast)
    }
    // A world saved before casts existed has no pick at all.
    const old: Record<string, unknown> = { ...unicornBakery }
    delete old.customerCast
    assert.equal(ai('Magical unicorn bakery', old).customers, 'bakers')
  })

  test('customers the game cannot draw get a neutral cast, never another magical creature', () => {
    const species = ['fairies', 'dragons', 'pet-owners']
    for (const idea of ['Unicorn daycare', 'Unicorn grooming salon', 'Mermaid cafe', 'Robot repair shop', 'Magical unicorn rides', 'Wizard school', 'Alien snack bar']) {
      assert.equal(species.includes(world(idea).customers), false, `${idea}: ${world(idea).customers}`)
    }
    assert.equal(world('Unicorn daycare').customers, 'neighbours')
    // Even if the Director suggests one, with nothing written to support it.
    assert.equal(pickCustomerCast({ theme: 'creature-care', idea: 'Unicorn daycare', suggested: 'dragons', audience: 'Unicorn parents' }), 'neighbours')
    assert.equal(pickCustomerCast({ theme: 'general-store', idea: 'Sparkle shop', suggested: 'fairies', audience: 'Magical shoppers' }), 'neighbours')
  })

  test('a species cast is still used when something written supports it', () => {
    assert.equal(pickCustomerCast({ theme: 'general-store', idea: 'Sparkle shop', suggested: 'fairies', audience: 'Tiny fairies from the meadow' }), 'fairies')
    assert.equal(pickCustomerCast({ theme: 'bakery', idea: 'Snack cave', suggested: 'dragons', audience: 'Hungry dragons' }), 'dragons')
    assert.equal(pickCustomerCast({ theme: 'general-store', idea: 'Treat shop', offering: 'Dog biscuits', suggested: 'pet-owners' }), 'pet-owners')
    // The player's own idea still comes first.
    assert.equal(pickCustomerCast({ theme: 'bakery', idea: 'Cosy bakery', suggested: 'dragons', audience: 'Hungry dragons' }), 'bakers')
  })

  test('the five reference businesses keep the right customers', () => {
    const expected: [string, string, string][] = [
      ['Magical unicorn bakery', 'bakers', 'Hungry villagers'],
      ['Fairy fashion boutique', 'fairies', 'Fairy folk'],
      ['Dragon daycare', 'dragons', 'Dragon families'],
      ['Pet sitting', 'pet-owners', 'Pet owners'],
      ['Bakery', 'bakers', 'Hungry villagers'],
    ]
    for (const [idea, cast, label] of expected) {
      assert.equal(world(idea).customers, cast, idea)
      assert.equal(castLabel(world(idea).customers, idea), label, idea)
    }
  })

  test('characters are only named for what they look like', () => {
    assert.equal(castLabel('dragons', 'Dragon daycare'), 'Dragon families')
    assert.equal(castLabel('dragons', 'Monster nursery'), 'Creature families')
    assert.equal(castLabel('dragons', 'Dinosaur daycare'), 'Creature families')
    for (const name of Object.values(CAST_NAMES)) assert.doesNotMatch(name, /unicorn|mermaid|robot/i)
    assert.equal(world('Monster nursery').customers, 'dragons')
  })
})
