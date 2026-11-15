import { parseWorldDirection } from '../ai/schema.ts'
import type { WorldDirection } from '../ai/schema.ts'
import { ideaKey } from '../ai/world.ts'
import { parseGame } from '../game/state.ts'
import type { GameState } from '../game/state.ts'
import type { StyleId } from '../world/blueprint.ts'

/**
 * My Worlds: every business a player has made, each with its own shop,
 * AI-imagined world and game days. Nothing is shared between worlds.
 *
 * This file is plain logic over a tiny key-value interface, so the same code
 * runs against the browser's localStorage and against a fake in the tests.
 * Saves live in this browser on this device only; there is no online copy.
 */

export type Shop = {
  /** 'create' while the player is still shaping it, 'ready' once saved. */
  step: 'create' | 'ready'
  playerName: string
  idea: string
  shopName: string
  theme: StyleId
  offering: string
}

export type SavedWorld = {
  /** Stable for the life of the world; never reused. */
  id: string
  createdAt: number
  updatedAt: number
  shop: Shop
  /** The AI Director's checked reading of this world's idea, if any. */
  direction: WorldDirection | null
  /** This world's own days, cash and shelf. Null before its first day. */
  game: GameState | null
}

export type WorldStore = {
  version: 2
  worlds: SavedWorld[]
  /** The world most recently opened, for the home screen's Continue. */
  lastWorldId: string | null
}

/** The part of localStorage this needs. */
export type KeyValue = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export const KEYS = {
  store: 'mini-mogul:worlds',
  /** The single-world save from before My Worlds existed. Never deleted. */
  legacyShop: 'mini-mogul:progress',
  legacyGame: 'mini-mogul:game',
  legacyAi: 'mini-mogul:ai-worlds',
  /** An untouched copy of the legacy save, made once at migration. */
  legacyBackup: 'mini-mogul:legacy-backup',
  /** A copy of a store that could not be read, kept before starting again. */
  damagedBackup: 'mini-mogul:worlds-damaged-backup',
} as const

const STYLES: StyleId[] = ['cottage', 'forest', 'seaside', 'starlight']

export const emptyStore = (): WorldStore => ({ version: 2, worlds: [], lastWorldId: null })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.slice(0, max) : ''

// ---- Reading saved data (nothing saved is trusted) ---------------------------------

/** A usable shop, or null if there is no idea to build on. */
export function parseShop(value: unknown): Shop | null {
  if (!isRecord(value)) return null
  const idea = text(value.idea, 200).trim()
  if (!idea) return null
  return {
    step: value.step === 'ready' ? 'ready' : 'create',
    playerName: text(value.playerName, 60),
    idea,
    shopName: text(value.shopName, 80),
    theme: STYLES.includes(value.theme as StyleId) ? (value.theme as StyleId) : 'cottage',
    offering: text(value.offering, 80),
  }
}

function parseWorld(value: unknown): SavedWorld | null {
  if (!isRecord(value)) return null
  const shop = parseShop(value.shop)
  if (!shop || typeof value.id !== 'string' || !value.id) return null
  const time = (t: unknown) => (typeof t === 'number' && Number.isFinite(t) ? t : 0)
  return {
    id: value.id,
    createdAt: time(value.createdAt),
    updatedAt: time(value.updatedAt),
    shop,
    // A damaged world or game is dropped on its own; the shop still opens.
    direction: parseWorldDirection(value.direction),
    game: parseGame(value.game),
  }
}

/** Reads a store, keeping every world that is still readable. */
export function parseStore(value: unknown): WorldStore | null {
  if (!isRecord(value) || !Array.isArray(value.worlds)) return null
  const worlds: SavedWorld[] = []
  for (const entry of value.worlds) {
    const world = parseWorld(entry)
    if (world && !worlds.some((w) => w.id === world.id)) worlds.push(world)
  }
  const last = typeof value.lastWorldId === 'string' ? value.lastWorldId : null
  return {
    version: 2,
    worlds,
    lastWorldId: worlds.some((w) => w.id === last) ? last : null,
  }
}

function readJson(storage: KeyValue, key: string): { raw: string | null; value: unknown } {
  try {
    const raw = storage.getItem(key)
    if (raw === null) return { raw, value: undefined }
    try {
      return { raw, value: JSON.parse(raw) }
    } catch {
      return { raw, value: undefined }
    }
  } catch {
    return { raw: null, value: undefined }
  }
}

