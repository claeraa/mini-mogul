import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { PRODUCT_SHOP } from '../src/game/model.ts'
import { newGame } from '../src/game/state.ts'
import {
  KEYS,
  emptyStore,
  findWorld,
  loadStore,
  newWorld,
  openWorld,
  parseStore,
  putWorld,
  recentFirst,
  removeWorld,
  saveStore,
  updateWorld,
} from '../src/worlds/store.ts'
import type { KeyValue, Shop } from '../src/worlds/store.ts'

/** A stand-in for localStorage. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: KeyValue = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
  return { storage, data }
}

let counter = 0
const makeId = () => `w${(counter += 1)}`

const shop = (idea: string, patch: Partial<Shop> = {}): Shop => ({
  step: 'ready',
  playerName: 'Sam',
  idea,
  shopName: `${idea} shop`,
  theme: 'cottage',
  offering: 'things',
  ...patch,
})

const direction = {
  summary: 'A cosy tower where sleepy comets get their sparkle back.',
  label: 'Comet polishing tower',
  theme: 'general-store', kind: 'service', structure: 'tower', biome: 'crags', timeOfDay: 'night',
  props: ['lantern', 'barrel'], decorations: ['sparkles'],
  productIcon: 'gift', wallColor: 'lavender', accentColor: 'sunshine',
  customers: 'Sleepy comets on their way home',
  reactions: ['So shiny!', 'Zoom zoom!'],
  offerings: ['Sparkle polish'],
  concepts: [
    { id: 'pricing', why: 'Pick a price comets are happy to pay.' },
    { id: 'demand', why: 'More comets visit when the price is friendly.' },
  ],
}

const legacyGame = { ...newGame(PRODUCT_SHOP, 42), day: 5, cashCents: 7350, inventory: 4 }

describe('migrating the old single save', () => {
  test('a finished shop, its game days and its AI world all come across', () => {
    const legacy = {
      [KEYS.legacyShop]: JSON.stringify(shop('Star polishing')),
      [KEYS.legacyGame]: JSON.stringify(legacyGame),
      [KEYS.legacyAi]: JSON.stringify([
        { key: 'something else', direction: { ...direction, label: 'Other world' } },
        { key: 'star polishing', direction },
      ]),
    }
    const { storage, data } = fakeStorage(legacy)
    const store = loadStore(storage, makeId, 1000)

    assert.equal(store.worlds.length, 1)
    const world = store.worlds[0]
    assert.equal(world.shop.idea, 'Star polishing')
    assert.equal(world.shop.step, 'ready')
    assert.equal(world.game?.day, 5)
    assert.equal(world.game?.cashCents, 7350)
    assert.equal(world.game?.inventory, 4)
    assert.equal(world.direction?.label, 'Comet polishing tower')
    assert.equal(store.lastWorldId, world.id)

    // The old save is left exactly as it was, and a backup copy is kept.
    for (const key of [KEYS.legacyShop, KEYS.legacyGame, KEYS.legacyAi]) {
      assert.equal(data.get(key), legacy[key])
    }
    const backup = JSON.parse(data.get(KEYS.legacyBackup)!)
    assert.equal(backup.shop, legacy[KEYS.legacyShop])
    assert.equal(backup.game, legacy[KEYS.legacyGame])
  })

  test('running it again changes nothing', () => {
    const { storage, data } = fakeStorage({
      [KEYS.legacyShop]: JSON.stringify(shop('Bakery')),
      [KEYS.legacyGame]: JSON.stringify(legacyGame),
    })
    const first = loadStore(storage, makeId, 1000)
    const snapshot = new Map(data)
    const second = loadStore(storage, makeId, 2000)
    const third = loadStore(storage, makeId, 3000)
    assert.deepEqual(second, first)
    assert.deepEqual(third, first)
    assert.deepEqual(new Map(data), snapshot)
  })

  test('progress made after migrating is never replaced by the old save', () => {
    const { storage } = fakeStorage({
      [KEYS.legacyShop]: JSON.stringify(shop('Bakery')),
      [KEYS.legacyGame]: JSON.stringify(legacyGame),
    })
    let store = loadStore(storage, makeId, 1000)
    const id = store.worlds[0].id
    store = updateWorld(store, id, (w) => ({ ...w, game: { ...w.game!, day: 9, cashCents: 12000 } }), 1500)
    saveStore(storage, store)
    const again = loadStore(storage, makeId, 2000)
    assert.equal(again.worlds.length, 1)
    assert.equal(again.worlds[0].game?.day, 9)
    assert.equal(again.worlds[0].game?.cashCents, 12000)
  })

  test('an unfinished shop comes across unfinished, without game days', () => {
    const { storage } = fakeStorage({
      [KEYS.legacyShop]: JSON.stringify(shop('Half an idea', { step: 'create', shopName: '' })),
      [KEYS.legacyGame]: JSON.stringify(legacyGame),
    })
    const world = loadStore(storage, makeId, 1000).worlds[0]
    assert.equal(world.shop.step, 'create')
    assert.equal(world.game, null)
  })

  test('nothing saved gives an empty My Worlds', () => {
    const { storage, data } = fakeStorage()
    assert.deepEqual(loadStore(storage, makeId, 1000), emptyStore())
    assert.equal(data.has(KEYS.legacyBackup), false)
  })

  test('damaged or incomplete old saves never crash and never lose the shop', () => {
    // Unreadable shop: nothing to migrate, but the raw text is still backed up.
    const broken = fakeStorage({ [KEYS.legacyShop]: '{not json' })
    assert.equal(loadStore(broken.storage, makeId, 1000).worlds.length, 0)
    assert.equal(JSON.parse(broken.data.get(KEYS.legacyBackup)!).shop, '{not json')

    // Good shop, damaged game and AI cache: the shop opens with a fresh game.
    const partial = fakeStorage({
      [KEYS.legacyShop]: JSON.stringify(shop('Bakery')),
      [KEYS.legacyGame]: '{"version":1,"day":"three"}',
      [KEYS.legacyAi]: '[[[',
    })
    const world = loadStore(partial.storage, makeId, 1000).worlds[0]
    assert.equal(world.shop.idea, 'Bakery')
    assert.equal(world.game, null)
    assert.equal(world.direction, null)

    // Missing fields are filled in; an unknown style falls back.
    const sparse = fakeStorage({ [KEYS.legacyShop]: JSON.stringify({ idea: 'Kites', theme: 'lava' }) })
    const kites = loadStore(sparse.storage, makeId, 1000).worlds[0].shop
    assert.deepEqual(kites, { step: 'create', playerName: '', idea: 'Kites', shopName: '', theme: 'cottage', offering: '' })

    // No idea at all is not a shop.
    for (const raw of ['null', '[]', '42', '{"idea":"  "}']) {
      assert.equal(loadStore(fakeStorage({ [KEYS.legacyShop]: raw }).storage, makeId, 1).worlds.length, 0)
    }
  })

  test('a damaged My Worlds store is backed up, not silently thrown away', () => {
    const { storage, data } = fakeStorage({
      [KEYS.store]: '{"version":2,"worlds":',
      [KEYS.legacyShop]: JSON.stringify(shop('Bakery')),
    })
    const store = loadStore(storage, makeId, 1000)
    assert.equal(data.get(KEYS.damagedBackup), '{"version":2,"worlds":')
    // The old single save is still there to fall back on.
    assert.equal(store.worlds[0].shop.idea, 'Bakery')
  })

  test('storage that refuses writes still loads', () => {
    const storage: KeyValue = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    assert.deepEqual(loadStore(storage, makeId, 1), emptyStore())
    assert.equal(saveStore(storage, emptyStore()), false)
  })
})

describe('many worlds, each with its own progress', () => {
  const build = () => {
    let store = emptyStore()
    store = putWorld(store, newWorld('a', shop('Dragon daycare'), 10))
    store = putWorld(store, newWorld('b', shop('Magical bakery'), 20))
    // Two worlds may even share an idea and still be separate.
    store = putWorld(store, newWorld('c', shop('Magical bakery', { shopName: 'Second bakery' }), 30))
    return store
  }

  test('creating a world never removes or changes another', () => {
    const store = build()
    assert.deepEqual(store.worlds.map((w) => w.id), ['a', 'b', 'c'])
    assert.equal(findWorld(store, 'a')?.shop.idea, 'Dragon daycare')
    assert.equal(store.lastWorldId, 'c')
  })

  test('game days, cash and AI worlds do not leak between worlds', () => {
    let store = build()
    const before = structuredClone(store)
    store = updateWorld(store, 'b', (w) => ({
      ...w,
      game: { ...newGame(PRODUCT_SHOP, 7), day: 4, cashCents: 9900, inventory: 6 },
      direction: parseStore({ worlds: [{ id: 'x', shop: shop('x'), direction }] })!.worlds[0].direction,
    }), 99)

    assert.equal(findWorld(store, 'b')?.game?.cashCents, 9900)
    assert.equal(findWorld(store, 'b')?.direction?.label, 'Comet polishing tower')
    // Same idea, different world: untouched.
    assert.deepEqual(findWorld(store, 'c'), findWorld(before, 'c'))
    assert.deepEqual(findWorld(store, 'a'), findWorld(before, 'a'))
    assert.equal(findWorld(store, 'c')?.game, null)
    assert.equal(findWorld(store, 'c')?.direction, null)
    // The original store object was not mutated.
    assert.deepEqual(before, build())
  })

  test('editing a world keeps its id and its game', () => {
    let store = build()
    store = updateWorld(store, 'a', (w) => ({ ...w, game: newGame(PRODUCT_SHOP, 3) }), 40)
    store = updateWorld(store, 'a', (w) => ({ ...w, id: 'hijack', shop: { ...w.shop, shopName: 'Renamed nest' } }), 50)
    const world = findWorld(store, 'a')
    assert.equal(world?.shop.shopName, 'Renamed nest')
    assert.equal(world?.game?.seed, 3)
    assert.equal(world?.updatedAt, 50)
    assert.equal(findWorld(store, 'hijack'), null)
    // Changing a world that does not exist does nothing.
    assert.equal(updateWorld(store, 'nope', (w) => w, 60), store)
  })

  test('deleting removes exactly one world', () => {
    let store = openWorld(build(), 'b')
    store = removeWorld(store, 'b')
    assert.deepEqual(store.worlds.map((w) => w.id), ['a', 'c'])
    assert.equal(store.lastWorldId, null)
    assert.equal(removeWorld(store, 'missing').worlds.length, 2)
  })

  test('everything survives a save and reload', () => {
    const { storage } = fakeStorage()
    let store = build()
    store = updateWorld(store, 'a', (w) => ({ ...w, game: { ...newGame(PRODUCT_SHOP, 5), day: 3, cashCents: 4100 } }), 70)
    store = openWorld(store, 'a')
    assert.equal(saveStore(storage, store), true)
    const loaded = loadStore(storage, makeId, 999)
    assert.deepEqual(loaded, store)
    assert.deepEqual(recentFirst(loaded).map((w) => w.id), ['a', 'c', 'b'])
  })

  test('one damaged world does not take the others with it', () => {
    const store = build()
    const raw = JSON.parse(JSON.stringify(store))
    raw.worlds[1] = { id: 'b', shop: { idea: '' } }
    raw.worlds.push('junk', null, { id: 'a', shop: shop('Duplicate id') })
    raw.worlds[2].game = { version: 1, day: -4 }
    raw.lastWorldId = 'b'
    const parsed = parseStore(raw)!
    assert.deepEqual(parsed.worlds.map((w) => w.id), ['a', 'c'])
    assert.equal(findWorld(parsed, 'c')?.game, null)
    assert.equal(findWorld(parsed, 'a')?.shop.idea, 'Dragon daycare')
    assert.equal(parsed.lastWorldId, null)
    assert.equal(parseStore({ worlds: 'no' }), null)
    assert.equal(parseStore(null), null)
  })
})