function writeRaw(storage: KeyValue, key: string, raw: string): boolean {
  try {
    storage.setItem(key, raw)
    return true
  } catch {
    // Storage can be full or switched off; the game still runs for this visit.
    return false
  }
}

// ---- Moving the old single save into My Worlds --------------------------------------

/**
 * Builds a world from the single-shop save used before My Worlds. Returns
 * null when there is nothing (or nothing readable) to bring across.
 */
export function migrateLegacy(
  legacy: { shop: unknown; game: unknown; ai: unknown },
  id: string,
  now: number,
): SavedWorld | null {
  const shop = parseShop(legacy.shop)
  if (!shop) return null

  // The old AI cache was keyed by idea; take only this shop's entry.
  let direction: WorldDirection | null = null
  if (Array.isArray(legacy.ai)) {
    const key = ideaKey(shop.idea)
    const match = legacy.ai.find((entry) => isRecord(entry) && entry.key === key)
    direction = isRecord(match) ? parseWorldDirection(match.direction) : null
  }

  return {
    id,
    createdAt: now,
    updatedAt: now,
    shop,
    direction,
    // Game days only ever belonged to a finished shop.
    game: shop.step === 'ready' ? parseGame(legacy.game) : null,
  }
}

/**
 * Loads My Worlds. The first time it runs on a device with an old save, it
 * copies that save into the new store, keeps an untouched backup, and leaves
 * the old keys where they were. After that the new store is simply read, so
 * running it again changes nothing.
 */
export function loadStore(storage: KeyValue, makeId: () => string, now: number): WorldStore {
  const saved = readJson(storage, KEYS.store)
  if (saved.raw !== null) {
    const store = parseStore(saved.value)
    if (store) return store
    // Unreadable: keep what was there before starting again.
    if (readJson(storage, KEYS.damagedBackup).raw === null) {
      writeRaw(storage, KEYS.damagedBackup, saved.raw)
    }
  }

  const shop = readJson(storage, KEYS.legacyShop)
  const game = readJson(storage, KEYS.legacyGame)
  const ai = readJson(storage, KEYS.legacyAi)

  const store = emptyStore()
  const world = migrateLegacy({ shop: shop.value, game: game.value, ai: ai.value }, makeId(), now)
  if (world) {
    store.worlds.push(world)
    store.lastWorldId = world.id
  }

  if (shop.raw !== null && readJson(storage, KEYS.legacyBackup).raw === null) {
    writeRaw(
      storage,
      KEYS.legacyBackup,
      JSON.stringify({ savedAt: now, shop: shop.raw, game: game.raw, ai: ai.raw }),
    )
  }
  saveStore(storage, store)
  return store
}

export function saveStore(storage: KeyValue, store: WorldStore): boolean {
  return writeRaw(storage, KEYS.store, JSON.stringify(store))
}

// ---- Changing the store (each returns a new store) -----------------------------------

export function findWorld(store: WorldStore, id: string | null): SavedWorld | null {
  return store.worlds.find((world) => world.id === id) ?? null
}

/** Adds a world, or replaces the one with the same id. */
export function putWorld(store: WorldStore, world: SavedWorld): WorldStore {
  const exists = store.worlds.some((w) => w.id === world.id)
  return {
    ...store,
    worlds: exists
      ? store.worlds.map((w) => (w.id === world.id ? world : w))
      : [...store.worlds, world],
    lastWorldId: world.id,
  }
}

/** Changes one world and nothing else. Unknown ids leave the store as it was. */
export function updateWorld(
  store: WorldStore,
  id: string,
  change: (world: SavedWorld) => SavedWorld,
  now: number,
): WorldStore {
  if (!store.worlds.some((w) => w.id === id)) return store
  return {
    ...store,
    worlds: store.worlds.map((w) => (w.id === id ? { ...change(w), id, updatedAt: now } : w)),
  }
}

export function removeWorld(store: WorldStore, id: string): WorldStore {
  return {
    ...store,
    worlds: store.worlds.filter((w) => w.id !== id),
    lastWorldId: store.lastWorldId === id ? null : store.lastWorldId,
  }
}

export function openWorld(store: WorldStore, id: string): WorldStore {
  return store.worlds.some((w) => w.id === id) ? { ...store, lastWorldId: id } : store
}

/** Most recently played or edited first. */
export function recentFirst(store: WorldStore): SavedWorld[] {
  return [...store.worlds].sort((a, b) => b.updatedAt - a.updatedAt)
}

export function newWorld(id: string, shop: Shop, now: number): SavedWorld {
  return { id, createdAt: now, updatedAt: now, shop, direction: null, game: null }
}
